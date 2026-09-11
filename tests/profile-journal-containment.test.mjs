import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = name => fs.readFileSync(new URL(`../${name}`, import.meta.url),'utf8');
function stylesFromOwner(name, extra='') {
  const nodes = new Map();
  const document = {readyState:'loading',documentElement:{},addEventListener(){},
    getElementById(id){return nodes.get(id)||null;},
    createElement(){return {};},head:{appendChild(n){nodes.set(n.id,n);}}
  };
  const window = {};
  vm.runInNewContext(source(name).replace(/\}\)\(\);\s*$/,`window.testOwner={addStyles${extra}};})();`),{
    document,window,MutationObserver:class{observe(){}},console
  });
  window.testOwner.addStyles();
  return {css:[...nodes.values()].map(n=>n.textContent).join('\n'),nodes,api:window.testOwner};
}
const profile=stylesFromOwner('celestial-profile-v3.js');
assert.match(profile.css,/#profileOverlay #cpv3BirthGrid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
assert.match(profile.css,/@media\(max-width:430px\)\{\s*#profileOverlay #cpv3BirthGrid\{grid-template-columns:minmax\(0,1fr\)\}/);
assert.match(profile.css,/input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\)/);
assert.match(profile.css,/box-sizing:border-box;min-width:0;max-width:100%;width:100%/);
assert.match(source('index.html'),/<input[^>]*type="date"[^>]*id="birthDate"/);
assert.match(source('profile-advanced-v2.js'),/<input type="time" id="birthTime">/);

const archive=stylesFromOwner('lunea-archive-search-v1.js',',itemMatches');
const detail=stylesFromOwner('lunea-journal-detail-v51.js');
assert.match(archive.css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(archive.css,/@media\(max-width:430px\).*grid-template-columns:minmax\(0,1fr\)/);
assert.match(archive.css,/box-sizing:border-box;width:100%;max-width:100%;min-width:0/);
assert.doesNotMatch(detail.css,/#archiveOverlay #archiveSearchAdvanced\s*\{/,'V51 must not own date-grid columns');
assert.doesNotMatch(archive.css,/overflow(?:-x)?:\s*(?:hidden|clip)/);

archive.nodes.set('archiveDateFrom',{value:'2026-09-10'});
archive.nodes.set('archiveDateTo',{value:'2026-09-11'});
for(const [date,expected] of [['2026-09-09',false],['2026-09-10',true],['2026-09-11',true],['2026-09-12',false]]){
  assert.equal(archive.api.itemMatches({textContent:'합성 기록',dataset:{createdDate:date}}),expected);
}
assert.equal(archive.nodes.get('archiveDateFrom').value,'2026-09-10');
assert.equal(archive.nodes.get('archiveDateTo').value,'2026-09-11');
console.log('Profile/Journal owner CSS and inclusive date filtering: PASS (not rendered geometry or native picker E2E)');
