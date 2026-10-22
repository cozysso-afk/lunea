'use strict';
/* LUNEA Reading Consistency V1
 * Reuse accepted interpretations for an identical reading. Require an
 * explicit matching verdict at the beginning/end of newly generated text.
 * This is not a tarot scoring system or a claim of predictive accuracy.
 */
(() => {
  if (typeof window === 'undefined' || window.LUNEA_READING_CONSISTENCY_V1) return;
  const W=window;
  const VERSION='reading-consistency-v1';
  const KEY='LUNEA_READING_CONSISTENCY_CACHE_V1';
  const CODES=['YES','NO','UNCERTAIN','NON_BINARY'];
  const MAX_ENTRIES=25, MAX_CHARS=240000;
  const memory=new Map();

  function fingerprint(state,profile) {
    if(!state || !Array.isArray(state.drawn) || !state.drawn.length)return '';
    const card=c=>({
      code:String(c?.code||''),
      name:String(c?.name||''),
      position:String(c?.position||''),
      reversed:!!c?.isReversed,
      subCards:(Array.isArray(c?.subCards)?c.subCards:[]).map(s=>({
        code:String(s?.code||''),name:String(s?.name||''),reversed:!!s?.isReversed
      }))
    });
    // The question itself preserves the period and distinction between
    // reply/new-topic/contact. Avoid normalizing those details away.
    return JSON.stringify({
      version:VERSION,category:String(state.category||''),
      question:String(state.question||'').trim(),
      title:String(state.title||''),rationale:String(state.rationale||''),
      positions:(Array.isArray(state.positions)?state.positions:[]).map(String),
      cards:state.drawn.map(card),
      profile:profile?{
        thaiDay:String(profile.thaiDay||''),thaiRuler:String(profile.thaiRuler||''),
        saju:String(profile.saju||''),zodiac:String(profile.zodiac||'')
      }:null
    });
  }
  function load() {
    try {
      const data=JSON.parse(W.localStorage.getItem(KEY)||'[]');
      return Array.isArray(data)?data.filter(x=>x && typeof x.key==='string' &&
        typeof x.text==='string' && CODES.includes(x.verdict)):[];
    } catch {return [];}
  }
  function get(key) {
    if(!key)return null;
    if(memory.has(key))return memory.get(key);
    const entry=load().find(x=>x.key===key);
    if(entry){memory.set(key,entry);return entry;}
    return null;
  }
  function save(key,result) {
    if(!key || !result || !CODES.includes(result.verdict) ||
       typeof result.text!=='string' || !result.text.trim())return null;
    const record={
      key,version:VERSION,verdict:result.verdict,
      text:result.text.trim(),recordedAt:new Date().toISOString()
    };
    if(record.text.length>35000)return null;
    memory.set(key,record);
    // Browser storage is best-effort; the archive/journal is retained
    // independently when the user presses Save.
    try {
      const rows=[record,...load().filter(x=>x.key!==key)].slice(0,MAX_ENTRIES);
      while(rows.length>1 && JSON.stringify(rows).length>MAX_CHARS)rows.pop();
      W.localStorage.setItem(KEY,JSON.stringify(rows));
    }catch {}
    return record;
  }
  function readingPrompt(base) {
    return String(base||'') +
      '\n\n[루니아 동일 리딩 결론 일관성 계약 V1]\n' +
      '기존 RWS 카드·포지션·보조 카드의 해석 우선순위는 그대로 지킨다. 카드 점수나 임의 확률을 만들지 않는다.\n' +
      '감정/의향/실제 행동/현실 결과를 혼동하지 않는다. 질문한 사건과 기한을 바꾸지 않는다.\n' +
      '첫 줄은 반드시 [LUNEA_VERDICT:코드] 하나만 출력한다. 코드는 YES, NO, UNCERTAIN, NON_BINARY 중 하나다.\n' +
      '명확한 양자택일 질문이면 YES=긍정 우세, NO=부정 우세, UNCERTAIN=판단 보류를 사용한다.\n' +
      '속마음·원인·조언처럼 양자택일이 아닌 질문에는 NON_BINARY를 사용한다.\n' +
      '본문 첫 문단에 그 판정에 맞는 핵심 결론을 쓰고, 포지션별 근거·반대 신호를 구분해 설명한다.\n' +
      '마지막 줄은 반드시 [LUNEA_END:코드]이고 첫 줄의 코드와 정확히 같아야 한다.\n' +
      '본문의 최종 결론도 첫 줄 판정과 일치해야 한다. 반증 신호를 적는 것은 허용하지만 이를 뒤집힌 확정 결론처럼 쓰지 않는다.\n' +
      '판정 코드를 본문에 추가하거나 다른 형식의 마커를 만들지 않는다.';
  }
  function validate(raw) {
    const text=String(raw||'').trim();
    const match=text.match(/^\[LUNEA_VERDICT:(YES|NO|UNCERTAIN|NON_BINARY)\]\s*\n([\s\S]*?)\n\[LUNEA_END:(YES|NO|UNCERTAIN|NON_BINARY)\]\s*$/);
    if(!match)return {ok:false,reason:'판정 표시가 누락되거나 형식이 다름'};
    if(match[1]!==match[3])return {ok:false,reason:'앞뒤 판정이 서로 다름'};
    const body=match[2].trim();
    if(body.length<40)return {ok:false,reason:'근거가 부족한 해석'};
    // Catch explicit opposing summary verdicts without classifying the
    // user's event from arbitrary narrative prose (prone to false positives).
    const explicit=/(?:^|\n)\s*(?:#{1,3}\s*)?(?:\*\*)?(?:최종\s*|핵심\s*)?(?:판정|결론)\s*(?:\*\*)?\s*[:：]\s*(YES|NO|UNCERTAIN|NON_BINARY)\b/g;
    for(const m of body.matchAll(explicit)){
      if(m[1]!==match[1])return {ok:false,reason:'본문에 다른 판정이 표시됨'};
    }
    return {ok:true,verdict:match[1],text:body};
  }
  const api=Object.freeze({version:VERSION,fingerprint,get,save,readingPrompt,validate});
  W.LUNEA_READING_CONSISTENCY_V1=api;
})();
