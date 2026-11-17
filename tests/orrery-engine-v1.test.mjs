import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const store = new Map();
globalThis.window = globalThis;
globalThis.localStorage = {getItem:k => store.has(k) ? store.get(k) : null, setItem:(k,v) => store.set(k,String(v)), removeItem:k => store.delete(k)};
window.addEventListener = () => {};
console.info = () => {};
const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// Vendored engine: MIT notice kept, exposes LUNEA_ORRERY_CORE 0.6.0.
const vendor = read('vendor/orrery-core-0.6.0.js');
assert.match(vendor.slice(0, 1500), /@orrery\/core 0\.6\.0[\s\S]*MIT License[\s\S]*lunar-javascript[\s\S]*MIT License/);
assert.match(read('vendor/LICENSE-orrery.txt'), /MIT License/);
assert.match(read('vendor/LICENSE-lunar-javascript.txt'), /MIT License/);
(0, eval)(vendor);
assert.equal(window.LUNEA_ORRERY_CORE.VERSION, '0.6.0');

(0, eval)(read('lunea-orrery-engine-v1.js'));
const E = window.LUNEA_ORRERY_ENGINE_V1;

// Exact time, with gender → pillars, ten gods, 대운.
const me = await E.fourPillars({birthDate:'1991-03-21', birthTime:'07:26', birthPlace:'여수', gender:'F'});
assert.equal(me.mode, 'exact');
assert.deepEqual(['year','month','day','hour'].map(k => me.pillars[k].hanja), ['辛未','辛卯','庚寅','己卯']);
assert.equal(me.day_master.stem, '庚');
assert.equal(me.pillars.hour.ten_god_stem, '正印');
assert.equal(me.provenance.place_resolved, '여수');
assert.equal(Object.values(me.visible_elements).reduce((a,b) => a+b, 0), 8);
assert.match(E.daewoonText(me.daewoon, new Date('2026-11-17T04:00:00Z')), /^乙未 \(35세~, 천간 正財\/지지 正印/);

// No gender → no 대운, flagged.
const noG = await E.fourPillars({birthDate:'1991-03-21', birthTime:'07:26', birthPlace:'여수'});
assert.equal(noG.daewoon.length, 0);
assert.equal(noG.daewoon_needs_gender, true);

// Unknown time → range check, no hour pillar, no 대운.
const him = await E.fourPillars({birthDate:'1992-02-29', birthPlace:'광주', gender:'남성', unknownTime:true});
assert.equal(him.mode, 'range');
assert.equal(him.pillars.hour, null);
assert.deepEqual(['year','month','day'].map(k => him.pillars[k]?.hanja), ['壬申','壬寅','乙亥']);
assert.equal(him.daewoon.length, 0);

// Saved record drives the user's prompt line.
store.set('LUNEA_SAJU_AUTO_V1', JSON.stringify({birthDate:'1991-03-21', data:me}));
store.set('LUNEA_BIRTH_DATE', '1991-03-21');
assert.match(E.userDaewoonLine(), /乙未/);
store.set('LUNEA_BIRTH_DATE', '1990-01-01');
assert.equal(E.userDaewoonLine(), '', 'stale record for other birth data is ignored');

console.log('orrery-engine-v1 ok');

// Profile auto-calc wiring (source contract): typing birth data runs the
// engine without the button, never the server, and sets the Thai weekday.
{
  const v4 = read('celestial-profile-v4.js');
  assert.match(v4, /function scheduleAutoCalc\(\)/);
  assert.match(v4, /\['birthDate','birthTime','birthPlace','cpv4Gender'\]\.forEach/);
  assert.match(v4, /calculateSaju\(\{auto:true\}\)/);
  assert.match(v4, /if \(auto\) \{\s*\/\/ Automatic runs never wake the server/);
  assert.match(v4, /function setThaiDayFromBirth\(\)/);
  assert.match(v4, /'수요일 낮' : '수요일 밤'/);
}
console.log('profile auto-calc contract ok');
