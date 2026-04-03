# Runbook: miniPaint na sPanel + OLS

## 1. Wymagania
- Dostęp SSH do konta `k4`.
- Dostęp do sPanel API (lub panelu) do weryfikacji domeny/SSL.
- Node.js LTS + npm na serwerze build/deploy.

## 2. Bezpieczny układ katalogów (przykład)
- Repo: `/home/k4/apps/miniPaint/repo`
- Build: `/home/k4/apps/miniPaint/repo/dist`
- Publikacja: `<DOCROOT_PAINT_K4_PL>`

Uwaga: użyj realnego docroot tylko dla `paint.k4.pl`.

## 3. Konfiguracja Git
```bash
git clone https://github.com/kbalicki/miniPaint.git /home/k4/apps/miniPaint/repo
cd /home/k4/apps/miniPaint/repo
git remote add upstream https://github.com/viliusle/miniPaint.git
git fetch upstream
```

## 4. Build
```bash
cd /home/k4/apps/miniPaint/repo
npm ci
npm run build
```

## 5. Deploy (atomowy w praktyce)
```bash
# wymagane: podstaw realny docroot i upewnij się, że to paint.k4.pl
DOCROOT="<DOCROOT_PAINT_K4_PL>"
STAMP="$(date +%F_%H%M)"
BACKUP="${DOCROOT}_backup_${STAMP}"

[ -d "$DOCROOT" ] || { echo "Brak katalogu DOCROOT: $DOCROOT"; exit 1; }
mkdir -p "$BACKUP"
cp -a "$DOCROOT"/. "$BACKUP"/

# czyszczenie tylko docelowego docroot tej domeny
find "$DOCROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +

# publikacja plików wymaganych przez miniPaint
cp -a dist/. "$DOCROOT"/
cp -a index.html service-worker.js images manifest-disabled.json "$DOCROOT"/
```

## 6. OLS / sPanel
- Sprawdź, że vhost dla `paint.k4.pl` wskazuje na `<DOCROOT_PAINT_K4_PL>`.
- Jeśli zmieniasz reguły/konfigurację i OLS ich nie łapie automatycznie, wykonaj kontrolowany restart OLS.

## 7. Testy po wdrożeniu
- Otwórz `https://paint.k4.pl`.
- Sprawdź DevTools: brak 404 dla JS/CSS/assets.
- Sprawdź zapis obrazu (PNG/JPG) lokalnie.
- Sprawdź drag & drop pliku do edytora.

## 8. Aktualizacja z upstream
```bash
cd /home/k4/apps/miniPaint/repo
git fetch upstream
git checkout master
git merge --ff-only upstream/master || git merge upstream/master
npm ci
npm run build
# potem deploy jak w kroku 5
```

## 9. Rollback
```bash
# przywrócenie ostatniego backupu
DOCROOT="<DOCROOT_PAINT_K4_PL>"
BACKUP="<DOCROOT_PAINT_K4_PL>_backup_<TIMESTAMP>"
[ -d "$DOCROOT" ] || { echo "Brak katalogu DOCROOT: $DOCROOT"; exit 1; }
[ -d "$BACKUP" ] || { echo "Brak katalogu backup: $BACKUP"; exit 1; }
find "$DOCROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a "$BACKUP"/. "$DOCROOT"/
```

## 10. Czego NIE robić
- Nie używać poleceń `rm` poza docroot `paint.k4.pl`.
- Nie modyfikować globalnych ustawień OLS bez potrzeby.
- Nie restartować usług w ciemno bez walidacji zmian.
