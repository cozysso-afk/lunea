# LUNEA Composite Golden Manifest

This document is the recovery contract for the post-390432a incident. It is intentionally **composite**: no single historical commit contains every approved behavior plus the later INTIMACY exact-restore fixes.

## Reference anchors

- Approved product/UI + Message Oracle + reading attachments reference: `81a604db744e14e44652f967a32c13bb2cae656b` (`verify-662f40e-iphone`).
- Current production recovery core: `d533e93e2107bec906d308aef3667c9287c6f964`.
- Current recovery-core blobs that must not regress:
  - `lunea-cache-refresh-v1.js` → `50b5200f1ddf3bd251c3c4099b3c48398a9c735d`
  - `lunea-intimacy-ai-bridge-v34.js` → `d50bfaf9098404c45ef79d9d65eeba3f2359dac5`
  - `lunea-reading-draft-v1.js` → starts from current v2/exact-restore behavior and must be merged, never replaced by the older verify copy.

## Product contracts

### 1. Reading action grid

The mobile 3-column action order is exactly:

1. `flipAll`
2. `extraCard`
3. `saveReading`
4. `retry`
5. `timingSupportBtn`
6. `luneaMessageOracleSupportBtn`
7. `astroTransitBtn`
8. `astroReturnBtn`
9. `astroHoraryBtn`
10. `thaiTaksaBtn` (legacy `luneaThaiTarotBridgeBtn` may share this rank)
11. `luneaThaiTarotRangeBtn`
12. `aiRead`
13. `luneaTopCopyPrompt`

Unknown/future controls may follow, but may not reorder these approved controls.

### 2. Message Oracle is a first-class optional support layer

Required source files:

- `lunea-message-oracle-v1.js`
- `lunea-message-oracle-ui-v1.js`
- `lunea-message-oracle-support-v1.js`

Required original assets:

- `assets/message-oracle/message_oracle_back.jpeg`
- `assets/message-oracle/message_oracle_back_mask.png`
- `assets/message-oracle/message_oracle_front_frame.jpeg`
- `assets/message-oracle/message_oracle_front_mask.png`
- `assets/message-oracle/message_oracle_logo.png`

The support result is bound to the exact reading signature/question. A result from another reading must never leak into the current reading. The support adapter must notify the attachment registry when the result changes.

### 3. Exact-reading attachment ownership

`lunea-reading-attachments-v1.js` owns bounded support evidence for the active reading and archive enrichment. Message Oracle, Transit, Returns, Thai/Taksa, Horary and compatible support layers must be associated with a reading signature before draft/archive persistence.

The active draft must capture and restore attachments only when the signature matches the restored RWS reading.

### 4. Draft recovery is the merged v2 contract

The current INTIMACY exact-restore work stays authoritative:

- preserve `intimacyOracle` exact snapshot;
- retain a fallback while the Oracle runtime is late;
- use a restore generation guard;
- wait for `restoreOracleDraftExact` where available;
- never redraw RNG during exact restore;
- same-build freshness checks must not replace the document.

On top of that, the draft must capture/restore `LUNEA_READING_ATTACHMENTS_V1`. Restoring an old verify draft file wholesale is forbidden because it would remove the newer INTIMACY exact-restore safeguards.

### 5. Prompt evidence contract

`lunea-final-prompt-priority-v1.js` must recognize `[MESSAGE ORACLE · 현재 리딩의 연락·소식 보조]` only when an exact-current-reading Message Oracle result exists. It must not invent a Message Oracle result or pull a stale standalone result. Message score is a symbolic signal, not a real-world probability.

### 6. INTIMACY Oracle contract

- Base Oracle mode remains 0 / 1 / 3.
- Supplemental Oracle cards are separate from base cards and capped at 3.
- No duplicate Oracle code across base + supplemental draw.
- Supplemental draw invalidates stale AI interpretation.
- Draft restore restores exact saved codes/reveal state; it does not redraw.

### 7. INTIMACY cabinet presentation

- Home Portal uses the approved INTIMACY artwork.
- The opened source-category header uses the shared small `♡` symbol, not a 48–52 px square artwork.
- A stale `lunea-v8-source-active` state must be removed when the source category is not actually open.
- When the Home Portal tile is the visible entry point, the duplicated source header must not also be shown.

### 8. Loader/runtime contract

The deterministic loader must make the attachment registry and Message support adapter available to the reading shell, and expose a lazy `message` feature group for the Message engine/UI. Loader changes may not reintroduce timestamp churn, document-write feature flooding, or same-build forced reload behavior.

## Release gate

A production merge/deploy is blocked unless all of the following are green on an isolated branch:

- golden product contract;
- syntax/source invariants;
- Message + attachment exact-reading tests;
- INTIMACY late-runtime exact-draft WebKit regression;
- same-session 10-reading mixed-sector WebKit regression;
- INTIMACY single-header/Home state regression.

Passing a test suite that does not assert these product contracts is not sufficient evidence of recovery.
