// Offline preparation by default; live generation requires explicit credentials and model.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {createHash,randomInt,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const fixture=JSON.parse(read('tests/fixtures/tarot-expert-evaluation-v1.json'));
const html=read('index.html');
const sha=s=>createHash('sha256').update(s).digest('hex');
function makePrompt(row,expert){
  const c={console:{info(){}},setTimeout(){},setInterval(){},clearInterval(){},addEventListener(){},profile:{thaiDay:'',thaiRuler:'',saju:'',zodiac:''}};
  c.window=c;vm.createContext(c);
  vm.runInContext(html.slice(html.indexOf('const MAJORS='),html.indexOf('// State / profile / storage'))+'this.deck=TAROT_DECK;',c);
  vm.runInContext(html.slice(html.indexOf('const CONCEPTS='),html.indexOf('function recentSpreads')),c);
  const card=(code,position,isReversed)=>{
    const found=c.deck.find(x=>x.code===code);
    if(!found)throw Error('Unknown fixture card: '+code);
    return {...found,position,isReversed,subCards:[]};
  };
  c.state={question:row.question,title:'고정 평가 배열',rationale:'',drawn:row.cards.map(x=>card(...x))};
  for(const sub of row.clarifiers||[])c.state.drawn[sub.parent].subCards.push(card(sub.card,'',sub.reversed));
  vm.runInContext(html.slice(html.indexOf('function readingDirective()'),html.indexOf("$('aiRead').onclick=")),c);
  if(expert){
    vm.runInContext(read('lunea-tarot-reference-v1.js'),c);
    vm.runInContext(read('lunea-tarot-expert-engine-v1.js'),c);
  }
  vm.runInContext(read('lunea-final-prompt-priority-v1.js'),c);
  return c.promptString();
}
const live=process.argv.includes('--live');
const outputArg=process.argv.find(x=>x.startsWith('--out='));
if(!outputArg)throw Error('Use --out=/absolute/new-directory (default: offline preparation).');
const out=path.resolve(outputArg.slice(6));
const key=process.env.GEMINI_API_KEY,model=process.env.LUNEA_EVAL_MODEL;
if(live && (!key || !model))throw Error('Live mode requires GEMINI_API_KEY and LUNEA_EVAL_MODEL in the environment.');
if(fs.existsSync(out))throw Error('Output directory already exists; refusing to overwrite an evaluation.');
fs.mkdirSync(out,{recursive:true});
const generationConfig={temperature:.82,topP:.95};
const jobs=[];
for(const row of fixture.cases)for(const expert of [false,true])for(let repeat=1;repeat<=3;repeat++){
  const prompt=makePrompt(row,expert);
  jobs.push({id:randomUUID(),caseId:row.id,variant:expert?'expert':'baseline',repeat,prompt,promptSha256:sha(prompt)});
}
for(let i=jobs.length-1;i>0;i--){const j=randomInt(i+1);[jobs[i],jobs[j]]=[jobs[j],jobs[i]];}
const manifest={status:live?'generation_in_progress':'prepared_not_generated_not_scored',createdAt:new Date().toISOString(),model:model||null,generationConfig,
  scope:'Controlled core prompt comparison: production deck, question classifier, promptString, optional reference/expert, final assembler. Other runtime wrappers and UI are excluded; this is not full production end-to-end evaluation.',
  sources:Object.fromEntries(['index.html','lunea-tarot-reference-v1.js','lunea-tarot-expert-engine-v1.js','lunea-final-prompt-priority-v1.js'].map(n=>[n,sha(read(n))])),jobs};
const save=()=>fs.writeFileSync(path.join(out,'manifest-private.json'),JSON.stringify(manifest,null,2));
save();fs.writeFileSync(path.join(out,'rubric.json'),JSON.stringify(fixture,null,2));
if(live){
  // Sequential with no retries to avoid multiplying billed requests on failure.
  for(const job of jobs){
    try{
      const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
        method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},signal:AbortSignal.timeout(120000),
        body:JSON.stringify({contents:[{parts:[{text:job.prompt}]}],generationConfig})});
      const data=await response.json();
      if(!response.ok || data.error)throw Error('Provider HTTP '+response.status);
      const candidate=data.candidates?.[0];
      const answer=(candidate?.content?.parts||[]).filter(p=>!p.thought).map(p=>p.text||'').join('');
      if(!answer || candidate.finishReason!=='STOP')throw Error('Empty, blocked or incomplete response');
      const row=fixture.cases.find(x=>x.id===job.caseId);
      fs.appendFileSync(path.join(out,'answers-blind.jsonl'),JSON.stringify({id:job.id,caseId:job.caseId,question:row.question,cards:row.cards,clarifiers:row.clarifiers||[],answer,scores:null})+'\n');
      job.status='generated_not_scored';job.modelVersion=data.modelVersion||null;job.usageMetadata=data.usageMetadata||null;job.completedAt=new Date().toISOString();save();
    }catch(error){job.status='failed';job.error=error.name==='TimeoutError'?'Request timeout':'Generation failed';manifest.status='incomplete_not_scored';save();throw Error('Evaluation stopped; completed responses retained. '+job.error);}
  }
  manifest.status='generated_not_scored';save();
}
console.log(JSON.stringify({status:manifest.status,cases:fixture.cases.length,requests:jobs.length,uniquePrompts:new Set(jobs.map(x=>x.promptSha256)).size}));
