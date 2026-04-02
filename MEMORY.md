# Project Memory

## Deployment
- Production domain: `https://paint.k4.pl`
- Server path: `/home/k4/paint.k4.pl`
- Main compiled asset: `/home/k4/paint.k4.pl/dist/bundle.js`
- Backend optimizer endpoint: `/home/k4/paint.k4.pl/api/optimize.php`

## Git Remotes
- `origin`: `https://github.com/websystemspl/paint.k4.pl.git`
- `upstream`: `https://github.com/viliusle/miniPaint.git`

## Commit Author Policy
- Always commit/push as:
  - `user.name = kbalicki`
  - `user.email = 45691722+kbalicki@users.noreply.github.com`

## Branding Rules
- Logo source: `images/logo-k4.svg`.
- Header logo must not use color-inverting CSS filters.
- Target logo style should match `k4.pl` exactly:
  - main mark pink `#ff497c`
  - accent square green `#a0ce4e`
  - `pl` in white
- Share metadata branding:
  - `<title>`: `paint.k4.pl - edytor grafiki online`
  - `og:title`: `paint.k4.pl - edytor grafiki online`
  - `twitter:title`: `paint.k4.pl - edytor grafiki online`
  - `og:url`: `https://paint.k4.pl/`
  - `og:site_name`: `paint.k4.pl`

## Language
- Default UI language: `pl`.
- English (`en`) must remain available.
- Polish dictionary file: `src/js/languages/pl.json` (511 keys).

## Export Features
- Presets:
  - JPG quality default: `80`
  - WEBP quality default: `75`
  - Max dimension default: `2560`
- Added lossless mode for PNG/WEBP with backend optimizer endpoint and frontend timeout fallback.
