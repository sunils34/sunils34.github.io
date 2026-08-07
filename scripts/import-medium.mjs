import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import TurndownService from 'turndown';

const ROOT = new URL('..', import.meta.url).pathname;
const POSTS_DIR = join(ROOT, 'src/content/blog');
const IMAGES_DIR = join(ROOT, 'public/images/blog');
const RSS_URL = 'https://medium.com/feed/@sunils34';
const CDP_ENDPOINT = 'http://127.0.0.1:18800';

const olderPosts = [
  'https://medium.com/@sunils34/the-cronjob-that-generates-4-million-a-year-4540b0cde584',
  'https://medium.com/buffer-stories/how-to-think-about-security-at-startups-its-a-never-ending-job-a294cb7a2fc3',
  'https://medium.com/buffer-posts/why-we-dont-ask-technical-questions-for-technical-interviews-at-buffer-73f8132a8abd',
];

const turndown = new TurndownService({
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
  headingStyle: 'atx',
});

turndown.addRule('figures', {
  filter: 'figure',
  replacement(content) {
    return `\n\n${content.trim()}\n\n`;
  },
});

turndown.addRule('figcaptions', {
  filter: 'figcaption',
  replacement(content) {
    return `\n_${content.trim()}_\n`;
  },
});

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanUrl(url) {
  const parsed = new URL(url);
  parsed.search = '';
  return parsed.toString();
}

function slugFromUrl(url) {
  return new URL(cleanUrl(url)).pathname.split('/').filter(Boolean).at(-1).replace(/-[a-f0-9]{10,12}$/i, '');
}

function escapeYaml(value) {
  return JSON.stringify(String(value).replace(/\u2028|\u2029/g, ' '));
}

function textOnly(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateDescription(value, max = 158) {
  const clean = String(value).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const shortened = clean.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[,:;\-–—]+$/, '');
  return `${shortened}…`;
}

function descriptionFromHtml(html, fallback = '') {
  const match = html.match(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/i);
  const text = textOnly(match?.[1] || fallback);
  return truncateDescription(text);
}

function readingMinutes(html) {
  const words = textOnly(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function frontmatter(post) {
  return [
    '---',
    `title: ${escapeYaml(post.title)}`,
    `description: ${escapeYaml(post.description)}`,
    `published: ${new Date(post.published).toISOString()}`,
    `updated: ${new Date(post.updated || post.published).toISOString()}`,
    `originalUrl: ${escapeYaml(cleanUrl(post.originalUrl))}`,
    `readingTime: ${post.readingTime}`,
    `tags: [${post.tags.map(escapeYaml).join(', ')}]`,
    post.heroImage ? `heroImage: ${escapeYaml(post.heroImage)}` : null,
    'draft: false',
    '---',
  ].filter(Boolean).join('\n');
}

function extensionFor(url, contentType) {
  const fromUrl = extname(new URL(url).pathname).toLowerCase();
  if (/^\.(?:avif|gif|jpe?g|png|webp)$/.test(fromUrl)) return fromUrl.replace('.jpeg', '.jpg');
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('avif')) return '.avif';
  return '.jpg';
}

async function localizeImages(html, slug) {
  const matches = [...html.matchAll(/<img\b[^>]*?src=["']([^"']+)["'][^>]*>/gi)];
  if (!matches.length) return { html, heroImage: null };

  await mkdir(join(IMAGES_DIR, slug), { recursive: true });
  let localized = html;
  let heroImage = null;

  for (const [index, match] of matches.entries()) {
    const source = match[1];
    if (/medium\.com\/_\/stat/.test(source)) {
      localized = localized.replace(match[0], '');
      continue;
    }

    try {
      const response = await fetch(source, { headers: { 'user-agent': 'Mozilla/5.0' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const extension = extensionFor(response.url, response.headers.get('content-type') || '');
      const filename = `${String(index + 1).padStart(2, '0')}${extension}`;
      await writeFile(join(IMAGES_DIR, slug, filename), Buffer.from(await response.arrayBuffer()));
      const publicPath = `/images/blog/${slug}/${filename}`;
      heroImage ||= publicPath;
      localized = localized.replace(source, publicPath);
    } catch (error) {
      console.warn(`Could not download ${source}: ${error.message}`);
    }
  }

  localized = localized.replace(/<img\b(?![^>]*\bloading=)([^>]*)>/gi, '<img loading="lazy" decoding="async"$1>');
  return { html: localized, heroImage };
}

function withoutHeroImage(html, heroImage) {
  if (!heroImage) return html;
  const escaped = heroImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const figure = new RegExp(`<figure\\b[\\s\\S]*?${escaped}[\\s\\S]*?<\\/figure>`, 'i');
  if (figure.test(html)) return html.replace(figure, '');
  const image = new RegExp(`<img\\b[^>]*?${escaped}[^>]*>`, 'i');
  return html.replace(image, '');
}

function enrichMarkdown(markdown) {
  return markdown.replace(
    /<a href="https:\/\/medium\.com\/media\/94803d7118043cbaebef80181ad0c2df\/href">[\s\S]*?<\/a>/,
    '<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/PGLYEDpNu60" title="Richard Cook: Resilience in Complex Adaptive Systems" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>',
  );
}

async function importRssPosts() {
  const response = await fetch(RSS_URL);
  if (!response.ok) throw new Error(`Medium RSS failed: ${response.status}`);
  const xml = await response.text();
  const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: '__cdata', processEntities: false });
  const feed = parser.parse(xml);
  const items = asArray(feed.rss.channel.item);

  for (const item of items) {
    const title = item.title?.__cdata || item.title;
    const originalUrl = item.link;
    const slug = slugFromUrl(originalUrl);
    let html = item['content:encoded']?.__cdata || item['content:encoded'] || '';
    html = html.replace(/<h3>\s*([^<]+)\s*<\/h3>/i, (match, heading) => textOnly(heading) === textOnly(title) ? '' : match);
    const localized = await localizeImages(html, slug);
    const markdown = enrichMarkdown(turndown.turndown(withoutHeroImage(localized.html, localized.heroImage))).replace(/\n{3,}/g, '\n\n').trim();
    const description = descriptionFromHtml(html, title);
    const post = {
      title,
      description,
      published: item.pubDate,
      updated: item['atom:updated'] || item.pubDate,
      originalUrl,
      readingTime: readingMinutes(html),
      tags: asArray(item.category).map((category) => category?.__cdata || category).filter(Boolean),
      heroImage: localized.heroImage,
    };
    await writeFile(join(POSTS_DIR, `${slug}.md`), `${frontmatter(post)}\n\n${markdown}\n`);
    console.log(`Imported ${title}`);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function richText(text, markups = []) {
  const opens = new Map();
  const closes = new Map();
  const tags = {
    A: (markup) => [`<a href="${escapeHtml(markup.href || '#')}">`, '</a>'],
    STRONG: () => ['<strong>', '</strong>'],
    EM: () => ['<em>', '</em>'],
    CODE: () => ['<code>', '</code>'],
  };

  for (const markup of markups) {
    if (!tags[markup.type]) continue;
    const [open, close] = tags[markup.type](markup);
    opens.set(markup.start, [...(opens.get(markup.start) || []), { open, span: markup.end - markup.start }]);
    closes.set(markup.end, [...(closes.get(markup.end) || []), { close, span: markup.end - markup.start }]);
  }

  let output = '';
  for (let index = 0; index <= text.length; index += 1) {
    for (const item of (closes.get(index) || []).sort((a, b) => a.span - b.span)) output += item.close;
    for (const item of (opens.get(index) || []).sort((a, b) => b.span - a.span)) output += item.open;
    if (index < text.length) output += escapeHtml(text[index]);
  }
  return output;
}

function paragraphsToHtml(paragraphs) {
  const chunks = [];
  let listType = null;
  const closeList = () => {
    if (listType) chunks.push(`</${listType}>`);
    listType = null;
  };

  for (const paragraph of paragraphs.slice(2)) {
    const content = richText(paragraph.text || '', paragraph.markups || []);
    if (paragraph.type === 'ULI' || paragraph.type === 'OLI') {
      const nextList = paragraph.type === 'ULI' ? 'ul' : 'ol';
      if (listType !== nextList) {
        closeList();
        chunks.push(`<${nextList}>`);
        listType = nextList;
      }
      chunks.push(`<li>${content}</li>`);
      continue;
    }
    closeList();

    if (paragraph.type === 'IMG' && paragraph.metadata?.id) {
      const imageUrl = `https://miro.medium.com/${paragraph.metadata.id}`;
      chunks.push(`<figure><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(paragraph.metadata.alt || paragraph.text || '')}">${paragraph.text ? `<figcaption>${content}</figcaption>` : ''}</figure>`);
    } else if (paragraph.type === 'H2') {
      chunks.push(`<h2>${content}</h2>`);
    } else if (paragraph.type === 'H3' || paragraph.type === 'H4') {
      chunks.push(`<h3>${content}</h3>`);
    } else if (paragraph.type === 'BQ' || paragraph.type === 'PQ') {
      chunks.push(`<blockquote>${content}</blockquote>`);
    } else if (paragraph.type === 'PRE') {
      chunks.push(`<pre><code>${content}</code></pre>`);
    } else if (paragraph.type === 'IFRAME' && paragraph.iframe?.iframeSrc) {
      chunks.push(`<p><a href="${escapeHtml(paragraph.iframe.iframeSrc)}">View embedded content</a></p>`);
    } else if (paragraph.text) {
      chunks.push(`<p>${content}</p>`);
    }
  }
  closeList();
  return chunks.join('\n');
}

function cdpConnection(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let nextId = 1;
  const pending = new Map();
  const ready = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });

  return {
    async send(method, params = {}) {
      await ready;
      const id = nextId++;
      const result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
      socket.send(JSON.stringify({ id, method, params }));
      return result;
    },
    close() { socket.close(); },
  };
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractMediumPost(url) {
  let target;
  try {
    const expectedId = new URL(url).pathname.match(/-([a-f0-9]{12})$/i)?.[1];
    if (!expectedId) throw new Error(`Could not determine Medium post id from ${url}`);
    const response = await fetch(`${CDP_ENDPOINT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    if (!response.ok) throw new Error(`CDP target creation failed: ${response.status}`);
    target = await response.json();
    const cdp = cdpConnection(target.webSocketDebuggerUrl);
    await cdp.send('Runtime.enable');

    const expression = `(() => {
      const state = window.__APOLLO_STATE__;
      if (!state) return null;
      const key = 'Post:${expectedId}';
      if (!key) return null;
      const post = state[key];
      if (!post) return null;
      const contentKey = Object.keys(post).find((candidate) => candidate.startsWith('content('));
      const refs = post[contentKey]?.bodyModel?.paragraphs || [];
      return JSON.stringify({ post, paragraphs: refs.map((entry) => state[entry.__ref]).filter(Boolean) });
    })()`;

    let extracted = null;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true });
      if (result.result.value) {
        extracted = JSON.parse(result.result.value);
        break;
      }
      await sleep(500);
    }
    cdp.close();
    if (!extracted) throw new Error(`Timed out extracting ${url}`);
    return extracted;
  } finally {
    if (target?.id) await fetch(`${CDP_ENDPOINT}/json/close/${target.id}`);
  }
}

async function importOlderPosts() {
  for (const url of olderPosts) {
    const { post, paragraphs } = await extractMediumPost(url);
    const slug = slugFromUrl(post.mediumUrl || url);
    const html = paragraphsToHtml(paragraphs);
    const localized = await localizeImages(html, slug);
    const markdown = enrichMarkdown(turndown.turndown(withoutHeroImage(localized.html, localized.heroImage))).replace(/\n{3,}/g, '\n\n').trim();
    const subtitle = paragraphs[1]?.text || post.previewContent?.subtitle || '';
    const description = descriptionFromHtml(html, subtitle || post.title);
    const tagOverrides = {
      a294cb7a2fc3: ['security', 'startups', 'engineering', 'buffer'],
      '73f8132a8abd': ['hiring', 'engineering-leadership', 'culture', 'buffer'],
    };
    const postData = {
      title: post.title.replace(/\s+/g, ' ').trim(),
      description: truncateDescription(description),
      published: post.firstPublishedAt,
      updated: post.latestPublishedAt,
      originalUrl: post.canonicalUrl || post.mediumUrl || url,
      readingTime: Math.max(1, Math.round(post.readingTime || readingMinutes(html))),
      tags: tagOverrides[post.id] || asArray(post.tags).map((tag) => tag.__ref?.replace(/^Tag:/, '')).filter(Boolean),
      heroImage: localized.heroImage,
    };
    await writeFile(join(POSTS_DIR, `${slug}.md`), `${frontmatter(postData)}\n\n${subtitle ? `> ${subtitle}\n\n` : ''}${markdown}\n`);
    console.log(`Imported ${postData.title}`);
  }
}

await mkdir(POSTS_DIR, { recursive: true });
await mkdir(IMAGES_DIR, { recursive: true });
await importRssPosts();

try {
  await importOlderPosts();
} catch (error) {
  console.error('\nThe three pre-RSS Medium posts need the local browser control port.');
  console.error('Start the OpenClaw browser and rerun npm run import:medium.');
  throw error;
}

console.log('\nMedium import complete: 13 posts.');
