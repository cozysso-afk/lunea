import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

// Executes the actual presentation owner. This is an injected-CSS contract,
// not a browser geometry test: viewport acceptance still requires a browser.
test('final Thai theme installs one scoped five-track rule, without touching date styling', () => {
  const nodes = [];
  const document = {
    readyState:'complete',
    documentElement:{classList:{add(){}}},
    getElementById:id => nodes.find(node => node.id === id),
    createElement:() => ({}),
    querySelector:() => null,
    head:{appendChild:node => nodes.push(node)},
  };
  const context = vm.createContext({document, window:{__LUNEA_THAI_ARCHIVE_TIMING_ISOLATION_V27__:true},
    MutationObserver:class {observe(){} disconnect(){}}, setTimeout(){}});
  vm.runInContext(read('lunea-thai-art-polish-v26.js'), context);
  vm.runInContext(read('lunea-thai-art-polish-v26.js'), context);
  assert.equal(nodes.length, 1);
  const css = nodes[0].textContent;
  const selector = ':is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) .thai-v33-quick';
  const rule = css.slice(css.indexOf(selector));
  const container = rule.slice(rule.indexOf('{') + 1, rule.indexOf('}'));
  for (const declaration of ['display:grid!important', 'grid-template-columns:repeat(5,minmax(0,1fr))!important',
    'grid-auto-flow:row!important', 'gap:6px!important', 'width:100%!important', 'min-width:0!important']) {
    assert.ok(container.includes(declaration), declaration);
  }
  const child = rule.slice(rule.indexOf('> .thai-v33-chip'));
  const body = child.slice(child.indexOf('{') + 1, child.indexOf('}'));
  for (const declaration of ['grid-row:auto!important', 'grid-column:auto!important', 'width:100%!important',
    'min-width:0!important', 'max-width:none!important', 'box-sizing:border-box!important', 'white-space:nowrap!important']) {
    assert.ok(body.includes(declaration), declaration);
  }
  assert.doesNotMatch(rule.slice(0, rule.indexOf('.modal *')), /nth-child|repeat\(3,/);
  assert.match(read('lunea-structural-routing-v4.js'), /lunea-thai-art-polish-v26\.js\?v=20260912-quick-owner-1/);
});
