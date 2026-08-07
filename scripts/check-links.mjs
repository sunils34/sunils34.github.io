import { access, readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = new URL('../dist', import.meta.url).pathname;

async function filesWithin(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesWithin(path) : path;
  }));
  return files.flat();
}

const htmlFiles = (await filesWithin(root)).filter((file) => file.endsWith('.html'));
const missing = [];

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const references = [...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((match) => match[1]);

  for (const reference of references) {
    const pathname = reference.split(/[?#]/)[0];
    if (!pathname) continue;
    const relative = pathname.replace(/^\//, '');
    const target = extname(relative)
      ? join(root, relative)
      : join(root, relative, 'index.html');
    try {
      await access(target);
    } catch {
      missing.push(`${file.replace(`${root}/`, '')}: ${reference}`);
    }
  }
}

if (missing.length) {
  console.error(`Missing ${missing.length} internal reference(s):\n${missing.join('\n')}`);
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML files: all internal links and assets resolve.`);
