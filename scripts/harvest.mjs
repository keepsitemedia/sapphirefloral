// One-time harvest of media from the live Canva export.
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import sharp from 'sharp';

mkdirSync('originals', { recursive: true });
execSync('curl -sL https://sapphirestemfloral.com/ -o originals/_home.html');
const html = readFileSync('originals/_home.html', 'utf8');
const urls = [...new Set(html.match(/_assets\/media\/[a-f0-9]+\.(?:jpg|png)/g))];
console.log(`${urls.length} media files`);
for (const u of urls) {
  const name = u.split('/').pop();
  execSync(`curl -sL "https://sapphirestemfloral.com/${u}" -o "originals/${name}"`);
}
const rows = [];
for (const f of readdirSync('originals').filter((f) => /\.(jpg|png)$/.test(f))) {
  const m = await sharp(`originals/${f}`).metadata();
  rows.push(`${f}\t${m.width}x${m.height}\t${Math.round(m.size ?? 0)}`);
}
writeFileSync('originals/_report.tsv', rows.join('\n'));
console.log('report written to originals/_report.tsv');
