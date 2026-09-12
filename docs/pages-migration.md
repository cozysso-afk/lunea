# GitHub Pages migration audit

Source baseline: `77a4ad842a5a98209ae59fb4e37d055552daf56c` on `verify-662f40e-iphone`.
Test host: https://cozysso-afk.github.io/lunea/

## Runtime compatibility

The Pages builder follows the current index and literal JS/asset/JSON references recursively. It also copies the root image collection and `assets/` for dynamic card-code paths. It never rewrites index, script order or cache tokens and never invokes the historical Netlify builder. Infrastructure, tests, build scripts, generated outputs and historical `lunea-build.json` are excluded. `.nojekyll` is generated.

| Runtime-sensitive reference | Active status / treatment |
| --- | --- |
| `/__lunea_api`, `/.netlify/functions` | Zero in the current index/loader dependency closure. No proxy required. |
| `lunea-netlify-astro-route-v57.js` | Inactive; not published. Historical proxy rewrite. |
| `lunea-runtime-state-v55.js`, `lunea-astro-warm-v53.js`, Profile V44 | Inactive; current owners use V56/Profile V45. Historical same-origin proxy assumptions are not reintroduced. |
| `scripts/build-netlify-static.cjs` | Not used; historical script injection remains isolated. |
| Render origins | Existing official `lunea-astro-api-v2.onrender.com` and `lunea-astro-api.onrender.com`; current failover wrapper retained. Natal default remains existing Render client. |
| `vercel.app`, `netlify.app` | No dependency in active runtime closure. Hosting configurations preserved in repository. |
| Root-relative `src`, `href`, `fetch`, `new URL` | No runtime root-path dependency found. Local published references resolve within `/lunea/`. |
| Dynamic script URLs / `document.baseURI` | Current relative loader URLs preserved. No `<base href="/">`. |
| RWS images | Existing external Wikimedia resolver, not duplicated. External availability still required. |
| Timing / INTIMACY / Message | 60 canonical Timing PNGs, 36 INTIMACY faces and five approved Message images/masks included. Root fallback art also included. |
| Geographic data | Existing external raw GitHub/jsDelivr source retained. |
| `location.origin` | Migration export provenance only; not an API route. |
| `location.pathname` | Existing password recovery builds redirect from origin + pathname and clears auth URL fragments. Compatible with project subpath when allowed by Supabase. |
| Service workers | Current cache-refresh owner is a no-op; no registration in runtime closure, no new worker. |
| Manifest | Existing relative `start_url: ./`, `scope: ./`, relative icons preserved. No offline functionality added. |

On 2026-09-12, direct HTTP checks with `Origin: https://cozysso-afk.github.io` returned:
- Render V2 `GET /health`: 200, `Access-Control-Allow-Origin: https://cozysso-afk.github.io`.
- Render V2 `OPTIONS /v1/natal`, requesting POST + content-type: 200, allowed GET/POST/OPTIONS and content-type.
- Health advertises Transit scan, Returns, Horary, Thai and 90-day Thai range support. Existing route strings remain unchanged.

These are HTTP CORS evidence, **not** proof of actual Pages browser calculations. No calculation or paid AI call was made. Browser connection timed out at tab discovery; mobile/function/login acceptance is still pending.

## Persistence inventory

`lunea-host-migration-v1.js` contains the explicit export allowlist. Nothing enumerates or exports unrelated origin data.

| Data | Existing portability | Transfer handling |
| --- | --- | --- |
| `LUNEA_ARCHIVE`, V2/V3, V43 backup; legacy reading journal | Journal's existing JSON handles journal entries only | Included, array merge preserves destination-only records; matching IDs prefer import |
| IndexedDB `LUNEA_READING_DB` / `journal` | Existing Journal JSON export/import | Raw records preserved without `clean()` projection; same IDs replaced, other records retained |
| `LUNEA_LAST_READING_DRAFT_V1` | Host-local | Whole bounded existing snapshot including attachments and `timingSupport`; no recalculation |
| Manual library/draft; spread memory legacy/V7/V72/V8 | Host-local | Included |
| `LUNEA_SPREAD_CORRECTION_MEMORY_V1` | Local; optional cloud merge of manual/correction records | Included; cloud semantics unchanged |
| `LUNEA_SPREAD_USAGE_MEMORY_V1` | Local accepted-AI usage | Included independently, including use counts |
| Profile, birth date/time/place/coordinates/region/district, Natal V3, settings/tab | Host-local | Included, saved calculation retained |
| Message LAST/SAVED; Message support | Host-local | Included; support stays in exact-reading draft/archive evidence |
| Timing Oracle/history/AB history, Daily Timing/Orbit | Host-local | Included; old-host local artwork URLs in image fields become relative URLs |
| INTIMACY mode/ack/draft | Host-local | Included |
| Saved Horary/place, Transit scan, Thai standalone LAST | Host-local | Included; no API call on transfer |
| `LUNEA_MODEL` | Non-secret preference | Included |
| `LUNEA_API_KEY`, Supabase session, sb-* auth, passwords/tokens | Secret/session | Excluded; sign in or re-enter on destination |
| `LUNEA_ASTRO_API_URL` | Host-specific endpoint, may contain credentials | Excluded; new host retains existing official Render defaults |
| `LUNEA_ASTRO_PENDING_V23`, long-run checkpoint | In-progress request state | Excluded to avoid resuming old work during migration |
| Gemini model catalog / Daily migration marker | Derived cache / old migration diagnostic | Not transferred; not user evidence |

There is only one IndexedDB database/store in the current source. Session credentials are never exported. Credential-shaped nested fields and known credentials copied into notes fail export closed. Backups still contain private questions and birth data and must be kept private. No actual user storage was read or changed by development/tests.

## Transfer procedure

1. Keep the old Vercel site available. On that same origin, open Journal → **사이트 이전 백업**. The older **JSON 백업** remains journal-only.
2. Save the downloaded file. Do not delete old-origin data.
3. On Pages, open Journal → **사이트 이전 복원**. This navigates to a small isolated transfer page without reading autosave, Timing storage interception or calculation owners. Close other tabs of the destination app before import.
4. Choose the backup. The tool first downloads a destination safety backup; confirm only after it is saved. Import merges array histories, replaces same-ID records and supplied scalar snapshots, and never clears entire storage/stores. Destination-only keys/records and credentials remain.
5. Return Home after successful import. Check draft restore, attachments, Journal and learning count. Re-enter the API key and sign in separately when needed. Do not generate new readings to recover old evidence.

Validation happens before writes. IndexedDB writes are transactional; localStorage values are rolled back if DB aborts or quota fails. The two browser storage systems cannot be crash-atomic across process termination; keep both downloaded backups until user verification. Never import while another destination tab is actively saving. Tests use synthetic records and deterministic DB I/O doubles; actual browser import remains pending.

## Hosting / auth setup and rollback

Workflow: `.github/workflows/deploy-pages.yml`, only `verify-662f40e-iphone`, dispatch or branch push. Build uploads the artifact, deploy uses official configure/deploy Pages Actions with pages:write and id-token:write. No main merge. Workflow environment protection must allow this source branch.

If Pages is not configured for Actions: **Settings → Pages → Build and deployment → Source → GitHub Actions**. The connected GitHub tool rejects the Pages configuration endpoint, so no setting change is claimed.

Supabase: **Authentication → URL Configuration → Redirect URLs → add `https://cozysso-afk.github.io/lunea/`**. Existing recovery helper already derives this canonical redirect. Default signup confirmations still use the existing Site URL; leave it unchanged while Vercel remains rollback. A permanent signup Site URL switch requires a later approved cutover. No credentials/session were available for a login test; login/recovery are not marked PASS.

Vercel project, Git integration, `vercel.json`, Netlify files and Render remain untouched. Pages is a parallel test host. GitHub Pages may cache HTML for ten minutes; current explicit loader tokens remain authoritative, with no timestamp cache busting or destructive cache refresh.

Before final cutover, verify actual Pages Home, sectors, Tarot, Message standalone/support, Timing, Thai, Horary, Transit/Returns, Journal, imported data and login at 390/402/430. Actions success alone is not acceptance.
