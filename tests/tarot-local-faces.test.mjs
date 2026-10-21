import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('../', import.meta.url);
const load = name => fs.readFileSync(new URL(name, root), 'utf8');
const index = load('index.html');
const ios = load('lunea-ios-performance-v3.js');

assert.match(index, /img:'assets\/rws\/'\+file\.replace\(\/\^RWS_Tarot_\//, 'majors should use local RWS art');
assert.match(index, /img:`assets\/rws\/\$\{suit\}/, 'minors should use local RWS art');
const deckPart = index.slice(index.indexOf('const MAJORS='), index.indexOf('const TAROT_DECK='));
assert.doesNotMatch(deckPart, /https?:\/\//, 'no remote tarot face URLs in card model');

const majors = [
  'Fool', 'Magician', 'High_Priestess', 'Empress', 'Emperor', 'Hierophant',
  'Lovers', 'Chariot', 'Strength', 'Hermit', 'Wheel_of_Fortune', 'Justice',
  'Hanged_Man', 'Death', 'Temperance', 'Devil', 'Tower', 'Star', 'Moon',
  'Sun', 'Judgement', 'World'
].map((s, n) => `${String(n).padStart(2, '0')}_${s}.jpg`);
const minors = ['Wands','Cups','Swords','Pents']
  .flatMap(s => Array.from({length:14}, (_, i) => `${s}${String(i+1).padStart(2,'0')}.jpg`));
const expected = [...majors, ...minors];
assert.equal(new Set(expected).size, 78);
const dir = path.join(new URL('.', root).pathname, 'assets', 'rws');
const present = fs.readdirSync(dir).filter(x => x.endsWith('.jpg'));
assert.equal(present.length, 78, 'there must be exactly 78 bundled card images');

for (const name of expected) {
  const bytes = fs.readFileSync(path.join(dir,name));
  assert.ok(bytes.length > 10_000 && bytes.length < 500_000, `unexpected size: ${name}`);
  assert.equal(bytes[0], 0xff, `JPEG start marker: ${name}`);
  assert.equal(bytes[1], 0xd8, `JPEG start marker: ${name}`);
  assert.equal(bytes.at(-2), 0xff, `JPEG end marker: ${name}`);
  assert.equal(bytes.at(-1), 0xd9, `JPEG end marker: ${name}`);
}
assert.match(index, /lunea-card-art-fallback/, 'HTML fallback present');
assert.match(index, /lunea-card-art-missing/, 'CSS fallback present');
assert.match(ios, /lunea-card-art-fallback/, 'iOS constructor fallback present');
assert.match(ios, /front\.classList\.add\('lunea-card-art-missing'\)/);
console.log('LUNEA tarot local artwork contract: PASS (78/78 images)');
