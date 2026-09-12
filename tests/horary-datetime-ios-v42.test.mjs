import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../lunea-horary-mobile-stability-v42.js',import.meta.url),'utf8');
const owner=fs.readFileSync(new URL('../astro-horary-v1.js',import.meta.url),'utf8');
const hardening=fs.readFileSync(new URL('../lunea-horary-hardening-v38.js',import.meta.url),'utf8');

class ClassList{constructor(n){this.n=n} values(){return String(this.n.className||'').split(/\s+/).filter(Boolean)} contains(v){return this.values().includes(v)} add(v){if(!this.contains(v))this.n.className=[...this.values(),v].join(' ')} remove(v){this.n.className=this.values().filter(x=>x!==v).join(' ')}}
class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.id='';this.type='';this.value='';this.className='';this.children=[];this.parentNode=null;this.dataset={};this.style={};this.events={};this.textContent='';this.classList=new ClassList(this)}
  append(...ns){ns.forEach(n=>this.appendChild(n))} appendChild(n){if(n.parentNode)n.parentNode.children=n.parentNode.children.filter(x=>x!==n);n.parentNode=this;this.children.push(n);return n}
  insertBefore(n,b){if(n.parentNode)n.parentNode.children=n.parentNode.children.filter(x=>x!==n);n.parentNode=this;const i=this.children.indexOf(b);this.children.splice(i<0?this.children.length:i,0,n);return n}
  setAttribute(n,v){this[n]=String(v)} addEventListener(t,h){(this.events[t]||=[]).push(h)} dispatch(t){for(const h of this.events[t]||[])h({target:this})}
  matches(s){return s.startsWith('.')&&this.classList.contains(s.slice(1))} closest(s){return this.matches(s)?this:this.parentNode?.closest(s)||null}
  querySelectorAll(s){const out=[];for(const c of this.children){if(c.matches(s))out.push(c);out.push(...c.querySelectorAll(s))}return out} querySelector(s){return this.querySelectorAll(s)[0]||null}
}

test('dedicated shell retains one native picker and one synchronized Korean value',async()=>{
  const root=new Element('html'),head=new Element('head'),body=new Element('body'),overlay=new Element(),field=new Element(),input=new Element('input'),now=new Element('button');
  overlay.id='astroHoraryOverlay';field.className='field';input.id='astroHoraryMoment';input.type='datetime-local';input.step='60';input.value='2026-09-12T00:05';now.id='astroHoraryNow';field.append(input);overlay.append(field,now);body.append(overlay);root.append(head,body);
  const walk=(n,id)=>n.id===id?n:n.children.map(c=>walk(c,id)).find(Boolean);const winEvents={};
  const document={readyState:'complete',head,body,documentElement:root,getElementById:id=>walk(root,id)||null,createElement:t=>new Element(t),addEventListener(){}};
  class MutationObserver{constructor(cb){this.cb=cb}observe(){}disconnect(){}}
  const window={window:null,scrollY:0,pageYOffset:0,addEventListener(t,h){(winEvents[t]||=[]).push(h)},scrollTo(){}};window.window=window;
  vm.runInNewContext(source,{window,document,MutationObserver,requestAnimationFrame:f=>f(),queueMicrotask,console:{info(){}}});
  const api=window.LUNEA_HORARY_MOBILE_STABILITY_V42,shell=input.closest('.horary-v42-moment-shell');
  assert.ok(shell);assert.equal(shell.querySelectorAll('.horary-v42-moment-visible').length,1);assert.equal(shell.children.at(-1),input);assert.equal(input.type,'datetime-local');assert.equal(input.step,'60');
  assert.equal(shell.querySelector('.horary-v42-moment-visible').textContent,'2026. 9. 12. 오전 12:05');
  input.value='2027-01-03T07:26';input.dispatch('input');assert.equal(shell.querySelector('.horary-v42-moment-visible').textContent,'2027. 1. 3. 오전 7:26');
  api.enhanceMoment();api.enhanceMoment();assert.equal(shell.querySelectorAll('.horary-v42-moment-visible').length,1);
  input.value='2028-02-04T18:09';now.dispatch('click');await Promise.resolve();assert.equal(shell.querySelector('.horary-v42-moment-visible').textContent,'2028. 2. 4. 오후 6:09');
  input.value='2029-03-05T09:11';for(const h of winEvents.pageshow||[])h();assert.equal(shell.querySelector('.horary-v42-moment-visible').textContent,'2029. 3. 5. 오전 9:11');
});

test('WebKit rule is narrowly scoped and every programmatic writer signals sync',()=>{
  assert.match(source,/@supports \(-webkit-touch-callout:none\)/);assert.match(source,/\.\$\{MOMENT_SHELL\}>#astroHoraryMoment\{/);assert.match(source,/opacity:\.001!important/);assert.match(source,/-webkit-text-fill-color:transparent!important/);assert.match(source,/align-items:center!important;justify-content:center!important/);assert.doesNotMatch(source,/setInterval\s*\(/);
  assert.match(owner,/<input id="astroHoraryMoment" type="datetime-local" step="60">/);assert.match(owner,/function setMomentValue\(value\)/);assert.match(owner,/setMomentValue\(seoulNowInput\(\)\)/);assert.match(hardening,/moment\.dispatchEvent\(new Event\('input', \{bubbles:true\}\)\)/);
});
