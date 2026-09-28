# LUNEA Meihua V1 calculation standard

LUNEA V1 uses one deterministic default method so the same question time always reproduces the same result.

## Default method

Traditional year-month-day-hour casting:

- upper trigram = year-branch number + lunar month + lunar day, modulo 8
- lower trigram = year-branch number + lunar month + lunar day + hour-branch number, modulo 8
- moving line = the same total, modulo 6
- trigram remainder 0 becomes 8
- moving-line remainder 0 becomes 6

### Trigram numbering

1 乾, 2 兌, 3 離, 4 震, 5 巽, 6 坎, 7 艮, 8 坤

### Earthly-branch numbering

子1 丑2 寅3 卯4 辰5 巳6 午7 未8 申9 酉10 戌11 亥12

## Derived structures

- 本卦: upper/lower trigrams from the arithmetic above
- 動爻: one moving line from 1 to 6
- 互卦: lines 2-3-4 form the lower nuclear trigram; lines 3-4-5 form the upper nuclear trigram
- 變卦: flip only the moving line
- 體/用: the trigram containing the moving line is 用; the opposite trigram is 體

## Five-element relationship

- 乾, 兌 = Metal
- 離 = Fire
- 震, 巽 = Wood
- 坎 = Water
- 艮, 坤 = Earth

The engine reports 比和, 體生用, 用生體, 體克用, or 用克體 for both the original 用 and the changed 用.

## Calendar provenance

V1 converts the question instant with the browser's ICU/Intl Chinese lunisolar calendar in the selected timezone.

Locked V1 choices:

- day boundary: civil midnight 00:00
- hour branch: 子 covers 23:00-00:59, then two-hour branches
- leap month: use the same numeric month as its regular month
- year branch: derived from the lunisolar related year

The result object stores the timezone, local clock, lunar components, branch values, arithmetic and rules so every result is auditable.

## Interpretation boundary

The calculation engine owns all arithmetic and hexagram derivation. AI may explain the locked evidence, but must not recalculate, replace, redraw or invent a different hexagram.
