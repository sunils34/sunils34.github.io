# Working in this repo

Static personal site. **No build step, no package manager, no runtime
dependencies** — keep it that way. Files are served exactly as they sit on disk.

`src/particles.wat` and `tools/` are a shelved experiment: the particle motion
was once integrated in WebAssembly. It worked, but the shader-only rendering
looked better and was preferred, so nothing references it and nothing ships it.
Don't wire it back in without being asked.

## Conventions

- Vanilla JS in IIFEs, ES5-compatible syntax, no modules or bundler.
- CSS lives entirely in `static/style.css`. Colors go through the `--bg` / `--fg`
  / `--muted` / `--rule` tokens so light and dark both work; never hardcode a
  color outside `:root`.
- Theme tokens are defined in three places and all three must stay in sync:
  `:root` (light), `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])`,
  and `:root[data-theme="dark"]`. Anything that reads a themed color at runtime
  (the 404 tint) must listen for the `themechange` event as well as the media query.
- Content is the user's own; don't invent bio lines, links, or copy.
- Every WebGL effect must degrade to the DOM underneath it. The pattern: the real
  element renders normally, the engine adds `is-gl` to the host on success, and
  CSS fades the fallback out.

## Adding a particle effect

Supply points and a GLSL chunk to `Particles.mount()` (see `portrait.js` and
`notfound.js`); don't write a second engine. The chunk operates on `vec2 p` and
may adjust `fade` and `grow`. Pointer repulsion, the intro, resize handling, and
reduced-motion are already handled.

## Verifying a change

Chrome's extension can't reach localhost here, so check renders with headless
Chrome instead:

```sh
python3 -m http.server 8787
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --use-gl=swiftshader --enable-unsafe-swiftshader \
  --hide-scrollbars --window-size=1000,900 --virtual-time-budget=4000 \
  --screenshot=/tmp/shot.png http://localhost:8787/
```

Headless only runs a handful of animation frames, so a screenshot catches the
intro mid-assembly. To inspect a specific state, copy the site to a scratch dir
and pin `intro` and `u_time` in `particles.js` there — never in the real files.
