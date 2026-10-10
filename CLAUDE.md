# Hinweise für Claude Code

- Projekt: Englisch-Lern-App für ein 8-jähriges Kind. Bedienung auf Deutsch, Inhalte auf Englisch.
- Schweizer Schreibweise: «ss» statt «ß», Schweizer Wörter (Glace, Velo, Kappe).
- Keine Frameworks, kein Build-Schritt. Reines HTML/CSS/JavaScript, damit GitHub Pages die Dateien direkt ausliefert.
- Dateien:
  - `js/data.js`: Inhalte (Levels, Themen, Wörter, Sätze)
  - `js/logic.js`: reine Logik ohne Anzeige (Datum, Spielstand-Format, Wiederholung, Serie, Sprachvergleich, Test-Auswertung) – wird von `scripts/test.js` geprüft
  - `js/app.js`: Anzeige und Ablauf (Spiele, Tests, Sprechen, Eltern-Bereich)
- Inhalte:
  - Levels: `LEVELS=[{n, icon, name, sub}]`, jedes Thema hat `level`
  - Wort-Thema: `{id, level, kind:'words', name, icon, color, items:[W(en, de, emoji)]}` (Farben: `c`, Zahlen: `n`, kurzer Text wie «Mo»: `t`)
  - Satz-Thema: `{id, level, kind:'sentences', ..., items:[S(en, de, emoji)]}`
  - Bestehende `id`s und `en`-Texte nicht ändern: daran hängt der Spielstand.
  - Jedes Thema braucht mindestens 6 Einträge (Memory) und Bilder, die sich im Quiz klar unterscheiden.
- Sticker-Album: `STICKER_PACKS` und `LEVEL_STICKERS` in `js/data.js`; Emojis nicht ändern (daran hängt der Spielstand).
- Spielstand-Schlüssel `englisch-lernen-v1` in localStorage nicht ändern. Bei Änderungen am Datenformat eine Übernahme der alten Daten in `normalize()` (js/logic.js) einbauen; das nutzt auch «Wiederherstellen».
  - Inhalt: `stars`, `known` (gelernt pro Thema), `srs` (`'themaId|en'` → `{l: Stufe 0–5, d: fällig am JJJJ-MM-TT, w: Anzahl Fehler}`),
    `streak` (`{n, last}`), `bonus` (Datum der letzten Extra-Sterne), `tests` (`'theme:id'`/`'level:n'` → `{best, last, date}`),
    `stickers` (freigeschaltete Emojis), `earned` (alle je verdienten Sterne; `stars` ist der Rest nach Sticker-Käufen).
- Tests: pro Thema 10, pro Level 12 Aufgaben (hören → Bild, Bild → Wort, Deutsch → Englisch, Satz bauen), ein Versuch pro Aufgabe.
  Medaillen ab 50/75/90 %, bestanden ab 75 % (`testResult` in js/logic.js).
- Sprechen: die App hört zu mit Erkennung auf dem Gerät (Whisper über Transformers.js, `ASR_LIB`/`ASR_MODEL` in `js/app.js`), sonst Eltern-Check.
  Einzige externe Quellen: Bibliothek von cdn.jsdelivr.net (feste Version), Modell von huggingface.co; die Aufnahme bleibt auf dem Gerät.
  Geprüft wird das erwartete Wort gegen die ähnlichsten Einträge des Themas (`checkSpoken`), nicht nur die freie Erkennung.
  Safari-Spracherkennung und Tastatur-Diktat wurden bewusst entfernt (auf dem iPad meist Stille bzw. abhängig von der Tastatursprache).
- Schrift «Baloo 2» liegt in `fonts/` (keine weiteren externen Quellen wie Google Fonts einbinden).
- Offline: `sw.js` lädt eigene Dateien zuerst aus dem Netz. Neue Dateien in `FILES` eintragen und bei Änderungen an `sw.js` die Version in `CACHE` erhöhen.
- Bei jeder Veröffentlichung `VERSION` in `js/app.js` erhöhen (unten auf der Startseite sichtbar, so sieht man, ob ein Gerät aktuell ist).
- Tests (laufen alle auch als GitHub Action):
  - `node scripts/check.js`: Inhalte und Offline-Dateiliste
  - `node scripts/test.js`: Logik aus `js/logic.js`
  - `npx playwright test`: Bedienung (`tests/app.spec.js`), schlägt bei jedem JavaScript-Fehler auf der Seite fehl.
    Einmalig vorher: `npm install` und `npx playwright install chromium`. Pakete nur für Tests, die App selbst braucht keine.
- Lokal ansehen: `node scripts/serve.js` und http://localhost:8000 öffnen.
- Nach Änderungen: alle Tests laufen lassen, dann committen und auf `main` pushen.
