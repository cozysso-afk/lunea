'use strict';

/* LUNEA Journal Header Fix V1
   Keeps the archive/journal entry visible in the compact mobile header.
   The luminous layout intentionally hides button text; the reading journal
   later replaces the archive SVG with text, which can leave a blank button.
*/
(() => {
  if (window.__LUNEA_JOURNAL_HEADER_FIX_V1__) return;
  window.__LUNEA_JOURNAL_HEADER_FIX_V1__ = true;

  const style = document.createElement('style');
  style.id = 'luneaJournalHeaderFixV1Style';
  style.textContent = `
    html.lunea-luminous-layout-v2 #archiveBtn{
      position:relative!important;
      overflow:visible!important;
      color:#9fe7dc!important;
      border-color:rgba(159,231,220,.20)!important;
      background:
        radial-gradient(circle at 50% 28%,rgba(159,231,220,.08),transparent 47%),
        linear-gradient(145deg,rgba(25,28,49,.78),rgba(11,13,27,.74))!important;
    }
    html.lunea-luminous-layout-v2 #archiveBtn > svg{
      display:none!important;
    }
    html.lunea-luminous-layout-v2 #archiveBtn::before{
      content:'';
      width:18px;height:18px;
      display:block;
      background:currentColor;
      -webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 4.5h11.5A2.5 2.5 0 0 1 19 7v12H7.5A2.5 2.5 0 0 1 5 16.5z'/%3E%3Cpath d='M8 7.5h7M8 11h7M8 14.5h4.5'/%3E%3Cpath d='M5 16.5A2.5 2.5 0 0 1 7.5 14H19'/%3E%3C/svg%3E") center/contain no-repeat;
      mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 4.5h11.5A2.5 2.5 0 0 1 19 7v12H7.5A2.5 2.5 0 0 1 5 16.5z'/%3E%3Cpath d='M8 7.5h7M8 11h7M8 14.5h4.5'/%3E%3Cpath d='M5 16.5A2.5 2.5 0 0 1 7.5 14H19'/%3E%3C/svg%3E") center/contain no-repeat;
      filter:drop-shadow(0 0 6px rgba(159,231,220,.20));
    }
    html.lunea-luminous-layout-v2 #archiveBtn::after{
      content:'기록';
      position:absolute;
      left:50%;bottom:3px;
      transform:translateX(-50%);
      font:700 6.6px/1 'Pretendard',sans-serif;
      letter-spacing:.1px;
      color:#cda8bd;
      white-space:nowrap;
    }
    html.lunea-luminous-layout-v2 #archiveBtn:active{
      border-color:rgba(159,231,220,.42)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 18px rgba(159,231,220,.10)!important;
    }
  `;
  document.head.appendChild(style);

  function patchButton() {
    const btn = document.getElementById('archiveBtn');
    if (!btn) return false;
    btn.title = '타로 기록 · 검증 일지';
    btn.setAttribute('aria-label', '타로 기록 · 검증 일지');
    btn.dataset.journalEntry = 'visible';
    return true;
  }

  if (!patchButton()) {
    document.addEventListener('DOMContentLoaded', patchButton, { once: true });
    setTimeout(patchButton, 500);
    setTimeout(patchButton, 1400);
  }

  console.info('✧ LUNEA Journal Header Fix V1 active');
})();
