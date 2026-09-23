# LUNEA Meihua V1 QA

## Scope
- Traditional year/month/day/hour casting using lunar date and earthly-branch numbers.
- Deterministic engine produces primary, mutual, changed hexagrams, moving line, body/use and five-element relations.
- UI renders calculation evidence before AI interpretation.
- AI may interpret but must not recalculate or invent hexagrams, moving lines, body/use relationships or unsupported timing dates.
- Archive stores the exact question plus the complete deterministic calculation payload.

## Mobile acceptance
- Home: Lenormand + Thai remain paired; Meihua is full-width immediately before Intimacy.
- Meihua modal fits a 390×844 WebKit viewport and scrolls vertically.
- One moving line is visibly marked in the primary hexagram.
- Primary / Mutual / Changed panels remain visible without horizontal page drift.
- Save writes a dedicated `meihua.version = 1` archive record.

## Automated checks
- `tests/meihua-engine-v1.test.mjs`
- `tests/meihua-v1.e2e.mjs`
- `.github/workflows/meihua-v1-branch-test.yml`

Main merge and GitHub Pages production deployment are intentionally outside this branch QA step.
