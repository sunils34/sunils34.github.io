# sunilsadasivan.com

Personal site. Static, no build step, no dependencies.

## Structure

```
index.html          home — portrait, bio, links
404.html            not-found page
static/style.css    all styles (light + dark, theme-aware tokens)
static/theme.js     light/dark toggle
static/particles.js shared WebGL particle engine
static/portrait.js  samples avatar.png into points
static/notfound.js  rasterizes "404" into points
static/avatar.png   source photo
```

## Run locally

```sh
python3 -m http.server 8787
open http://localhost:8787/
```

Serve it over HTTP rather than opening `index.html` directly — over `file://` the
browser taints the canvas the samplers read from, so the particle portrait is
skipped and the plain `<img>` shows instead.

## Theme

The system preference is the default. The toggle (top right) writes an explicit
choice to `data-theme` on `<html>` and to `localStorage`; a small inline script in
each page's `<head>` applies it before first paint so there's no flash. Toggling
back to whatever the system says clears the override, so the page follows the OS
again.

## The WebGL bits

### The engine

`particles.js` is one engine used by both pages. Each effect supplies:

- **points** — `home` positions in a normalized space (`y = ±1` is `radius` css
  px from the host's center), a color per point, and two random seeds
- **a GLSL chunk** — its ambient motion, injected into the shared vertex shader

The engine owns everything else: program setup, static buffers, pointer
repulsion, the assemble-in intro, resize, and `prefers-reduced-motion`. One
`drawArrays` per frame, no per-frame CPU work, plain WebGL 1 with no extensions.

Home: ~38k points sampled from `avatar.png` on a 220×220 grid, masked to the
circle. 404: the digits rasterized to a canvas and sampled on a 1px grid, with a
dissolve wave travelling across them.

Every effect degrades to the underlying DOM — the `<img>`, the text `404` — if
WebGL is unavailable, a shader fails to compile, or the canvas can't be read.

## Deploy

Any static host. `404.html` at the root is picked up automatically by GitHub
Pages, Netlify, and Cloudflare Pages.
