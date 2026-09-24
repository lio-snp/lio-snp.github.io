import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..');
const iconsDir = resolve(siteRoot, 'public/icons');
const sourceSvg = resolve(iconsDir, 'cat-nap.svg');
const faviconIco = resolve(siteRoot, 'public/favicon.ico');

const targets = [
  ['favicon-16.png', 16],
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
];

function findConverter() {
  const candidates = [
    process.env.RSVG_CONVERT,
    '/opt/homebrew/bin/rsvg-convert',
    '/usr/local/bin/rsvg-convert',
    'rsvg-convert',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
    if (probe.status === 0) {
      return candidate;
    }
  }

  throw new Error('Could not find rsvg-convert. Install librsvg or set RSVG_CONVERT.');
}

function renderPng(converter, name, size) {
  const output = resolve(iconsDir, name);
  const result = spawnSync(converter, ['-w', String(size), '-h', String(size), '-o', output, sourceSvg], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(`Failed to render ${name}: ${result.stderr || result.stdout}`);
  }

  return output;
}

function readPngSize(path) {
  const png = readFileSync(path);
  if (png.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`${path} is not a PNG file`);
  }
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

function createIco(entries) {
  let offset = 6 + entries.length * 16;
  const header = Buffer.alloc(offset);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  entries.forEach((entry, index) => {
    const entryOffset = 6 + index * 16;
    header.writeUInt8(entry.size >= 256 ? 0 : entry.size, entryOffset);
    header.writeUInt8(entry.size >= 256 ? 0 : entry.size, entryOffset + 1);
    header.writeUInt8(0, entryOffset + 2);
    header.writeUInt8(0, entryOffset + 3);
    header.writeUInt16LE(1, entryOffset + 4);
    header.writeUInt16LE(32, entryOffset + 6);
    header.writeUInt32LE(entry.data.length, entryOffset + 8);
    header.writeUInt32LE(offset, entryOffset + 12);
    offset += entry.data.length;
  });

  writeFileSync(faviconIco, Buffer.concat([header, ...entries.map((entry) => entry.data)]));
}

function main() {
  if (!existsSync(sourceSvg)) {
    throw new Error(`Missing source SVG: ${sourceSvg}`);
  }

  mkdirSync(iconsDir, { recursive: true });

  const converter = findConverter();
  const rendered = targets.map(([name, size]) => ({
    name,
    size,
    path: renderPng(converter, name, size),
  }));

  for (const asset of rendered) {
    const actual = readPngSize(asset.path);
    if (actual.width !== asset.size || actual.height !== asset.size) {
      throw new Error(`${asset.name} is ${actual.width}x${actual.height}, expected ${asset.size}x${asset.size}`);
    }
  }

  const icoEntries = rendered
    .filter((asset) => asset.size === 16 || asset.size === 32)
    .map((asset) => ({
      size: asset.size,
      data: readFileSync(asset.path),
    }));
  createIco(icoEntries);

  console.log(`Source ${sourceSvg}`);
  for (const asset of rendered) {
    console.log(`Rendered ${asset.path} ${asset.size}x${asset.size}`);
  }
  console.log(`Wrote ${faviconIco} with ${icoEntries.map((entry) => `${entry.size}x${entry.size}`).join(', ')}`);
}

main();
