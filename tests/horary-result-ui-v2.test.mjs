import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-horary-result-ui-v2.js', import.meta.url), 'utf8');

// Presentation-only contract: this layer must not own calculation, storage or network behavior.
assert.doesNotMatch(source, /\bfetch\s*\(/, 'Result UI V2 must not make network requests');
assert.doesNotMatch(source, /\blocalStorage\b|\bindexedDB\b/, 'Result UI V2 must not persist reading data');
assert.doesNotMatch(source, /support_score\s*=|grade\s*=|perfects\s*=|aspect\s*=/, 'Result UI V2 must not mutate judgment values');

// Required hierarchy surfaces.
for (const marker of [
  'ENGINE CONCLUSION · 계산 결론',
  'PRIMARY EVIDENCE · 핵심 판정 근거',
  'LIMITS & CONFIDENCE · 제한 / 신뢰도',
  'Prashna · 독립 교차체계',
  'Horary ↔ Prashna · 일치 / 충돌',
  'AI 해설 · 계산값 이후의 설명'
]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));

// Existing authoritative containers are decorated rather than replaced.
for (const id of [
  'astroHoraryResult',
  'luneaHoraryTraditionalCoreV40',
  'luneaHoraryBalanceGuardV41',
  'luneaPrashnaV1Card',
  'luneaHoraryPrashnaCrossV2',
  'astroHoraryActions',
  'astroHoraryAIText'
]) assert.match(source, new RegExp(id));

// Mobile navigation must expose only jumps to already-rendered sections.
assert.match(source, /data-target="astroHoraryResult"/);
assert.match(source, /data-target="luneaPrashnaV1Card"/);
assert.match(source, /data-target="luneaHoraryPrashnaCrossV2"/);
assert.match(source, /data-target="astroHoraryAIText"/);
assert.match(source, /scrollIntoView/);
assert.match(source, /prefers-reduced-motion/);
assert.match(source, /grid-template-columns:1fr 1fr/);
assert.match(source, /#astroHoraryActions\.result-v2-actions #astroHoraryAI\{grid-column:1 \/ -1\}/);

console.log('Horary Result UI / Evidence V2 presentation-only contract: PASS');
