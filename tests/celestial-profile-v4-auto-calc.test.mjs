import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../celestial-profile-v4.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../profile-select-ui-v2.1.js', import.meta.url), 'utf8');

assert.match(source, /COMMON · 출생정보/);
assert.match(source, /\['birthDate','birthTime','birthPlace'\]/);
assert.match(source, /\/v1\/profile\/four-pillars/);
assert.match(source, /sajuYearPillar/);
assert.match(source, /sajuMonthPillar/);
assert.match(source, /sajuDayPillar/);
assert.match(source, /sajuHourPillar/);
assert.match(source, /true_solar_time_correction/);
assert.match(source, /신강\/신약·용신·희신·기신처럼 학파 차이가 큰 판정은 자동으로 만들지 않아/);
assert.match(source, /VEDIC \/ JYOTISHA/);
assert.match(source, /Sidereal · 고정/);
assert.match(source, /Lahiri · V1 기본/);
assert.match(source, /Nakshatra · Pada/);
assert.match(source, /계산되지 않은 Vedic 값은 AI 프롬프트에 보내지 않아/);
assert.match(loader, /celestial-profile-v4\.js\?v=401/);
assert.match(loader, /data-lunea-profile-v4/);

console.log('LUNEA Celestial Profile V4 auto-calc contract: PASS');
