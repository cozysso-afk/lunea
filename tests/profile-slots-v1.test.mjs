import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const store = new Map();
globalThis.window = globalThis;
globalThis.localStorage = {getItem:k => store.has(k) ? store.get(k) : null, setItem:(k,v) => store.set(k,String(v)), removeItem:k => store.delete(k)};
let reloads = 0;
globalThis.location = {reload:() => { reloads += 1; }};
window.addEventListener = () => {};
(0, eval)(readFileSync(new URL('../lunea-profile-slots-v1.js', import.meta.url), 'utf8'));
const S = window.LUNEA_PROFILE_SLOTS_V1;

// Existing single profile becomes slot 1 on first run.
store.set('LUNEA_BIRTH_DATE', '2002-03-12');
store.set('LUNEA_SAJU_AUTO_V1', '{"birthDate":"2002-03-12"}');
store.set('LUNEA_PARTNERS_V1', '{"shared":true}');
store.set('LUNEA_ASTRO_PENDING_V23', '{"job":1}');
const first = S.ensure();
assert.equal(first.slots.length, 1);
assert.equal(first.slots[0].name, '내 프로필');
assert.equal(first.slots[0].data.LUNEA_BIRTH_DATE, '2002-03-12');
const meId = first.activeId;

// New profile starts empty; shared data stays; pending server job cleared.
const friendId = S.create('친구 지민');
assert.equal(reloads, 1);
assert.equal(store.get('LUNEA_BIRTH_DATE'), undefined);
assert.equal(store.get('LUNEA_SAJU_AUTO_V1'), undefined);
assert.equal(store.get('LUNEA_PARTNERS_V1'), '{"shared":true}');
assert.equal(store.get('LUNEA_ASTRO_PENDING_V23'), undefined);
store.set('LUNEA_BIRTH_DATE', '1995-08-10');

// Switching back restores slot 1 and keeps the friend's live data in slot 2.
assert.equal(S.switchTo(meId), true);
assert.equal(store.get('LUNEA_BIRTH_DATE'), '2002-03-12');
assert.equal(store.get('LUNEA_SAJU_AUTO_V1'), '{"birthDate":"2002-03-12"}');
const after = S.ensure();
assert.equal(after.slots.find(s => s.id === friendId).data.LUNEA_BIRTH_DATE, '1995-08-10');
assert.equal(S.switchTo(meId), false, 'switching to the active slot is a no-op');

// Rename and delete (deleting the active slot moves to the other one).
assert.equal(S.rename(friendId, '지민'), true);
assert.equal(S.ensure().slots.find(s => s.id === friendId).name, '지민');
assert.equal(S.remove(meId), true);
assert.equal(S.ensure().activeId, friendId);
assert.equal(store.get('LUNEA_BIRTH_DATE'), '1995-08-10');
assert.equal(S.remove(friendId), false, 'the last profile cannot be deleted');
console.log('profile-slots-v1 ok');
