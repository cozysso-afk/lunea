'use strict';

/*
  LUNEA MEIHUA ENGINE V1
  ======================
  Deterministic Plum Blossom Numerology (梅花易數) core.

  Default method locked for LUNEA V1:
  - year branch number + lunar month + lunar day -> upper trigram
  - + hour branch number -> lower trigram
  - total -> moving line
  - remainders: 0 => 8 for trigrams, 0 => 6 for moving line
  - moving trigram = 用, unmoving trigram = 體
  - mutual hexagram uses lines 2-4 (lower) and 3-5 (upper)
  - changed hexagram flips the single moving line

  Calendar provenance:
  - browser Intl Chinese lunisolar calendar in the requested timezone
  - civil day boundary at 00:00
  - leap month uses the same numeric month value as the regular month
*/
(() => {
  const W = typeof window !== 'undefined' ? window : globalThis;
  if (W.__LUNEA_MEIHUA_ENGINE_V1__) return;
  W.__LUNEA_MEIHUA_ENGINE_V1__ = true;

  const VERSION = 1;
  const BRANCHES = Object.freeze([
    null,
    {n:1, hanja:'子', ko:'자'}, {n:2, hanja:'丑', ko:'축'}, {n:3, hanja:'寅', ko:'인'},
    {n:4, hanja:'卯', ko:'묘'}, {n:5, hanja:'辰', ko:'진'}, {n:6, hanja:'巳', ko:'사'},
    {n:7, hanja:'午', ko:'오'}, {n:8, hanja:'未', ko:'미'}, {n:9, hanja:'申', ko:'신'},
    {n:10, hanja:'酉', ko:'유'}, {n:11, hanja:'戌', ko:'술'}, {n:12, hanja:'亥', ko:'해'}
  ]);

  const TRIGRAMS = Object.freeze({
    QIAN:Object.freeze({key:'QIAN',n:1,symbol:'☰',hanja:'乾',ko:'건',nature:'하늘',element:'Metal',elementKo:'금',lines:[1,1,1]}),
    DUI:Object.freeze({key:'DUI',n:2,symbol:'☱',hanja:'兌',ko:'태',nature:'못',element:'Metal',elementKo:'금',lines:[1,1,0]}),
    LI:Object.freeze({key:'LI',n:3,symbol:'☲',hanja:'離',ko:'리',nature:'불',element:'Fire',elementKo:'화',lines:[1,0,1]}),
    ZHEN:Object.freeze({key:'ZHEN',n:4,symbol:'☳',hanja:'震',ko:'진',nature:'우레',element:'Wood',elementKo:'목',lines:[1,0,0]}),
    XUN:Object.freeze({key:'XUN',n:5,symbol:'☴',hanja:'巽',ko:'손',nature:'바람',element:'Wood',elementKo:'목',lines:[0,1,1]}),
    KAN:Object.freeze({key:'KAN',n:6,symbol:'☵',hanja:'坎',ko:'감',nature:'물',element:'Water',elementKo:'수',lines:[0,1,0]}),
    GEN:Object.freeze({key:'GEN',n:7,symbol:'☶',hanja:'艮',ko:'간',nature:'산',element:'Earth',elementKo:'토',lines:[0,0,1]}),
    KUN:Object.freeze({key:'KUN',n:8,symbol:'☷',hanja:'坤',ko:'곤',nature:'땅',element:'Earth',elementKo:'토',lines:[0,0,0]})
  });
  const TRIGRAM_LIST = Object.freeze(Object.values(TRIGRAMS).sort((a,b)=>a.n-b.n));
  const TRIGRAM_BY_NUMBER = Object.freeze(Object.fromEntries(TRIGRAM_LIST.map(x=>[x.n,x])));
  const TRIGRAM_BY_LINES = Object.freeze(Object.fromEntries(TRIGRAM_LIST.map(x=>[x.lines.join(''),x])));

  const HEX_ROWS = [
    [1,'QIAN','QIAN','乾為天','건위천'],[2,'KUN','KUN','坤為地','곤위지'],[3,'KAN','ZHEN','水雷屯','수뢰둔'],[4,'GEN','KAN','山水蒙','산수몽'],
    [5,'KAN','QIAN','水天需','수천수'],[6,'QIAN','KAN','天水訟','천수송'],[7,'KUN','KAN','地水師','지수사'],[8,'KAN','KUN','水地比','수지비'],
    [9,'XUN','QIAN','風天小畜','풍천소축'],[10,'QIAN','DUI','天澤履','천택리'],[11,'KUN','QIAN','地天泰','지천태'],[12,'QIAN','KUN','天地否','천지비'],
    [13,'QIAN','LI','天火同人','천화동인'],[14,'LI','QIAN','火天大有','화천대유'],[15,'KUN','GEN','地山謙','지산겸'],[16,'ZHEN','KUN','雷地豫','뇌지예'],
    [17,'DUI','ZHEN','澤雷隨','택뢰수'],[18,'GEN','XUN','山風蠱','산풍고'],[19,'KUN','DUI','地澤臨','지택림'],[20,'XUN','KUN','風地觀','풍지관'],
    [21,'LI','ZHEN','火雷噬嗑','화뢰서합'],[22,'GEN','LI','山火賁','산화비'],[23,'GEN','KUN','山地剝','산지박'],[24,'KUN','ZHEN','地雷復','지뢰복'],
    [25,'QIAN','ZHEN','天雷無妄','천뢰무망'],[26,'GEN','QIAN','山天大畜','산천대축'],[27,'GEN','ZHEN','山雷頤','산뢰이'],[28,'DUI','XUN','澤風大過','택풍대과'],
    [29,'KAN','KAN','坎為水','감위수'],[30,'LI','LI','離為火','이위화'],[31,'DUI','GEN','澤山咸','택산함'],[32,'ZHEN','XUN','雷風恒','뇌풍항'],
    [33,'QIAN','GEN','天山遯','천산둔'],[34,'ZHEN','QIAN','雷天大壯','뇌천대장'],[35,'LI','KUN','火地晉','화지진'],[36,'KUN','LI','地火明夷','지화명이'],
    [37,'XUN','LI','風火家人','풍화가인'],[38,'LI','DUI','火澤睽','화택규'],[39,'KAN','GEN','水山蹇','수산건'],[40,'ZHEN','KAN','雷水解','뇌수해'],
    [41,'GEN','DUI','山澤損','산택손'],[42,'XUN','ZHEN','風雷益','풍뢰익'],[43,'DUI','QIAN','澤天夬','택천쾌'],[44,'QIAN','XUN','天風姤','천풍구'],
    [45,'DUI','KUN','澤地萃','택지췌'],[46,'KUN','XUN','地風升','지풍승'],[47,'DUI','KAN','澤水困','택수곤'],[48,'KAN','XUN','水風井','수풍정'],
    [49,'DUI','LI','澤火革','택화혁'],[50,'LI','XUN','火風鼎','화풍정'],[51,'ZHEN','ZHEN','震為雷','진위뢰'],[52,'GEN','GEN','艮為山','간위산'],
    [53,'XUN','GEN','風山漸','풍산점'],[54,'ZHEN','DUI','雷澤歸妹','뇌택귀매'],[55,'ZHEN','LI','雷火豐','뇌화풍'],[56,'LI','GEN','火山旅','화산려'],
    [57,'XUN','XUN','巽為風','손위풍'],[58,'DUI','DUI','兌為澤','태위택'],[59,'XUN','KAN','風水渙','풍수환'],[60,'KAN','DUI','水澤節','수택절'],
    [61,'XUN','DUI','風澤中孚','풍택중부'],[62,'ZHEN','GEN','雷山小過','뇌산소과'],[63,'KAN','LI','水火既濟','수화기제'],[64,'LI','KAN','火水未濟','화수미제']
  ];

  const HEXAGRAMS = Object.freeze(HEX_ROWS.map(([number,upper,lower,hanja,ko])=>Object.freeze({number,upper,lower,hanja,ko})));
  const HEX_BY_PAIR = Object.freeze(Object.fromEntries(HEXAGRAMS.map(x=>[`${x.upper}/${x.lower}`,x])));

  const GENERATES = Object.freeze({Wood:'Fire',Fire:'Earth',Earth:'Metal',Metal:'Water',Water:'Wood'});
  const CONTROLS = Object.freeze({Wood:'Earth',Earth:'Water',Water:'Fire',Fire:'Metal',Metal:'Wood'});

  const modPositive = (n,m) => ((Number(n)%m)+m)%m;
  const remainder1 = (n,m) => {
    const r = modPositive(n,m);
    return r === 0 ? m : r;
  };

  function cloneTrigram(t) {
    return {key:t.key,n:t.n,symbol:t.symbol,hanja:t.hanja,ko:t.ko,nature:t.nature,element:t.element,elementKo:t.elementKo,lines:[...t.lines]};
  }

  function trigramFromLines(lines) {
    const t = TRIGRAM_BY_LINES[lines.join('')];
    if (!t) throw new Error(`알 수 없는 팔괘 효 배열: ${lines.join('')}`);
    return t;
  }

  function hexagramFromTrigrams(upper,lower) {
    const u = typeof upper === 'string' ? TRIGRAMS[upper] : upper;
    const l = typeof lower === 'string' ? TRIGRAMS[lower] : lower;
    const h = HEX_BY_PAIR[`${u.key}/${l.key}`];
    if (!h) throw new Error(`64괘 매핑 없음: ${u.key}/${l.key}`);
    return {
      number:h.number,hanja:h.hanja,ko:h.ko,
      upper:cloneTrigram(u),lower:cloneTrigram(l),
      lines:[...l.lines,...u.lines]
    };
  }

  function hexagramFromLines(lines) {
    if (!Array.isArray(lines) || lines.length !== 6) throw new Error('6효 배열이 필요해.');
    const lower = trigramFromLines(lines.slice(0,3));
    const upper = trigramFromLines(lines.slice(3,6));
    return hexagramFromTrigrams(upper,lower);
  }

  function mutualHexagram(primary) {
    const lines = primary.lines;
    const lower = trigramFromLines([lines[1],lines[2],lines[3]]);
    const upper = trigramFromLines([lines[2],lines[3],lines[4]]);
    return hexagramFromTrigrams(upper,lower);
  }

  function changedHexagram(primary,movingLine) {
    const lines = [...primary.lines];
    const index = movingLine - 1;
    lines[index] = lines[index] ? 0 : 1;
    return hexagramFromLines(lines);
  }

  function elementRelation(body,use) {
    if (body.element === use.element) return {code:'BI_HE',hanja:'比和',ko:'비화',direction:'same',summary:'체와 용이 같은 오행'};
    if (GENERATES[body.element] === use.element) return {code:'TI_SHENG_YONG',hanja:'體生用',ko:'체생용',direction:'body-generates-use',summary:'체가 용을 생함'};
    if (GENERATES[use.element] === body.element) return {code:'YONG_SHENG_TI',hanja:'用生體',ko:'용생체',direction:'use-generates-body',summary:'용이 체를 생함'};
    if (CONTROLS[body.element] === use.element) return {code:'TI_KE_YONG',hanja:'體克用',ko:'체극용',direction:'body-controls-use',summary:'체가 용을 극함'};
    if (CONTROLS[use.element] === body.element) return {code:'YONG_KE_TI',hanja:'用克體',ko:'용극체',direction:'use-controls-body',summary:'용이 체를 극함'};
    return {code:'UNKNOWN',hanja:'',ko:'미상',direction:'unknown',summary:'오행 관계 미상'};
  }

  function bodyUse(primary,changed,movingLine) {
    const movingSide = movingLine <= 3 ? 'lower' : 'upper';
    const bodySide = movingSide === 'lower' ? 'upper' : 'lower';
    const useSide = movingSide;
    const body = primary[bodySide];
    const use = primary[useSide];
    const changedUse = changed[useSide];
    return {
      movingSide,bodySide,useSide,
      body:cloneTrigram(body),use:cloneTrigram(use),changedUse:cloneTrigram(changedUse),
      primaryRelation:elementRelation(body,use),
      changedRelation:elementRelation(body,changedUse)
    };
  }

  function yearBranchNumber(relatedYear) {
    const y = Number(relatedYear);
    if (!Number.isInteger(y)) throw new Error('음력 연도를 읽지 못했어.');
    // 2020 was 庚子; 子 is branch number 1.
    return modPositive(y - 2020,12) + 1;
  }

  function hourBranchNumber(hour) {
    const h = Number(hour);
    if (!Number.isFinite(h) || h < 0 || h > 23) throw new Error('시각은 0~23시여야 해.');
    return Math.floor((Math.floor(h) + 1) / 2) % 12 + 1;
  }

  function lunarPartsFromDate(date=new Date(),timeZone) {
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) throw new Error('유효한 질문 시각이 아니야.');

    const lunarFmt = new Intl.DateTimeFormat('en-u-ca-chinese',{
      timeZone:tz,year:'numeric',month:'numeric',day:'numeric'
    });
    const lp = Object.fromEntries(lunarFmt.formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    const rawMonth = String(lp.month || '');
    const monthMatch = rawMonth.match(/\d+/);
    const relatedYear = Number(lp.relatedYear || lp.year);
    const lunarMonth = Number(monthMatch?.[0]);
    const lunarDay = Number(lp.day);
    if (!relatedYear || !lunarMonth || !lunarDay) throw new Error('Intl 음력 달력 값을 읽지 못했어.');

    const clockFmt = new Intl.DateTimeFormat('en-CA',{
      timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
    });
    const cp = Object.fromEntries(clockFmt.formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    let hour = Number(cp.hour);
    if (hour === 24) hour = 0;
    const yBranch = yearBranchNumber(relatedYear);
    const hBranch = hourBranchNumber(hour);
    return {
      timeZone:tz,
      instant:d.toISOString(),
      local:{year:Number(cp.year),month:Number(cp.month),day:Number(cp.day),hour,minute:Number(cp.minute),second:Number(cp.second)},
      lunar:{relatedYear,month:lunarMonth,day:lunarDay,isLeapMonth:/bis|leap/i.test(rawMonth),rawMonth},
      yearBranch:{...BRANCHES[yBranch]},
      hourBranch:{...BRANCHES[hBranch]}
    };
  }

  function calculateFromComponents(input) {
    const yearNo = Number(input?.yearBranchNumber ?? input?.yearBranch?.n);
    const month = Number(input?.lunarMonth ?? input?.lunar?.month);
    const day = Number(input?.lunarDay ?? input?.lunar?.day);
    const hourNo = Number(input?.hourBranchNumber ?? input?.hourBranch?.n);
    if (![yearNo,month,day,hourNo].every(Number.isInteger)) throw new Error('연지·음력 월·일·시지 숫자가 모두 필요해.');
    if (yearNo < 1 || yearNo > 12 || month < 1 || month > 12 || day < 1 || day > 30 || hourNo < 1 || hourNo > 12) throw new Error('기괘 입력 범위를 확인해줘.');

    const upperSum = yearNo + month + day;
    const total = upperSum + hourNo;
    const upperNo = remainder1(upperSum,8);
    const lowerNo = remainder1(total,8);
    const movingLine = remainder1(total,6);
    const upper = TRIGRAM_BY_NUMBER[upperNo];
    const lower = TRIGRAM_BY_NUMBER[lowerNo];
    const primary = hexagramFromTrigrams(upper,lower);
    const mutual = mutualHexagram(primary);
    const changed = changedHexagram(primary,movingLine);
    const tiYong = bodyUse(primary,changed,movingLine);

    return {
      version:VERSION,
      method:'YEAR_MONTH_DAY_HOUR',
      methodKo:'연·월·일·시 기괘법',
      components:{
        yearBranchNumber:yearNo,
        lunarMonth:month,
        lunarDay:day,
        hourBranchNumber:hourNo,
        isLeapMonth:!!(input?.isLeapMonth ?? input?.lunar?.isLeapMonth)
      },
      arithmetic:{upperSum,total,upperRemainder:upperNo,lowerRemainder:lowerNo,movingRemainder:movingLine},
      movingLine,
      primary,mutual,changed,
      bodyUse:tiYong,
      provenance:{
        trigramNumbering:'1 乾, 2 兌, 3 離, 4 震, 5 巽, 6 坎, 7 艮, 8 坤',
        branchNumbering:'子1 丑2 寅3 卯4 辰5 巳6 午7 未8 申9 酉10 戌11 亥12',
        remainderRule:'팔괘 0→8, 동효 0→6',
        bodyUseRule:'동효가 속한 괘=用, 반대 괘=體',
        mutualRule:'2·3·4효=하호괘, 3·4·5효=상호괘',
        leapMonthRule:'윤달은 해당 월의 같은 숫자를 사용'
      }
    };
  }

  function calculateAt(date=new Date(),options={}) {
    const calendar = lunarPartsFromDate(date,options.timeZone);
    const result = calculateFromComponents({
      yearBranchNumber:calendar.yearBranch.n,
      lunarMonth:calendar.lunar.month,
      lunarDay:calendar.lunar.day,
      hourBranchNumber:calendar.hourBranch.n,
      isLeapMonth:calendar.lunar.isLeapMonth
    });
    return {
      ...result,
      questionTime:calendar,
      provenance:{
        ...result.provenance,
        calendar:'Intl Chinese lunisolar calendar',
        timeZone:calendar.timeZone,
        dayBoundary:'civil midnight 00:00',
        calendarNote:'V1은 브라우저 ICU/Intl 동아시아 태음태양력을 사용하며 질문자의 지정 timezone으로 날짜를 판정'
      }
    };
  }

  const API = Object.freeze({
    version:VERSION,
    branches:BRANCHES,
    trigrams:TRIGRAMS,
    hexagrams:HEXAGRAMS,
    remainder1,
    yearBranchNumber,
    hourBranchNumber,
    lunarPartsFromDate,
    hexagramFromTrigrams,
    hexagramFromLines,
    mutualHexagram,
    changedHexagram,
    elementRelation,
    calculateFromComponents,
    calculateAt
  });

  W.LUNEA_MEIHUA_ENGINE_V1 = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
