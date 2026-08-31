/* Compiles src/particles.wat to static/particles.wasm.
   The only build step in this repo; the .wasm output is committed. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import wabtInit from 'wabt';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wabt = await wabtInit();
const src = readFileSync(join(root, 'src/particles.wat'), 'utf8');

const mod = wabt.parseWat('particles.wat', src);
mod.validate();
const { buffer } = mod.toBinary({});
writeFileSync(join(root, 'static/particles.wasm'), Buffer.from(buffer));
console.log('static/particles.wasm  ' + buffer.length + ' bytes');
