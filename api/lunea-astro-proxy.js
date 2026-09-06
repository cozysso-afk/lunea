'use strict';

const ORIGINS=[
  {label:'v2',origin:'https://lunea-astro-api-v2.onrender.com',timeoutMs:24000},
  {label:'legacy',origin:'https://lunea-astro-api.onrender.com',timeoutMs:30000}
];
const TRANSIENT=new Set([408,425,429,500,502,503,504]);

function suffix(req){const raw=Array.isArray(req.query?.path)?req.query.path[0]:String(req.query?.path||'/health');return raw.startsWith('/')?raw:'/'+raw}
function forwardHeaders(req){const out={};for(const k of ['content-type','accept','accept-language','authorization','x-requested-with'])if(req.headers?.[k])out[k]=req.headers[k];return out}
function requestBody(req){if(['GET','HEAD'].includes(String(req.method||'GET').toUpperCase())||req.body==null)return undefined;if(Buffer.isBuffer(req.body)||typeof req.body==='string')return req.body;return JSON.stringify(req.body)}
async function call(entry,path,req,controllers){
  const controller=new AbortController();controllers.push(controller);const timer=setTimeout(()=>controller.abort(),entry.timeoutMs);
  try{
    const response=await fetch(entry.origin+path,{method:req.method||'GET',headers:forwardHeaders(req),body:requestBody(req),redirect:'follow',cache:'no-store',signal:controller.signal});
    const buf=Buffer.from(await response.arrayBuffer());
    if(TRANSIENT.has(response.status)){const err=new Error('transient '+response.status);err.status=response.status;throw err}
    return {status:response.status,buf,type:response.headers.get('content-type')||'application/json',label:entry.label};
  }finally{clearTimeout(timer)}
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate');const path=suffix(req);
  if(/^\/health(?:\?|$)/.test(path)){
    Promise.allSettled(ORIGINS.map(async e=>{const c=new AbortController();const t=setTimeout(()=>c.abort(),4500);try{return await fetch(e.origin+'/health',{cache:'no-store',signal:c.signal})}finally{clearTimeout(t)}})).catch(()=>{});
    res.status(200).json({ok:true,warming:true,source:'lunea-vercel-proxy-v57.2'});return;
  }
  const controllers=[];
  try{
    const result=await Promise.any(ORIGINS.map(e=>call(e,path,req,controllers)));
    controllers.forEach(c=>{try{c.abort()}catch{}});res.setHeader('Content-Type',result.type);res.setHeader('X-LUNEA-API-Origin',result.label);res.status(result.status).send(result.buf);
  }catch(error){controllers.forEach(c=>{try{c.abort()}catch{}});res.status(503).json({ok:false,error:'LUNEA calculation server is waking',detail:String(error?.message||'upstream unavailable')})}
};