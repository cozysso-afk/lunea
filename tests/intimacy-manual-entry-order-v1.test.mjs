import assert from 'node:assert/strict';
import fs from 'node:fs';

const manual = fs.readFileSync(new URL('../lunea-manual-everywhere-v1.js', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../lunea-intimacy-ai-bridge-v34.js', import.meta.url), 'utf8');

assert.match(manual, /else content\.prepend\(item\)/,
  'manual row must be able to exist before the late INTIMACY AI row');
assert.match(bridge, /content\.prepend\(item\)/,
  'late INTIMACY AI row must prepend ahead of an already-restored manual row');

console.log('INTIMACY manual/AI ordering contract: OK');
