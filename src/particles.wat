;; Particle physics for the site's WebGL effects.
;;
;; Every particle is a spring-damper anchored to its home position (a pixel of
;; the photo, or of the "404"). Forces are added to velocity, velocity is damped
;; and integrated. That gives momentum: points get flung, overshoot, and settle
;; — motion the previous stateless shader could only approximate.
;;
;; Memory is supplied by the host as four parallel f32 arrays of 2N values
;; (pos, vel, home, seed) plus a 1024-entry sine table, since wasm has no trig.
;;
;; Build: node tools/build-wasm.mjs

(module
  (import "env" "memory" (memory 1))

  (global $count   (mut i32) (i32.const 0))
  (global $posOff  (mut i32) (i32.const 0))
  (global $velOff  (mut i32) (i32.const 0))
  (global $homeOff (mut i32) (i32.const 0))
  (global $seedOff (mut i32) (i32.const 0))
  (global $sinOff  (mut i32) (i32.const 0))

  (global $spring (mut f32) (f32.const 26))
  (global $damp   (mut f32) (f32.const 4.5))
  (global $wander (mut f32) (f32.const 0.4))
  (global $reach  (mut f32) (f32.const 0.8))
  (global $push   (mut f32) (f32.const 10))
  (global $swirl  (mut f32) (f32.const 0.4))

  (global $waveAmp   (mut f32) (f32.const 0))
  (global $waveSpeed (mut f32) (f32.const 0.08))
  (global $waveFreq  (mut f32) (f32.const 0.135))

  ;; sin(2*pi*t) by table lookup; t is in turns and may be any magnitude
  (func $sinAt (param $t f32) (result f32)
    (f32.load
      (i32.add
        (global.get $sinOff)
        (i32.shl
          (i32.and
            (i32.trunc_f32_u
              (f32.mul
                (f32.sub (local.get $t) (f32.floor (local.get $t)))
                (f32.const 1024)))
            (i32.const 1023))
          (i32.const 2)))))

  (func (export "setup")
    (param $n i32) (param $p i32) (param $v i32) (param $h i32) (param $s i32) (param $t i32)
    (global.set $count   (local.get $n))
    (global.set $posOff  (local.get $p))
    (global.set $velOff  (local.get $v))
    (global.set $homeOff (local.get $h))
    (global.set $seedOff (local.get $s))
    (global.set $sinOff  (local.get $t)))

  (func (export "tune")
    (param $spring f32) (param $damp f32) (param $wander f32)
    (param $reach f32) (param $push f32) (param $swirl f32)
    (global.set $spring (local.get $spring))
    (global.set $damp   (local.get $damp))
    (global.set $wander (local.get $wander))
    (global.set $reach  (local.get $reach))
    (global.set $push   (local.get $push))
    (global.set $swirl  (local.get $swirl)))

  (func (export "wave")
    (param $amp f32) (param $speed f32) (param $freq f32)
    (global.set $waveAmp   (local.get $amp))
    (global.set $waveSpeed (local.get $speed))
    (global.set $waveFreq  (local.get $freq)))

  (func (export "step")
    (param $dt f32) (param $mx f32) (param $my f32) (param $amt f32) (param $time f32)
    (local $i i32)
    (local $po i32) (local $vo i32) (local $ho i32) (local $so i32)
    (local $px f32) (local $py f32) (local $vx f32) (local $vy f32)
    (local $dx f32) (local $dy f32) (local $r2 f32) (local $inv f32)
    (local $fall f32) (local $mag f32) (local $diss f32)
    (local $s0 f32) (local $s1 f32)
    (local $reach2 f32) (local $decay f32)

    (local.set $reach2 (f32.mul (global.get $reach) (global.get $reach)))
    (local.set $decay
      (f32.max (f32.const 0)
        (f32.sub (f32.const 1) (f32.mul (global.get $damp) (local.get $dt)))))
    (local.set $i (i32.const 0))

    (block $done
      (loop $loop
        (br_if $done (i32.ge_u (local.get $i) (global.get $count)))

        (local.set $po (i32.add (global.get $posOff)  (i32.shl (local.get $i) (i32.const 3))))
        (local.set $vo (i32.add (global.get $velOff)  (i32.shl (local.get $i) (i32.const 3))))
        (local.set $ho (i32.add (global.get $homeOff) (i32.shl (local.get $i) (i32.const 3))))
        (local.set $so (i32.add (global.get $seedOff) (i32.shl (local.get $i) (i32.const 3))))

        (local.set $px (f32.load          (local.get $po)))
        (local.set $py (f32.load offset=4 (local.get $po)))
        (local.set $vx (f32.load          (local.get $vo)))
        (local.set $vy (f32.load offset=4 (local.get $vo)))
        (local.set $s0 (f32.load          (local.get $so)))
        (local.set $s1 (f32.load offset=4 (local.get $so)))

        ;; spring toward home
        (local.set $vx (f32.add (local.get $vx)
          (f32.mul (f32.mul (f32.sub (f32.load (local.get $ho)) (local.get $px))
                            (global.get $spring))
                   (local.get $dt))))
        (local.set $vy (f32.add (local.get $vy)
          (f32.mul (f32.mul (f32.sub (f32.load offset=4 (local.get $ho)) (local.get $py))
                            (global.get $spring))
                   (local.get $dt))))

        ;; slow per-particle wander, so nothing ever looks frozen
        (local.set $vx (f32.add (local.get $vx)
          (f32.mul (f32.mul
            (call $sinAt (f32.add (local.get $s0) (f32.mul (local.get $time) (f32.const 0.07))))
            (global.get $wander)) (local.get $dt))))
        (local.set $vy (f32.add (local.get $vy)
          (f32.mul (f32.mul
            (call $sinAt (f32.add (local.get $s1) (f32.mul (local.get $time) (f32.const 0.061))))
            (global.get $wander)) (local.get $dt))))

        ;; pointer repulsion, with a tangential swirl
        (local.set $dx (f32.sub (local.get $px) (local.get $mx)))
        (local.set $dy (f32.sub (local.get $py) (local.get $my)))
        (local.set $r2 (f32.add (f32.mul (local.get $dx) (local.get $dx))
                                (f32.mul (local.get $dy) (local.get $dy))))
        (if (f32.lt (local.get $r2) (local.get $reach2))
          (then
            (local.set $inv (f32.div (f32.const 1)
              (f32.add (f32.sqrt (local.get $r2)) (f32.const 0.0005))))
            (local.set $fall (f32.sub (f32.const 1)
              (f32.div (local.get $r2) (local.get $reach2))))
            (local.set $mag (f32.mul
              (f32.mul (f32.mul (global.get $push) (local.get $amt))
                       (f32.mul (local.get $fall) (local.get $fall)))
              (local.get $dt)))
            (local.set $dx (f32.mul (local.get $dx) (local.get $inv)))
            (local.set $dy (f32.mul (local.get $dy) (local.get $inv)))
            (local.set $vx (f32.add (local.get $vx)
              (f32.mul (f32.sub (local.get $dx) (f32.mul (local.get $dy) (global.get $swirl)))
                       (local.get $mag))))
            (local.set $vy (f32.add (local.get $vy)
              (f32.mul (f32.add (local.get $dy) (f32.mul (local.get $dx) (global.get $swirl)))
                       (local.get $mag))))))

        ;; travelling dissolve wave (the 404 uses this; the portrait sets amp 0)
        (if (f32.gt (global.get $waveAmp) (f32.const 0))
          (then
            (local.set $diss
              (call $sinAt
                (f32.sub (f32.mul (local.get $time) (global.get $waveSpeed))
                         (f32.mul (local.get $px) (global.get $waveFreq)))))
            (local.set $diss (f32.max (f32.const 0)
              (f32.div (f32.sub (local.get $diss) (f32.const 0.35)) (f32.const 0.65))))
            (local.set $mag (f32.mul (f32.mul (global.get $waveAmp) (local.get $diss))
                                     (local.get $dt)))
            (local.set $vx (f32.add (local.get $vx)
              (f32.mul (call $sinAt (f32.add (f32.mul (local.get $s0) (f32.const 7.3))
                                             (f32.mul (local.get $time) (f32.const 0.31))))
                       (local.get $mag))))
            (local.set $vy (f32.add (local.get $vy)
              (f32.mul (call $sinAt (f32.add (f32.mul (local.get $s1) (f32.const 6.1))
                                             (f32.mul (local.get $time) (f32.const 0.27))))
                       (local.get $mag))))))

        ;; damp, then integrate
        (local.set $vx (f32.mul (local.get $vx) (local.get $decay)))
        (local.set $vy (f32.mul (local.get $vy) (local.get $decay)))
        (local.set $px (f32.add (local.get $px) (f32.mul (local.get $vx) (local.get $dt))))
        (local.set $py (f32.add (local.get $py) (f32.mul (local.get $vy) (local.get $dt))))

        (f32.store          (local.get $po) (local.get $px))
        (f32.store offset=4 (local.get $po) (local.get $py))
        (f32.store          (local.get $vo) (local.get $vx))
        (f32.store offset=4 (local.get $vo) (local.get $vy))

        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop))))
)
