/* The avatar, rebuilt on the GPU: one point per sampled pixel of the photo. */
(function () {
  var img = document.querySelector('.avatar');
  var box = document.querySelector('.portrait');
  if (!img || !box || !window.Particles) return;

  var GRID = 220;     // sample resolution of the photo
  var FIELD = 380;    // css px of canvas around the portrait

  var DISPLACE = [
    /* ambient drift: two out-of-phase waves read as a slow curl */
    '  p += vec2(sin(p.y*3.1 + u_time*0.45 + ph),',
    '            cos(p.x*3.4 - u_time*0.39 + a_seed.y*6.2831853)) * 0.016;'
  ].join('\n');

  function sample() {
    var c = document.createElement('canvas');
    c.width = c.height = GRID;
    var ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, GRID, GRID);
    var data;
    try {
      data = ctx.getImageData(0, 0, GRID, GRID).data;
    } catch (e) {
      return null;                       // tainted canvas (e.g. opened over file://)
    }
    var n = GRID * GRID;
    var home = new Float32Array(n * 2);
    var color = new Uint8Array(n * 3);
    var seed = new Float32Array(n * 2);
    var count = 0;
    for (var gy = 0; gy < GRID; gy++) {
      for (var gx = 0; gx < GRID; gx++) {
        var x = (gx + 0.5) / GRID * 2 - 1;
        var y = 1 - (gy + 0.5) / GRID * 2;
        if (x * x + y * y > 1) continue;  // the avatar is a circle
        var i = (gy * GRID + gx) * 4;
        if (data[i + 3] < 8) continue;
        home[count * 2] = x;
        home[count * 2 + 1] = y;
        color[count * 3] = data[i];
        color[count * 3 + 1] = data[i + 1];
        color[count * 3 + 2] = data[i + 2];
        seed[count * 2] = Math.random();
        seed[count * 2 + 1] = Math.random();
        count++;
      }
    }
    return {
      count: count,
      home: home.subarray(0, count * 2),
      color: color.subarray(0, count * 3),
      seed: seed.subarray(0, count * 2)
    };
  }

  function boot() {
    var pts = sample();
    if (!pts) return;                    // leave the plain <img> in place
    var r = box.getBoundingClientRect().width / 2;
    window.Particles.mount(box, {
      points: pts,
      fieldW: FIELD,
      fieldH: FIELD,
      radius: r,
      size: (r * 2) / GRID * 1.55,
      displace: DISPLACE
    });
  }

  if (img.complete && img.naturalWidth) boot();
  else img.addEventListener('load', boot);
})();
