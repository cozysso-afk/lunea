'use strict';

/*
  LUNEA Journal Verdict Labels V1
  Display-only wording correction for post-reading validation.
  Persisted status keys remain hit / partial / miss.
*/
(() => {
  if (window.__LUNEA_JOURNAL_VERDICT_LABELS_V1__) return;
  window.__LUNEA_JOURNAL_VERDICT_LABELS_V1__ = true;

  const LABEL = Object.freeze({
    hit:'맞음',
    partial:'애매',
    miss:'틀림'
  });
  const LEGACY = Object.freeze({
    '맞':'hit', '✓ 맞':'hit', '✓ 맞음':'hit', '맞음':'hit',
    '애':'partial', '△ 애':'partial', '△ 부분':'partial', '부분':'partial', '애매':'partial',
    '틀':'miss', '× 틀':'miss', '× 틀림':'miss', '틀림':'miss'
  });
  const normalize = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();

  function setText(node, text) {
    if (node && node.textContent !== text) node.textContent = text;
  }

  function apply(root = document) {
    const statusSelect = document.getElementById('ljStatus');
    if (statusSelect) {
      [...statusSelect.options].forEach(option => {
        if (option.value === 'hit') setText(option, LABEL.hit);
        else if (option.value === 'partial') setText(option, LABEL.partial);
        else if (option.value === 'miss') setText(option, LABEL.miss);
      });
    }

    root.querySelectorAll?.('#archiveOverlay .lj-statuses button').forEach(button => {
      const status = button.dataset.luneaVerdictStatus || LEGACY[normalize(button.textContent)] || '';
      if (LABEL[status]) {
        button.dataset.luneaVerdictStatus = status;
        setText(button, LABEL[status]);
      }
    });

    root.querySelectorAll?.('#archiveOverlay .lj-badge').forEach(badge => {
      const status = badge.dataset.s || LEGACY[normalize(badge.textContent)] || '';
      if (LABEL[status]) setText(badge, LABEL[status]);
    });

    const note = document.getElementById('ljNote');
    if (note?.textContent) {
      const next = note.textContent
        .replace(/·\s*맞(?:음)?\s+(\d+)/g, '· 맞음 $1')
        .replace(/·\s*(?:애|부분|애매)\s+(\d+)/g, '· 애매 $1')
        .replace(/·\s*틀(?:림)?\s+(\d+)/g, '· 틀림 $1')
        .replace(/점수=\((?:맞|맞음)\+(?:애|부분|애매)×0\.5\)/g, '점수=(맞음+애매×0.5)');
      setText(note, next);
    }

    document.documentElement.dataset.luneaJournalVerdictLabels = 'v1';
  }

  function boot() {
    apply();
    const overlay = document.getElementById('archiveOverlay');
    if (overlay) {
      new MutationObserver(() => apply(overlay)).observe(overlay, {
        childList:true,
        subtree:true,
        characterData:true
      });
    }
    [120, 420, 900, 1700, 3100].forEach(ms => setTimeout(apply, ms));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  console.info('✧ LUNEA Journal Verdict Labels V1 active · 맞음/애매/틀림');
})();
