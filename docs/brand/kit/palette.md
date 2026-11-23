# StokvelOS — Colour palette

## Decision
Two-colour system: a deep forest green primary plus a warm amber accent. Avoids the blue-fintech cliché; green signals growth/savings and is uncommon in SA digital finance, while amber marks the payout moment (highlighted column) and gives warmth. Both survive greyscale: green reads dark, amber reads light, so the mark still separates by value.

## Primary
| Name | HEX | RGB | CMYK | Pantone (approx.) | Use |
|---|---|---|---|---|---|
| Forest Green | #1B5E20 | 27, 94, 32 | 71, 0, 66, 63 | 357 C | Logo, key UI, headings, tiles |
| Amber | #F9A825 | 249, 168, 37 | 0, 33, 85, 2 | 130 C | Accent: payout column, CTAs, highlights (sparingly) |

## Neutrals
| Name | HEX | RGB | CMYK | Use |
|---|---|---|---|---|
| Ink | #141414 | 20, 20, 20 | 0, 0, 0, 92 | One-colour logo, body type |
| Paper | #F7F7F4 | 247, 247, 244 | 0, 0, 4, 3 | Backgrounds |
| White | #FFFFFF | 255, 255, 255 | 0, 0, 0, 0 | Reversed logo, dark surfaces |

## Logo colour versions
- Full colour: green bars + arc, amber payout column.
- One-colour (green or black): all elements in one colour.
- Reversed (white): thinned geometry on dark backgrounds.
- Greyscale: works — green (dark) vs amber (light) separate by value.

## Accessibility
- Forest Green on Paper/White: contrast > 7:1 (passes WCAG AA/AAA for text).
- Amber on White: ~2.5:1 — fails for body text. Use Amber only for large UI elements, icons, or on dark/Ink backgrounds; pair with Ink text.
- Do not encode meaning in colour alone; the payout column must also be identifiable by position.

## Reproduction notes
- Pantone matches are approximations; verify against a physical guide before print.
- Saturated green/amber may shift in CMYK; use spot colour for premium print if exact match required.
- Dark mode: lighten green to #2E7D32 for on-dark UI if needed.