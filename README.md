# sunilsadasivan.com

Personal site and writing archive for Sunil Sadasivan. Built with Astro and published as a fully static site.

## Local review

```bash
npm install
npm run dev
```

Open `http://localhost:4321`.

## Quality checks

```bash
npm run check
npm run build
```

## Medium archive

The 13 posts in `src/content/blog` were imported from Sunil's Medium profile. The import script preserves the full article body and metadata while localizing every embedded image:

```bash
npm run import:medium
```

The three oldest posts require the OpenClaw browser to be running because Medium no longer includes them in its RSS feed.

No deployment workflow is included intentionally. Merging this branch will not publish the Astro build until hosting is configured separately.
