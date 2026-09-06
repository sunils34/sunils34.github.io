/* Shared GPU particle engine.
   Points live in a normalized space where y = ±1 is `radius` css px from the
   host's center; each effect supplies its own sampled points and its own
   ambient motion as a GLSL chunk. Pointer repulsion and the intro are common.
   If WebGL is unavailable the DOM underneath (the <img>, the text "404")
   simply stays visible. */
(function () {
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  function vertexSource(chunk) {
    return [
      'precision highp float;',
      'attribute vec2 a_home;',
      'attribute vec3 a_color;',
      'attribute vec2 a_seed;',
      'uniform float u_time;',
      'uniform vec2  u_mouse;',
      'uniform float u_amt;',
      'uniform float u_intro;',
      'uniform float u_radius;',
      'uniform float u_scatter;',
      'uniform vec2  u_res;',
      'uniform vec2  u_center;',
      'uniform float u_size;',
      'varying vec3 v_color;',
      'varying float v_alpha;',

      'void main(){',
      '  vec2 p = a_home;',
      '  float ph = a_seed.x * 6.2831853;',
      '  float fade = 1.0;',
      '  float grow = 0.0;',

      chunk,                                    /* ambient motion per effect */

      /* pointer pushes points outward, with a little swirl */
      '  vec2 d = p - u_mouse;',
      '  float dist = length(d) + 1e-5;',
      '  vec2 dir = d / dist;',
      '  float f = exp(-dist*dist*3.2);',
      '  p += (dir*0.85 + vec2(-dir.y, dir.x)*0.32) * f * u_amt * (0.65 + 0.7*a_seed.y);',

      /* intro: assemble out of a loose cloud */
      '  vec2 scatter = vec2(cos(ph), sin(ph)) * (1.2 + a_seed.y*1.1) * u_scatter;',
      '  p = mix(scatter, p, u_intro);',

      '  vec2 pos = u_center + p * u_radius;',
      '  gl_Position = vec4(pos/u_res*2.0 - 1.0, 0.0, 1.0);',
      '  float luma = dot(a_color, vec3(0.299, 0.587, 0.114));',
      '  gl_PointSize = u_size * (1.0 + 0.30*(1.0-luma) + 0.55*f*u_amt + grow);',
      '  v_color = a_color;',
      '  v_alpha = u_intro * fade;',
      '}'
    ].join('\n');
  }

  var FRAG = [
    'precision mediump float;',
    'uniform vec3 u_tint;',
    'varying vec3 v_color;',
    'varying float v_alpha;',
    'void main(){',
    '  float d = length(gl_PointCoord - 0.5);',
    '  float a = smoothstep(0.5, 0.26, d) * v_alpha;',
    '  if (a <= 0.003) discard;',
    '  gl_FragColor = vec4(v_color * u_tint, a);',
    '}'
  ].join('\n');

  /* opts: points {count, home, color, seed}, fieldW, fieldH, radius,
            displace (glsl), scatter, size, tint */
  function mount(host, opts) {
    var pts = opts.points;
    if (!host || !pts || !pts.count) return null;

    var canvas = document.createElement('canvas');
    canvas.className = 'particles';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.width = opts.fieldW + 'px';
    canvas.style.height = opts.fieldH + 'px';
    canvas.style.marginLeft = -opts.fieldW / 2 + 'px';
    canvas.style.marginTop = -opts.fieldH / 2 + 'px';

    var attrs = { alpha: true, premultipliedAlpha: false, antialias: true };
    var gl = canvas.getContext('webgl', attrs) || canvas.getContext('experimental-webgl', attrs);
    if (!gl) return null;

    var vs = compile(gl, gl.VERTEX_SHADER, vertexSource(opts.displace || ''));
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var u = {};
    ['u_time', 'u_mouse', 'u_amt', 'u_intro', 'u_radius', 'u_scatter',
     'u_res', 'u_center', 'u_size', 'u_tint'].forEach(function (n) {
      u[n] = gl.getUniformLocation(prog, n);
    });

    function attrib(name, data, size, type, norm) {
      var loc = gl.getAttribLocation(prog, name);
      if (loc < 0) return;
      var b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, type, norm, 0, 0);
    }
    attrib('a_home', pts.home, 2, gl.FLOAT, false);
    attrib('a_color', pts.color, 3, gl.UNSIGNED_BYTE, true);
    attrib('a_seed', pts.seed, 2, gl.FLOAT, false);

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    host.appendChild(canvas);
    host.classList.add('is-gl');

    var tint = opts.tint || [1, 1, 1];
    var dpr = 1, radius = 0, size = 2, rect = null, start = 0;
    var mx = 4, my = 4, tx = 4, ty = 4, amt = 0, tAmt = 0;

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(opts.fieldW * dpr);
      canvas.height = Math.round(opts.fieldH * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      rect = host.getBoundingClientRect();
      radius = opts.radius * dpr;
      size = Math.max(1.5, (opts.size || 1.7) * dpr);
    }

    function pointer(cx, cy) {
      if (!rect) return;
      tx = (cx - (rect.left + rect.width / 2)) / opts.radius;
      ty = -(cy - (rect.top + rect.height / 2)) / opts.radius;
      tAmt = 0.55;
    }

    function frame(now) {
      if (!start) start = now;
      var t = (now - start) / 1000;
      var intro = still.matches ? 1 : Math.min(1, t / 1.5);
      intro = 1 - Math.pow(1 - intro, 3);

      mx += (tx - mx) * 0.12;
      my += (ty - my) * 0.12;
      amt += (tAmt - amt) * 0.08;
      tAmt *= 0.94;                    /* the push relaxes once the pointer stops */

      gl.useProgram(prog);
      gl.uniform1f(u.u_time, still.matches ? 0 : t);
      gl.uniform2f(u.u_mouse, mx, my);
      gl.uniform1f(u.u_amt, amt);
      gl.uniform1f(u.u_intro, intro);
      gl.uniform1f(u.u_radius, radius);
      gl.uniform1f(u.u_scatter, opts.scatter || 1);
      gl.uniform2f(u.u_res, canvas.width, canvas.height);
      gl.uniform2f(u.u_center, canvas.width / 2, canvas.height / 2);
      gl.uniform1f(u.u_size, size);
      gl.uniform3fv(u.u_tint, tint);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, pts.count);
      requestAnimationFrame(frame);
    }

    layout();
    requestAnimationFrame(frame);

    window.addEventListener('resize', layout);
    window.addEventListener('scroll', function () { rect = host.getBoundingClientRect(); }, { passive: true });
    window.addEventListener('mousemove', function (e) { pointer(e.clientX, e.clientY); });
    window.addEventListener('mouseout', function (e) { if (!e.relatedTarget) tAmt = 0; });
    window.addEventListener('touchmove', function (e) {
      if (e.touches[0]) pointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    return { setTint: function (c) { tint = c; } };
  }

  window.Particles = { mount: mount, reduced: still };
})();
