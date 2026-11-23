# StokvelOS — Brand Guidelines (v1)

## 1. The mark
- **Symbol** (`symbol.svg`): three bold ruled ledger lines + one highlighted payout column + subtle inward cycle arc.
- **Wordmark** (`wordmark.svg`): "StokvelOS", bold sans, tight tracking. **Live `<text>` — outline before delivery.**
- **Lockups**: horizontal (`lockup-horizontal.svg`), stacked (`lockup-stacked.svg`), symbol-only, wordmark-only.

## 2. Clear space
- Clear space on all sides = height of one ledger rule (16 units on the 256 canvas; ~6% of symbol width). Nothing may enter this space.
- For the horizontal lockup, clear space = cap height of the wordmark on all sides.

## 3. Minimum sizes
- Symbol: 16 px height (use `symbol-small.svg` cut at ≤ 24 px).
- Horizontal lockup: 120 px width.
- Stacked lockup: 96 px width.
- Below these, use symbol-only.

## 4. Colour codes
See `palette.md`. Primary Forest Green #1B5E20 (RGB 27,94,32; CMYK 71,0,66,63; Pantone 357 C approx.). Accent Amber #F9A825 (RGB 249,168,37; CMYK 0,33,85,2; Pantone 130 C approx.). Neutrals Ink #141414, Paper #F7F7F4, White #FFFFFF.

## 5. Approved backgrounds
- White or Paper (mark in Forest Green or Ink).
- Ink / near-black (reversed white mark, thinned).
- Forest Green tile (mark in White).
- Avoid Amber as a background for the full mark; use Amber only for the payout column or UI accents.

## 6. Colour versions
- Full colour, one-colour (Forest Green or Ink), reversed (White), greyscale. All provided in `exports/`.

## 7. Misuse
- Do not rotate, skew, or stretch the mark.
- Do not change colours outside the palette or add gradients/shadows.
- Do not place on busy photographic backgrounds without a solid plate.
- Do not recreate or modify the wordmark in another font.
- Do not drop the payout column or cycle arc in the full-size mark (small-size cut excepted).

## 8. Handover notes
- **Rationale**: R2-B "Refined ledger" — three ruled ledger lines + highlighted payout column + subtle inward cycle arc. Avoids blue-fintech cliché; reads as savings ledger; works at 16 px, one colour, reversed.
- **Test results**: `svg_audit.py` 100/100 on `symbol.svg`, `symbol-small.svg`, `symbol-reversed.svg`; rendered via rsvg-convert; small-size cut drops the cycle arc and thickens rules; reversed geometry thinned ~12%.
- **Open items**: (1) outline wordmark text to paths in a vector editor; (2) confirm font licence for logo use (Inter assumed); (3) professional trademark + reverse-image search before filing; (4) verify Pantone matches against physical guide before print.

## 9. Final artwork checklist (process.md §7)
- [x] No stray anchors in expanded shapes.
- [x] Angles accurate on outer silhouette.
- [ ] Wordmark outlined (pending — live `<text>` flagged).
- [x] Strokes expanded to fills (symbol bars and cycle arc expanded; reversed expanded).
- [x] Shapes merged into single paths where needed (bars as rects).
- [x] Artboard/viewBox tight with consistent padding; mark centred.
- [x] Colours exact brand values; one-colour and reversed versions provided.
- [x] File set matches deliverables (symbol, small, reversed, colour, wordmark, lockups, exports, presentation).
- [x] Versions named clearly.

Related: [[Home]]