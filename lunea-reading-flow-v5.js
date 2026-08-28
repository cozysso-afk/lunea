'use strict';

/*
  LUNEA Reading Flow V5
  =====================
  Visual / interaction-chrome enhancement only.
  Beautifies the full reading journey:
  setup sheet -> AI spread preview -> card table -> reading results.

  Does NOT alter RNG, card choice, spread routing, Horary, astrology,
  interpretation logic, archive data, or profile data.
*/
(() => {
  if (window.__LUNEA_READING_FLOW_V5__) return;
  window.__LUNEA_READING_FLOW_V5__ = true;
  document.documentElement.classList.add('lunea-reading-flow-v5');

  const style = document.createElement('style');
  style.id = 'luneaReadingFlowV5Style';
  style.textContent = `
    :root{
      --lunea-opal-a:#f6f4ff;
      --lunea-opal-b:#c6b7f4;
      --lunea-opal-c:#8eb8dd;
      --lunea-opal-d:#d9dfe9;
      --lunea-glass:rgba(15,18,34,.76);
      --lunea-line:rgba(224,228,244,.14);
    }

    @keyframes luneaFlowShimmer{
      0%,100%{background-position:0% 50%}
      50%{background-position:100% 50%}
    }
    @keyframes luneaStarBreath{
      0%,100%{opacity:.36;transform:scale(.92)}
      50%{opacity:.82;transform:scale(1.08)}
    }
    @keyframes luneaCardHalo{
      0%,100%{filter:drop-shadow(0 8px 13px rgba(0,0,0,.42))}
      50%{filter:drop-shadow(0 8px 17px rgba(148,122,215,.16))}
    }

    /* =======================================================
       1. READING SETUP SHEET
       ======================================================= */
    html.lunea-reading-flow-v5 .sheet{
      border-radius:31px 31px 0 0!important;
      padding:19px 17px calc(28px + env(safe-area-inset-bottom))!important;
      background:
        radial-gradient(circle at 16% 0%,rgba(177,151,239,.13),transparent 25%),
        radial-gradient(circle at 89% 8%,rgba(106,164,207,.10),transparent 27%),
        linear-gradient(180deg,rgba(18,20,39,.993),rgba(7,9,20,.997))!important;
      border-color:rgba(229,231,244,.18)!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.09),
        0 -26px 65px rgba(0,0,0,.66),
        0 -3px 34px rgba(142,112,211,.10)!important;
      overflow-y:auto!important;
      max-height:min(88dvh,760px)!important;
    }

    .lunea-sheet-handle{
      width:42px;height:4px;border-radius:999px;margin:-4px auto 14px;
      background:linear-gradient(90deg,rgba(200,207,222,.28),rgba(248,248,255,.82),rgba(177,165,214,.28));
      box-shadow:0 0 12px rgba(218,211,244,.22);
    }

    html.lunea-reading-flow-v5 .sheet>.sub{
      display:inline-flex!important;align-items:center;gap:5px;
      margin-bottom:5px!important;padding:5px 8px!important;border-radius:999px;
      color:#c9c2dc!important;background:rgba(222,225,239,.045);
      border:1px solid rgba(225,227,241,.075);
      font-size:8px!important;letter-spacing:1.5px!important;
    }

    html.lunea-reading-flow-v5 .sheet-title{
      margin:5px 0 4px!important;
      font:500 21px/1.28 'Noto Serif KR',serif!important;
      letter-spacing:-.35px!important;
      color:#faf9fd!important;
    }

    html.lunea-reading-flow-v5 .sheet>.desc{
      margin:0 0 13px!important;
      color:#8f90a4!important;font-size:10px!important;line-height:1.55!important;
      max-width:92%;
    }

    .lunea-flow-steps{
      position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:5px;
      margin:4px 0 14px;padding:1px;
    }
    .lunea-flow-step{
      min-width:0;padding:8px 7px 7px;border-radius:12px;
      background:linear-gradient(145deg,rgba(255,255,255,.038),rgba(133,113,186,.018));
      border:1px solid rgba(220,223,239,.075);
    }
    .lunea-flow-step b{
      display:block;margin-bottom:2px;color:#d6d9e4;font:650 8.5px 'Cinzel',sans-serif;letter-spacing:.9px;
    }
    .lunea-flow-step span{display:block;color:#74768a;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .lunea-flow-step:first-child{
      border-color:rgba(201,186,240,.23);
      background:linear-gradient(145deg,rgba(170,143,232,.105),rgba(112,143,185,.045));
      box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 0 18px rgba(145,118,205,.045);
    }
    .lunea-flow-step:first-child b{color:#e7ddff}

    html.lunea-reading-flow-v5 .sheet .field{
      margin-bottom:11px!important;
    }
    html.lunea-reading-flow-v5 .sheet .field>label{
      margin:0 0 6px!important;
      color:#d9d9e4!important;font-size:10px!important;font-weight:650!important;
      letter-spacing:.15px;
    }
    html.lunea-reading-flow-v5 #question{
      min-height:91px!important;height:91px!important;
      padding:13px 14px!important;border-radius:17px!important;
      font-size:12px!important;line-height:1.6!important;
      background:
        radial-gradient(circle at 90% 7%,rgba(171,142,233,.06),transparent 26%),
        rgba(255,255,255,.036)!important;
      border-color:rgba(223,225,239,.105)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important;
    }
    html.lunea-reading-flow-v5 #question:focus{
      border-color:rgba(203,187,246,.50)!important;
      box-shadow:0 0 0 3px rgba(161,134,224,.075),0 0 25px rgba(152,123,217,.055)!important;
    }

    /* Direction boxes become a calm two-choice segmented control. */
    html.lunea-reading-flow-v5 .sheet .field:has(.radio-box){
      display:grid;grid-template-columns:1fr 1fr;gap:7px;
    }
    html.lunea-reading-flow-v5 .sheet .field:has(.radio-box)>label{grid-column:1/-1}
    html.lunea-reading-flow-v5 .sheet .radio-box{
      margin:0!important;min-height:62px;padding:10px!important;border-radius:15px!important;
      display:flex;flex-direction:column;justify-content:center;
      background:rgba(255,255,255,.027)!important;
      border-color:rgba(224,226,239,.075)!important;
    }
    html.lunea-reading-flow-v5 .sheet .radio-box h5{font-size:10.5px!important;color:#e4e4ec!important}
    html.lunea-reading-flow-v5 .sheet .radio-box p{margin-top:3px!important;font-size:8.4px!important;line-height:1.35!important;color:#77798b!important}
    html.lunea-reading-flow-v5 .sheet .radio-box.selected{
      border-color:rgba(205,189,244,.38)!important;
      background:
        radial-gradient(circle at 87% 12%,rgba(223,229,248,.09),transparent 30%),
        linear-gradient(145deg,rgba(171,145,230,.13),rgba(101,133,178,.065))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 0 20px rgba(143,113,207,.055)!important;
    }
    html.lunea-reading-flow-v5 .sheet .radio-box.selected h5{color:#f4efff!important}

    html.lunea-reading-flow-v5 #drawBtn{
      min-height:49px!important;margin-top:3px!important;border-radius:16px!important;
      font-size:11.5px!important;letter-spacing:.05px;
      background-size:220% 220%!important;
      background-image:linear-gradient(115deg,#c1abf0 0%,#8f82d1 31%,#d7dce9 54%,#8cb6d7 75%,#a78ddd 100%)!important;
      animation:luneaFlowShimmer 7.5s ease-in-out infinite;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.42),0 10px 30px rgba(91,77,151,.29),0 0 23px rgba(174,151,232,.10)!important;
      text-shadow:0 1px 5px rgba(37,28,75,.22);
    }

    /* =======================================================
       2. AI SPREAD PREFLIGHT — EDITORIAL + VISUAL MINI SPREAD
       ======================================================= */
    html.lunea-reading-flow-v5 #luneaSpreadPreviewOverlay{
      padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom))!important;
      background:
        radial-gradient(circle at 50% 0%,rgba(100,83,152,.12),transparent 32%),
        rgba(3,5,13,.955)!important;
    }
    html.lunea-reading-flow-v5 #luneaSpreadPreviewModal{
      max-height:calc(100dvh - max(24px,env(safe-area-inset-top)) - max(20px,env(safe-area-inset-bottom)))!important;
      padding:21px 16px calc(25px + env(safe-area-inset-bottom))!important;
      border-radius:28px!important;
      border-color:rgba(226,229,243,.17)!important;
      background:
        radial-gradient(circle at 92% 0%,rgba(157,128,222,.13),transparent 27%),
        radial-gradient(circle at 9% 23%,rgba(94,147,190,.07),transparent 25%),
        linear-gradient(165deg,#111428 0%,#090b18 66%,#070814 100%)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.075),0 30px 75px rgba(0,0,0,.72),0 0 34px rgba(143,113,210,.07)!important;
    }
    html.lunea-reading-flow-v5 #luneaSpreadPreviewClose{
      right:14px!important;top:12px!important;width:32px;height:32px;border-radius:50%!important;
      display:grid;place-items:center;background:rgba(255,255,255,.035)!important;
      border:1px solid rgba(225,227,240,.08)!important;color:#aeb0bf!important;font-size:20px!important;
    }
    html.lunea-reading-flow-v5 .lsp-kicker{
      margin-top:1px!important;color:#bcb0dc!important;font-size:8px!important;letter-spacing:1.8px!important;
    }
    html.lunea-reading-flow-v5 .lsp-title{
      margin:5px 38px 14px 0!important;font:500 21px/1.3 'Noto Serif KR',serif!important;letter-spacing:-.25px;
    }
    html.lunea-reading-flow-v5 .lsp-intent{
      position:relative;overflow:hidden;margin-bottom:12px!important;padding:13px 13px 12px 45px!important;
      border-radius:17px!important;border-color:rgba(185,221,215,.12)!important;
      background:linear-gradient(145deg,rgba(97,164,154,.075),rgba(102,115,167,.045))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important;
    }
    html.lunea-reading-flow-v5 .lsp-intent::before{
      content:'✦';position:absolute;left:13px;top:13px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;
      color:#d8f3e9;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.18),rgba(143,209,193,.08));
      border:1px solid rgba(191,230,219,.13);font-size:9px;box-shadow:0 0 15px rgba(137,206,191,.08);
    }
    html.lunea-reading-flow-v5 .lsp-intent b{color:#c7e9df!important;font-size:9px!important;letter-spacing:.15px}
    html.lunea-reading-flow-v5 .lsp-intent div{font-size:10.5px!important;color:#ececf4!important;line-height:1.55!important}
    html.lunea-reading-flow-v5 .lsp-intent small{font-size:8.4px!important;color:#858798!important}

    .lunea-preview-constellation{
      position:relative;margin:9px 0 13px;padding:15px 12px 13px;border-radius:20px;
      min-height:128px;overflow:hidden;
      background:
        radial-gradient(circle at 50% 48%,rgba(148,121,213,.11),transparent 34%),
        linear-gradient(145deg,rgba(255,255,255,.028),rgba(97,117,163,.018));
      border:1px solid rgba(222,225,240,.085);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
    }
    .lunea-preview-constellation::before{
      content:'SPREAD MAP';position:absolute;left:12px;top:8px;color:#6e7082;font:650 7px 'Cinzel',sans-serif;letter-spacing:1.5px;
    }
    .lunea-preview-constellation::after{
      content:'';position:absolute;inset:0;pointer-events:none;opacity:.33;
      background-image:radial-gradient(circle at 15% 24%,#fff 0 .8px,transparent 1px),radial-gradient(circle at 82% 18%,#d7cdf1 0 .7px,transparent 1px),radial-gradient(circle at 69% 74%,#b8d2e6 0 .8px,transparent 1px),radial-gradient(circle at 28% 80%,#fff 0 .6px,transparent 1px);
    }
    .lunea-mini-map{
      position:relative;z-index:1;display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(4,26px);gap:5px;
      max-width:285px;margin:15px auto 0;align-items:center;justify-items:center;
    }
    .lunea-mini-card{
      width:18px;height:27px;border-radius:4px;display:grid;place-items:center;
      color:#dfe1eb;font:700 7px 'Pretendard',sans-serif;
      background:
        radial-gradient(circle at 35% 24%,rgba(255,255,255,.11),transparent 24%),
        linear-gradient(145deg,rgba(173,151,225,.20),rgba(66,82,128,.12));
      border:1px solid rgba(228,230,242,.23);
      box-shadow:0 4px 10px rgba(0,0,0,.24),0 0 9px rgba(164,139,218,.055);
    }

    html.lunea-reading-flow-v5 #luneaSpreadPreviewModal label{
      margin:10px 2px 5px!important;color:#cfd0da!important;font-size:9.5px!important;font-weight:650!important;
    }
    html.lunea-reading-flow-v5 #luneaSpreadPreviewTitle,
    html.lunea-reading-flow-v5 #luneaSpreadPreviewPositions{
      border-radius:15px!important;background:rgba(255,255,255,.033)!important;border-color:rgba(224,226,239,.085)!important;
    }
    html.lunea-reading-flow-v5 #luneaSpreadPreviewTitle{height:41px!important;font-size:11px!important}
    html.lunea-reading-flow-v5 #luneaSpreadPreviewPositions{
      min-height:154px!important;padding:12px 13px!important;font-size:10.5px!important;line-height:1.65!important;
      word-break:break-word!important;
    }
    html.lunea-reading-flow-v5 .lsp-count{color:#aeb7cd!important;font-size:8.5px!important;font-weight:550!important}
    html.lunea-reading-flow-v5 .lsp-actions{gap:8px!important;margin-top:12px!important}
    html.lunea-reading-flow-v5 .lsp-actions button{border-radius:14px!important;min-height:45px!important;font-size:10px!important}
    html.lunea-reading-flow-v5 #luneaSpreadPreviewConfirm{
      background-size:210% 210%!important;
      background-image:linear-gradient(115deg,#baa5e8,#8d81cd 35%,#ced9e8 58%,#86afd2 78%,#a187d7)!important;
      animation:luneaFlowShimmer 8s ease-in-out infinite;
    }
    html.lunea-reading-flow-v5 .lsp-note{margin-top:10px!important;color:#686a7b!important;font-size:8px!important;text-align:center}

    /* =======================================================
       3. SPREAD / CARD TABLE
       ======================================================= */
    html.lunea-reading-flow-v5 #spreadOverlay{
      padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom))!important;
      background:
        radial-gradient(circle at 50% 2%,rgba(118,91,178,.13),transparent 33%),
        rgba(3,4,11,.962)!important;
    }
    html.lunea-reading-flow-v5 #spreadOverlay>.modal{
      max-width:455px!important;max-height:calc(100dvh - max(22px,env(safe-area-inset-top)) - max(18px,env(safe-area-inset-bottom)))!important;
      border-radius:28px!important;padding:20px 15px 26px!important;
      background:
        radial-gradient(circle at 89% 0%,rgba(153,126,214,.115),transparent 27%),
        linear-gradient(175deg,#101326 0%,#090b17 55%,#060712 100%)!important;
      border-color:rgba(225,228,241,.15)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.065),0 28px 75px rgba(0,0,0,.74)!important;
    }
    html.lunea-reading-flow-v5 #spreadOverlay .close{
      width:32px;height:32px;top:12px!important;right:13px!important;border-radius:50%;
      display:grid;place-items:center;background:rgba(255,255,255,.032)!important;border:1px solid rgba(225,227,240,.075)!important;
      font-size:20px!important;
    }
    html.lunea-reading-flow-v5 #spreadType{
      display:inline-flex;align-items:center;min-height:24px;padding:4px 8px;border-radius:999px;
      color:#b8afd0!important;background:rgba(215,218,232,.035);border:1px solid rgba(221,223,238,.06);
      font-size:7.6px!important;letter-spacing:1.5px!important;
    }
    html.lunea-reading-flow-v5 #spreadQuestion{
      margin:9px 38px 9px 1px!important;font:500 18.5px/1.5 'Noto Serif KR',serif!important;
      letter-spacing:-.28px!important;color:#f6f4fa!important;
    }
    html.lunea-reading-flow-v5 .spread-rationale{
      margin:0 0 12px!important;padding:10px 11px!important;border-radius:14px!important;
      color:#9995aa!important;font-size:8.8px!important;line-height:1.6!important;
      background:rgba(255,255,255,.025)!important;border-color:rgba(219,222,236,.065)!important;
    }

    html.lunea-reading-flow-v5 .actionbar{
      justify-content:flex-start!important;gap:5px!important;margin:8px 0 13px!important;
      padding:0!important;overflow-x:auto;flex-wrap:nowrap!important;scrollbar-width:none;
    }
    html.lunea-reading-flow-v5 .actionbar::-webkit-scrollbar{display:none}
    html.lunea-reading-flow-v5 .actionbar .mini{
      flex:0 0 auto;min-height:31px!important;padding:6px 9px!important;border-radius:999px!important;
      color:#b7b8c8!important;background:rgba(255,255,255,.028)!important;border-color:rgba(223,225,239,.075)!important;
      font-size:8.5px!important;font-weight:570!important;
    }
    html.lunea-reading-flow-v5 .actionbar .mini:active{background:rgba(177,155,225,.08)!important}

    html.lunea-reading-flow-v5 #cards{
      position:relative;overflow:visible;margin:4px -4px 16px!important;padding:34px 8px 19px!important;
      min-height:175px;border-radius:22px;
      background:
        radial-gradient(ellipse at 50% 48%,rgba(133,108,193,.115),transparent 41%),
        radial-gradient(circle at 18% 19%,rgba(100,158,201,.045),transparent 24%),
        linear-gradient(145deg,rgba(255,255,255,.020),rgba(70,61,100,.012));
      border:1px solid rgba(218,222,238,.055);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.018),inset 0 0 40px rgba(71,49,115,.025);
    }
    html.lunea-reading-flow-v5 #cards::before{
      content:'THE SPREAD';position:absolute;left:12px;top:10px;color:#77788b;font:650 7.5px 'Cinzel',sans-serif;letter-spacing:1.65px;
    }
    html.lunea-reading-flow-v5 #cards::after{
      content:'✦';position:absolute;right:14px;top:8px;color:rgba(222,216,243,.56);font-size:8px;
      animation:luneaStarBreath 3.8s ease-in-out infinite;
    }
    html.lunea-reading-flow-v5 .tarot-card-wrapper{
      animation:luneaCardHalo 6s ease-in-out infinite,spawn .5s forwards!important;
    }
    html.lunea-reading-flow-v5 .tarot-card{
      border-radius:12px!important;
      box-shadow:0 9px 22px rgba(0,0,0,.52),0 0 0 1px rgba(224,227,240,.045)!important;
    }
    html.lunea-reading-flow-v5 .back,
    html.lunea-reading-flow-v5 .front{border-radius:12px!important}
    html.lunea-reading-flow-v5 .back{
      border-color:rgba(226,228,240,.26)!important;
      background:
        radial-gradient(circle at 50% 43%,rgba(174,146,231,.13),transparent 34%),
        linear-gradient(145deg,#191c35,#090b18)!important;
      box-shadow:inset 0 0 23px rgba(150,124,205,.045)!important;
    }
    html.lunea-reading-flow-v5 .back::after{
      color:#f2f1f7!important;font-size:19px!important;text-shadow:0 0 7px rgba(255,255,255,.62),0 0 17px rgba(184,158,237,.49)!important;
    }
    html.lunea-reading-flow-v5 .front{border-color:rgba(232,233,240,.65)!important}
    html.lunea-reading-flow-v5 .tarot-card-wrapper:has(.tarot-card.flipped){
      transform:translateY(-2px);
    }

    /* =======================================================
       4. CARD NOTES + AI READING RESULTS
       ======================================================= */
    html.lunea-reading-flow-v5 #results:not(:empty){
      position:relative;padding-top:26px;margin-top:5px;
    }
    html.lunea-reading-flow-v5 #results:not(:empty)::before{
      content:'CARD NOTES';position:absolute;left:1px;top:5px;color:#747688;font:650 7.5px 'Cinzel',sans-serif;letter-spacing:1.6px;
    }
    html.lunea-reading-flow-v5 .info{
      position:relative;overflow:hidden;margin-top:7px!important;padding:12px 13px 12px 15px!important;border-radius:17px!important;
      background:
        radial-gradient(circle at 95% 0%,rgba(153,130,209,.055),transparent 29%),
        linear-gradient(145deg,rgba(255,255,255,.033),rgba(96,86,130,.018))!important;
      border-color:rgba(221,224,238,.075)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important;
    }
    html.lunea-reading-flow-v5 .info::before{
      content:'';position:absolute;left:0;top:11px;bottom:11px;width:1.5px;border-radius:4px;
      background:linear-gradient(180deg,rgba(222,215,246,.15),rgba(173,148,226,.66),rgba(120,164,197,.26));
    }
    html.lunea-reading-flow-v5 .info .pos{color:#b8acd9!important;font-size:8.8px!important;letter-spacing:.12px}
    html.lunea-reading-flow-v5 .info h4{font-size:11.5px!important;font-weight:650!important;color:#eeeef4!important}
    html.lunea-reading-flow-v5 .info p{font-size:9.4px!important;line-height:1.55!important;color:#9293a4!important}
    html.lunea-reading-flow-v5 .res-badge{
      border-color:rgba(215,220,233,.18)!important;color:#c8cad5!important;background:rgba(255,255,255,.035)!important;
      border-radius:999px!important;font-size:7.8px!important;padding:3px 6px!important;
    }

    html.lunea-reading-flow-v5 #aiBox:not(:empty){
      position:relative;padding-top:27px;margin-top:9px;
    }
    html.lunea-reading-flow-v5 #aiBox:not(:empty)::before{
      content:'LUNEA INTERPRETATION';position:absolute;left:1px;top:5px;color:#8e83aa;font:650 7.5px 'Cinzel',sans-serif;letter-spacing:1.55px;
    }
    html.lunea-reading-flow-v5 .ai-card{
      position:relative;overflow:hidden;margin-top:0!important;padding:16px 15px 17px!important;border-radius:20px!important;
      background:
        radial-gradient(circle at 92% 0%,rgba(155,127,219,.115),transparent 31%),
        radial-gradient(circle at 4% 88%,rgba(83,139,183,.055),transparent 28%),
        linear-gradient(145deg,rgba(24,25,48,.90),rgba(10,12,25,.94))!important;
      border-color:rgba(209,202,231,.145)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 13px 30px rgba(0,0,0,.14)!important;
    }
    html.lunea-reading-flow-v5 .ai-card::after{
      content:'✦';position:absolute;right:13px;top:12px;color:rgba(224,217,245,.58);font-size:8px;text-shadow:0 0 9px rgba(193,171,239,.36);
    }
    html.lunea-reading-flow-v5 .ai-card h4{
      margin:0 0 11px!important;padding:0 22px 9px 0!important;
      color:#e4dff0!important;border-bottom-color:rgba(225,227,239,.065)!important;
      font:650 11px 'Cinzel','Noto Serif KR',serif!important;letter-spacing:.45px!important;
    }
    html.lunea-reading-flow-v5 .ai-body{
      font:400 11.8px/1.85 'Noto Serif KR',serif!important;color:#e7e5ed!important;
      word-break:normal!important;overflow-wrap:anywhere;
    }

    html.lunea-reading-flow-v5 .copybox{
      margin-top:12px!important;padding:7px!important;border-radius:17px!important;
      background:rgba(255,255,255,.018)!important;border-color:rgba(222,224,238,.055)!important;
    }
    html.lunea-reading-flow-v5 #copyPrompt{
      margin:0!important;min-height:43px!important;border-radius:13px!important;
      color:#d7d8e2!important;background:linear-gradient(145deg,rgba(167,145,217,.10),rgba(91,125,168,.06))!important;
      border-color:rgba(215,218,233,.13)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important;
      font-size:9.7px!important;
    }

    @media(max-width:390px){
      html.lunea-reading-flow-v5 .sheet{padding-left:14px!important;padding-right:14px!important}
      html.lunea-reading-flow-v5 #question{min-height:86px!important;height:86px!important}
      .lunea-flow-step{padding-left:6px;padding-right:6px}
      .lunea-flow-step span{font-size:7.5px}
      html.lunea-reading-flow-v5 #spreadQuestion{font-size:17.5px!important}
      html.lunea-reading-flow-v5 #cards{padding-left:5px!important;padding-right:5px!important}
    }

    @media(prefers-reduced-motion:reduce){
      html.lunea-reading-flow-v5 #drawBtn,
      html.lunea-reading-flow-v5 #luneaSpreadPreviewConfirm,
      html.lunea-reading-flow-v5 .tarot-card-wrapper,
      html.lunea-reading-flow-v5 #cards::after{animation:none!important}
    }
  `;
  document.head.appendChild(style);

  const $ = id => document.getElementById(id);

  function installSheetDecor(){
    const sheet = $('sheet');
    if (!sheet || sheet.dataset.flowV5 === '1') return;
    sheet.dataset.flowV5 = '1';

    const handle = document.createElement('div');
    handle.className = 'lunea-sheet-handle';
    handle.setAttribute('aria-hidden','true');
    sheet.insertBefore(handle, sheet.firstChild);

    const desc = $('sheetDesc');
    if (desc) {
      const steps = document.createElement('div');
      steps.className = 'lunea-flow-steps';
      steps.setAttribute('aria-label','리딩 진행 단계');
      steps.innerHTML = `
        <div class="lunea-flow-step"><b>01 · QUESTION</b><span>질문을 선명하게</span></div>
        <div class="lunea-flow-step"><b>02 · SPREAD</b><span>배열 구조 확인</span></div>
        <div class="lunea-flow-step"><b>03 · READING</b><span>카드와 해석</span></div>`;
      desc.insertAdjacentElement('afterend', steps);
    }
  }

  const mapCoords = {
    1:[[3,2]],
    2:[[2,2],[4,2]],
    3:[[3,1],[2,3],[4,3]],
    4:[[2,1],[4,1],[2,3],[4,3]],
    5:[[3,1],[2,2],[3,2],[4,2],[3,4]],
    6:[[2,1],[3,1],[4,1],[2,3],[3,3],[4,3]],
    7:[[3,1],[2,2],[3,2],[4,2],[2,4],[3,4],[4,4]],
    8:[[1,1],[2,1],[4,1],[5,1],[1,4],[2,4],[4,4],[5,4]],
    9:[[2,1],[3,1],[4,1],[2,2],[3,2],[4,2],[2,4],[3,4],[4,4]],
    10:[[3,1],[3,2],[2,2],[4,2],[3,3],[1,1],[5,1],[1,4],[3,4],[5,4]],
    11:[[3,1],[2,1],[4,1],[1,2],[3,2],[5,2],[1,3],[3,3],[5,3],[2,4],[4,4]],
    12:[[1,1],[2,1],[3,1],[4,1],[5,1],[1,2],[3,2],[5,2],[1,4],[2,4],[4,4],[5,4]]
  };

  function previewLines(){
    const ta = $('luneaSpreadPreviewPositions');
    return String(ta?.value || '').split(/\n+/).map(x=>x.replace(/^\s*\d{1,2}\s*[.)]\s*/, '').trim()).filter(Boolean).slice(0,12);
  }

  function renderMiniSpread(){
    const host = $('luneaMiniSpreadMap');
    if (!host) return;
    const lines = previewLines();
    host.innerHTML = '';
    const coords = mapCoords[lines.length] || mapCoords[Math.min(12,Math.max(1,lines.length))] || [];
    lines.forEach((_,i)=>{
      const c = document.createElement('div');
      c.className = 'lunea-mini-card';
      c.textContent = String(i+1);
      const xy = coords[i] || [((i%5)+1),Math.floor(i/5)+1];
      c.style.gridColumn = String(xy[0]);
      c.style.gridRow = String(xy[1]);
      host.appendChild(c);
    });
  }

  function installPreviewDecor(){
    const modal = $('luneaSpreadPreviewModal');
    if (!modal || modal.dataset.flowV5 === '1') return;
    modal.dataset.flowV5 = '1';
    const intent = modal.querySelector('.lsp-intent');
    if (intent) {
      const box = document.createElement('div');
      box.className = 'lunea-preview-constellation';
      box.innerHTML = '<div class="lunea-mini-map" id="luneaMiniSpreadMap"></div>';
      intent.insertAdjacentElement('afterend', box);
    }
    const ta = $('luneaSpreadPreviewPositions');
    if (ta) ta.addEventListener('input', renderMiniSpread);
    renderMiniSpread();
  }

  function refreshPreviewWhenShown(){
    const overlay = $('luneaSpreadPreviewOverlay');
    if (!overlay) return;
    const ob = new MutationObserver(()=>{
      if (overlay.classList.contains('show')) requestAnimationFrame(renderMiniSpread);
    });
    ob.observe(overlay,{attributes:true,attributeFilter:['class']});
  }

  function installSpreadDecor(){
    const overlay = $('spreadOverlay');
    if (!overlay || overlay.dataset.flowV5 === '1') return;
    overlay.dataset.flowV5 = '1';
    /* CSS carries the layout. We intentionally do not rearrange functional nodes. */
  }

  function boot(){
    installSheetDecor();
    installPreviewDecor();
    installSpreadDecor();
    refreshPreviewWhenShown();

    const ob = new MutationObserver(()=>{
      requestAnimationFrame(()=>{
        installSheetDecor();
        installPreviewDecor();
        installSpreadDecor();
        if ($('luneaSpreadPreviewOverlay')?.classList.contains('show')) renderMiniSpread();
      });
    });
    ob.observe(document.documentElement,{childList:true,subtree:true});
    console.info('✦ LUNEA Reading Flow V5 active · setup → AI spread map → card table → interpretation');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
