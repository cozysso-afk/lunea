import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-intimacy-oracle-ui-v36.js', import.meta.url), 'utf8');
const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/intimacy-final-faces.json', import.meta.url), 'utf8'));

// A DOM contract harness, not a browser layout/visual test. Execute production
// rendering/reveal/restore functions; expose closure state only in this test.
function harness() {
  const ids = new Map(), storage = new Map(), timers = [], attached = [];
  class Element {
    constructor() { this.children=[]; this.style={}; this.dataset={}; this.attrs={}; this.className=''; }
    get classList() { return {contains:n=>this.className.split(' ').includes(n),add:n=>{if(!this.classList.contains(n))this.className+=' '+n;}}; }
    setAttribute(k,v) { this.attrs[k]=v; }
    append(...nodes) { nodes.forEach(n=>this.appendChild(n)); }
    appendChild(node) {
      this.children.push(node);
      if (node.className==='lio-row') attached.push(node.children.map(b=>({code:b.dataset.oracleCode,ratio:b.children[0].style.aspectRatio})));
      return node;
    }
    replaceChildren() { this.children=[]; }
    set innerHTML(value) {
      this.html=value;
      if(value.includes('id="luneaOracleRevealAll"'))ids.set('luneaOracleRevealAll',new Element());
    }
    querySelectorAll() { return this.children.filter(b=>!b.classList.contains('revealed')); }
  }
  const host=new Element(); ids.set('luneaIntimacyOraclePanel',host);
  const cards=Object.fromEntries(fixture.map(f=>[f.card_code,{code:f.card_code,enTitle:`TITLE_${f.card_code}`,koTitle:`제목_${f.card_code}`} ]));
  const window={LUNEA_INTIMACY_ORACLE_V35:{cards,getCard:code=>cards[code]}};
  const state={title:'synthetic',question:'synthetic question',drawn:[{code:'T01'}]};
  const document={readyState:'loading',getElementById:id=>ids.get(id),createElement:()=>new Element(),addEventListener(){},head:new Element()};
  const instrumented=source.replace("if(document.readyState==='loading')", "W.testOnly={renderOraclePanel,restoreSidecar,installStyles,setReading:r=>{reading=r}};\nif(document.readyState==='loading')");
  assert.notEqual(instrumented,source);
  vm.runInNewContext(instrumented,{window,document,state,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},setTimeout:fn=>timers.push(fn),crypto:{getRandomValues(){throw new Error('Unexpected RNG during render/reveal/restore');}}});
  return {window,document,host,ids,storage,timers,attached,state,cards,api:window.testOnly};
}

function setCards(h,codes,revealed=[]) {
  h.api.setReading({mode:codes.length,cards:codes.map((code,i)=>({...h.cards[code],lens:`합성 렌즈 ${i}`})),revealed:new Set(revealed),stamp:'synthetic|synthetic question|T01'});
  h.api.renderOraclePanel();
  return h.host.children[1]?.children??[];
}

test('36 slots use exact approved dimensions before their row enters the DOM',()=>{
  const h=harness();
  assert.equal(fixture.length,36);
  for(const f of fixture){
    const [card]=setCards(h,[f.card_code]);
    assert.equal(card.children[0].style.aspectRatio,f.dimensions.join('/'),f.card_code);
    assert.equal(h.attached.at(-1)[0].ratio,f.dimensions.join('/'),'ratio must exist at row attachment');
    const front=card.children[0].children[0].children[1];
    assert.equal(front.style.backgroundSize,'contain');
    assert(front.style.backgroundImage.includes(`oracle_${f.card_code.slice(1)}.png?final36-20260911`));
  }
  assert.doesNotMatch(source,/aspect-ratio:3\s*\/\s*5/);
  assert.doesNotMatch(source,/fetch\([^)]*intimacy-final-faces/);
});

test('0/1/3 cards, individual/all reveal and restore keep codes, ratio and revealed state without RNG',()=>{
  const h=harness();
  for(const codes of [[],['O30'],['O30','O07','O11'],['O01','O13','O21']]){
    let cards=setCards(h,codes);
    assert.equal(cards.length,codes.length);
    assert.equal(h.host.hidden,codes.length===0);
    cards.forEach(card=>{
      assert(!card.classList.contains('revealed'));
      assert(!card.attrs['aria-label'].includes('TITLE_'));
      assert(card.children[1].html.includes('<strong hidden>'));
    });
    if(!cards.length)continue;
    cards[0].onclick();
    assert(cards[0].classList.contains('revealed'));
    assert(cards[0].attrs['aria-label'].includes(codes[0]));
    h.api.restoreSidecar();
    cards=h.host.children[1].children;
    assert(cards[0].classList.contains('revealed'));
    assert(cards.slice(1).every(c=>!c.classList.contains('revealed')));
    h.ids.get('luneaOracleRevealAll').onclick();
    while(h.timers.length)h.timers.shift()();
    assert(cards.every(c=>c.classList.contains('revealed')));
    h.api.restoreSidecar();
    cards=h.host.children[1].children;
    assert.deepEqual(cards.map(c=>c.dataset.oracleCode),codes);
    assert(cards.every(c=>c.classList.contains('revealed')));
    cards.forEach(card=>assert.equal(card.children[0].style.aspectRatio,fixture.find(f=>f.card_code===card.dataset.oracleCode).dimensions.join('/')));
  }
});

test('ratio-specific slots retain top alignment, outside 5px captions, contain and unfiltered hidden fronts',()=>{
  const h=harness(); h.api.installStyles();
  const css=h.document.head.children[0].textContent;
  assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\);gap:8px;align-items:start/);
  assert.match(css,/lio-card-meta\{position:static[^}]*padding:5px 4px/);
  assert.match(css,/lio-card-front\{[^}]*filter:none/);
  assert.match(css,/backface-visibility:hidden;-webkit-backface-visibility:hidden/);
  assert.match(css,/\.lio-card\.revealed \.lio-card-flip\{transform:rotateY\(180deg\)/);
});
