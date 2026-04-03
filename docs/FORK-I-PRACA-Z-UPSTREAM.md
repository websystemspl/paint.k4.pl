# Fork i synchronizacja z upstream

## Status
- Lokalna kopia `viliusle/miniPaint` została pobrana do katalogu projektu.
- Nie znaleziono istniejącego repozytorium `kbalicki/miniPaint` na GitHub.

## Założony docelowy model
- `origin`: `https://github.com/kbalicki/miniPaint.git` (Twój fork)
- `upstream`: `https://github.com/viliusle/miniPaint.git` (oryginał)

## Kroki utworzenia forka (jednorazowo)
1. Wejdź na: `https://github.com/viliusle/miniPaint`
2. Kliknij `Fork` i wybierz konto `kbalicki`.
3. Potwierdź utworzenie `kbalicki/miniPaint`.

## Podpięcie fork-a lokalnie
```bash
cd /home/krzysztof-balicki/Nextcloud/Prace\ bieżące/paint.k4.pl/miniPaint
git remote rename origin upstream
git remote add origin https://github.com/kbalicki/miniPaint.git
git fetch --all
git push -u origin master
```

## Dalsza praca
- Nowe zmiany robocze: branch od `master`.
- Aktualizacje od autora projektu: `git fetch upstream` + merge/rebase do `master`.
