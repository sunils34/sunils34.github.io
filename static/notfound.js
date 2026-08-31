/* 404 rendered as points: the digits hold, then a wave of dissolution
   travels across them and they pull themselves back together. */
(function () {
  var glyph = document.querySelector('.glyph');
  var label = document.querySelector('.four');
  if (!glyph || !label || !window.Particles) return;

  var STEP = 1.0;      // css px between samples
  var SS = 2;          // supersampling of the text raster

  var DISPLACE = [
    /* a travelling wave that dissolves the digits and lets them settle */
    '  float sweep = sin(u_time*0.5 - p.x*0.85);',
    '  float diss = smoothstep(0.35, 1.0, sweep);',
    '  vec2 turb = vec2(sin(a_seed.x*41.0 + u_time*1.7),',
    '                   cos(a_seed.y*37.0 + u_time*1.4));',
    '  p += turb * diss * (0.05 + 0.20*a_seed.y);',
    '  p.y += diss * 0.06 * (a_seed.x - 0.3);',
    '  fade *= 1.0 - 0.45*diss;',
    '  grow += 0.5*diss;',
    /* baseline shimmer so the intact digits never look printed on */
    '  p += vec2(sin(p.y*2.2 + u_time*0.6 + ph),',
    '            cos(p.x*2.0 - u_time*0.5 + a_seed.y*6.2831853)) * 0.011;'
  ].join('\n');

  function tintOf(el) {
    var m = getComputedStyle(el).color.match(/[\d.]+/g);
    return m ? [m[0] / 255, m[1] / 255, m[2] / 255] : [1, 1, 1];
  }

  function sample(w, h, radius) {
    var c = document.createElement('canvas');
    c.width = w * SS;
    c.height = h * SS;
    var ctx = c.getContext('2d');
    ctx.scale(SS, SS);

    var cs = getComputedStyle(label);
    var size = h * 0.86;
    ctx.font = '600 ' + size + 'px ' + cs.fontFamily;
    var wide = ctx.measureText('404').width;
    var max = w * 0.84;
    if (wide > max) {
      size *= max / wide;
      ctx.font = '600 ' + size + 'px ' + cs.fontFamily;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('404', w / 2, h / 2);

    var data;
    try {
      data = ctx.getImageData(0, 0, c.width, c.height).data;
    } catch (e) {
      return null;
    }

    var cols = Math.floor(w / STEP), rows = Math.floor(h / STEP);
    var n = cols * rows;
    var home = new Float32Array(n * 2);
    var color = new Uint8Array(n * 3);
    var seed = new Float32Array(n * 2);
    var count = 0;
    for (var ry = 0; ry < rows; ry++) {
      for (var rx = 0; rx < cols; rx++) {
        var px = Math.floor((rx + 0.5) * STEP * SS);
        var py = Math.floor((ry + 0.5) * STEP * SS);
        if (data[(py * c.width + px) * 4 + 3] < 110) continue;
        home[count * 2] = ((rx + 0.5) * STEP - w / 2) / radius;
        home[count * 2 + 1] = (h / 2 - (ry + 0.5) * STEP) / radius;
        color[count * 3] = color[count * 3 + 1] = color[count * 3 + 2] = 255;
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
    var r = glyph.getBoundingClientRect();
    var w = Math.round(r.width);
    var h = Math.round(r.height);
    if (!w || !h) return;
    var radius = h / 2;

    var pts = sample(w, h, radius);
    if (!pts || !pts.count) return;      // leave the plain "404" in place

    var handle = window.Particles.mount(glyph, {
      points: pts,
      fieldW: Math.min(w + 140, window.innerWidth - 16),
      fieldH: h * 2,
      radius: radius,
      size: 1.7,
      scatter: 1.9,
      tint: tintOf(label),
      displace: DISPLACE
    });
    if (!handle) return;

    var onTheme = function () { handle.setTint(tintOf(label)); };
    var dark = window.matchMedia('(prefers-color-scheme: dark)');
    if (dark.addEventListener) dark.addEventListener('change', onTheme);
    window.addEventListener('themechange', onTheme);   // manual toggle
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
  else boot();
})();
