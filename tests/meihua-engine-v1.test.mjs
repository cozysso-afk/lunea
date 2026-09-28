import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const api = require('../lunea-meihua-engine-v1.js');

assert.equal(api.version,1);
assert.equal(api.hexagrams.length,64,'64괘 전체가 있어야 함');
assert.equal(new Set(api.hexagrams.map(x=>`${x.upper}/${x.lower}`)).size,64,'상하괘 조합은 64개 모두 고유해야 함');
assert.equal(new Set(Object.values(api.trigrams).map(x=>x.lines.join(''))).size,8,'팔괘 효 패턴은 고유해야 함');

assert.equal(api.remainder1(8,8),8);
assert.equal(api.remainder1(16,8),8);
assert.equal(api.remainder1(6,6),6);
assert.equal(api.remainder1(7,6),1);
assert.equal(api.yearBranchNumber(2020),1);
assert.equal(api.yearBranchNumber(2024),5);
assert.equal(api.yearBranchNumber(2026),7);
assert.equal(api.hourBranchNumber(23),1);
assert.equal(api.hourBranchNumber(0),1);
assert.equal(api.hourBranchNumber(1),2);
assert.equal(api.hourBranchNumber(13),8);

// Example locked in product spec: 辰5 + lunar 4/12 + 申9.
const sample = api.calculateFromComponents({
  yearBranchNumber:5,
  lunarMonth:4,
  lunarDay:12,
  hourBranchNumber:9
});
assert.equal(sample.arithmetic.upperSum,21);
assert.equal(sample.arithmetic.total,30);
assert.equal(sample.primary.upper.key,'XUN');
assert.equal(sample.primary.lower.key,'KAN');
assert.equal(sample.primary.number,59);
assert.equal(sample.primary.ko,'풍수환');
assert.equal(sample.movingLine,6);
assert.equal(sample.mutual.number,27);
assert.equal(sample.mutual.ko,'산뢰이');
assert.equal(sample.changed.number,29);
assert.equal(sample.changed.ko,'감위수');
assert.equal(sample.bodyUse.body.key,'KAN');
assert.equal(sample.bodyUse.use.key,'XUN');
assert.equal(sample.bodyUse.primaryRelation.code,'TI_SHENG_YONG');
assert.equal(sample.bodyUse.changedRelation.code,'BI_HE');

// Real timestamp calendar provenance sanity check in Asia/Seoul.
const timed = api.calculateAt(new Date('2026-09-23T04:00:00Z'),{timeZone:'Asia/Seoul'});
assert.equal(timed.questionTime.local.hour,13);
assert.equal(timed.questionTime.lunar.relatedYear,2026);
assert.equal(timed.questionTime.lunar.month,8);
assert.equal(timed.questionTime.lunar.day,13);
assert.equal(timed.questionTime.yearBranch.hanja,'午');
assert.equal(timed.questionTime.hourBranch.hanja,'未');
assert.equal(timed.primary.number,51);
assert.equal(timed.primary.ko,'진위뢰');
assert.equal(timed.mutual.number,39);
assert.equal(timed.changed.number,21);
assert.equal(timed.provenance.dayBoundary,'civil midnight 00:00');

console.log('Meihua Engine V1 contract: PASS');
