'use strict';
(() => {
  const W = window;
  const RELEASE = '42.1';
  W.__LUNEA_INTIMACY_ORACLE_ASSETS_V42__ = RELEASE;
  const ROW_FILES = Array.from({length: 6}, (_, i) => `./assets/intimacy-oracle/rows/oracle_row_${i + 1}.b64`);
  W.LUNEA_INTIMACY_ORACLE_ASSETS_V42 = Object.freeze({version: RELEASE, rowFiles: Object.freeze(ROW_FILES)});
})();
