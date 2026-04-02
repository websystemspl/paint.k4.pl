# paint.k4.pl

To jest nasz fork projektu **miniPaint** utrzymywany w repozytorium:
- https://github.com/websystemspl/paint.k4.pl

Projekt źródłowy (upstream):
- https://github.com/viliusle/miniPaint

## O projekcie
`paint.k4.pl` to wdrożenie edytora grafiki działającego w przeglądarce, opartego o miniPaint.

## Produkcja
- URL: `https://paint.k4.pl`

## Rozwój i aktualizacje
- `origin`: nasz fork (`websystemspl/paint.k4.pl`)
- `upstream`: oryginalny miniPaint (`viliusle/miniPaint`)

Przykładowa aktualizacja z upstream:
```bash
git fetch upstream
git checkout master
git merge upstream/master
```

## Branding
Fork zawiera własny branding (np. logo) dostosowany do naszego wdrożenia.
- Logo jest odwzorowane zgodnie z `k4.pl`:
  - główny znak: `#ff497c`
  - akcent kwadratowy: `#a0ce4e`
  - `pl`: biały
- Uwaga techniczna: logo w nagłówku nie może mieć filtra odwracającego kolory.

## Język
- Domyślny język interfejsu: `pl` (polski).
- Zachowany język `en` (angielski) jako opcja przełączania.
- Słownik: `src/js/languages/pl.json`.

## Eksport
- Presety eksportu:
  - JPG: jakość domyślna `80`
  - WEBP: jakość domyślna `75`
  - Max dimension: domyślnie `2560 px`
- Dostępny tryb `Lossless mode` dla PNG/WEBP.
- Dodany endpoint backendowy optymalizacji: `/api/optimize.php` (z fallbackiem po stronie frontu).

## Licencja
Projekt bazowy miniPaint jest na licencji MIT.
Plik licencji znajduje się w repo: `MIT-LICENSE.txt`.
