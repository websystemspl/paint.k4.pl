# Plan wdrożenia miniPaint na paint.k4.pl

## Cel
Uruchomić miniPaint na subdomenie `paint.k4.pl` na serwerze z `sPanel + OpenLiteSpeed (OLS)` w sposób odizolowany od innych domen i mikroserwisów na koncie `k4`.

## Założenia bezpieczeństwa
- Zmieniamy wyłącznie konfigurację i pliki dotyczące `paint.k4.pl`.
- Nie dotykamy vhostów, docrootów ani konfiguracji innych domen.
- Każdy restart OLS tylko po walidacji konfiguracji dla tej jednej domeny.
- Wdrożenie idzie przez osobny katalog projektu i osobny katalog publikacji.

## Architektura wdrożenia
- Aplikacja: frontend statyczny (brak backendu, brak bazy danych).
- Źródło: fork repo `viliusle/miniPaint`.
- Build: `npm ci && npm run build` (wynik w `dist/`).
- Publikacja: synchronizacja `dist/` + plików statycznych wymaganych przez app do docroot `paint.k4.pl`.

## Fazy
1. Inwentaryzacja
- Potwierdzenie vhost/docroot dla `paint.k4.pl`.
- Potwierdzenie DNS i SSL.

2. Repozytorium
- Utworzenie forka `kbalicki/miniPaint`.
- Ustawienie `upstream` na `viliusle/miniPaint`.
- Utworzenie gałęzi deployowej (np. `deploy/paint-k4-pl`).

3. Build i publikacja
- Instalacja zależności Node LTS.
- Budowa aplikacji.
- Wdrożenie do docroot `paint.k4.pl` bez modyfikacji innych vhostów.

4. Konfiguracja OLS
- Weryfikacja mapowania domeny -> docroot.
- Dodatkowe nagłówki bezpieczeństwa i cache tylko dla vhosta `paint.k4.pl`.
- Restart OLS (jeśli potrzebny do przeładowania zmian).

5. Testy i odbiór
- Testy: HTTP->HTTPS, ładowanie UI, zapisywanie lokalne pliku, drag&drop.
- Smoke test po restarcie OLS.

6. Utrzymanie
- Procedura aktualizacji z `upstream`.
- Cofnięcie do poprzedniej wersji (rollback) przez backup poprzedniego `dist`.

## Kryteria odbioru
- `https://paint.k4.pl` działa i ładuje miniPaint.
- Brak regresji na innych domenach konta `k4`.
- SSL poprawny i odnowienie certyfikatu aktywne.
- Udokumentowany proces update i rollback.

## Ryzyka i mitygacja
- Ryzyko: restart OLS wpływa na wiele vhostów.
  - Mitygacja: restart tylko po walidacji, w oknie niskiego ruchu, szybki smoke-check kluczowych hostów.
- Ryzyko: niekompletny deploy plików statycznych.
  - Mitygacja: wdrożenie z checklistą plików i test end-to-end.
- Ryzyko: konflikt uprawnień katalogów.
  - Mitygacja: dedykowany katalog i jawne owner/group dla `k4`.

## Co jest potrzebne od właściciela środowiska
- Potwierdzenie docroot `paint.k4.pl`.
- Potwierdzenie czy cert SSL jest już podpięty.
- Potwierdzenie okna serwisowego na ewentualny restart OLS.
