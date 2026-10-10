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
- Geschichten: `STORIES` in `js/data.js` (`P(en, de, emoji)` pro Seite, `Q(frage, deutsch, antworten, a)`; Antworten werden gemischt).
  Ergebnis wie ein Test unter `tests['story:id']`. `scripts/check.js` prüft Aufbau und Antworten.
- Gespräche: `DIALOGS` in `js/data.js` (`T_(say, de, answers, example, hint)`). Antworten sind Muster mit Platzhaltern
  `{name} {number} {color} {animal} {food} {weather} {any}` (`dialogMatch`/`fillSlots` in js/logic.js); was das Kind sagt,
  kann die Figur später verwenden. Jede `example` muss zu ihren `answers` passen (prüft `scripts/test.js`).
- Sticker-Album: `STICKER_PACKS` und `LEVEL_STICKERS` in `js/data.js`; Emojis nicht ändern (daran hängt der Spielstand).
- Spielstand-Schlüssel `englisch-lernen-v1` in localStorage nicht ändern. Bei Änderungen am Datenformat eine Übernahme der alten Daten in `normalize()` (js/logic.js) einbauen; das nutzt auch «Wiederherstellen».
  - Inhalt: `stars`, `known` (gelernt pro Thema), `srs` (`'themaId|en'` → `{l: Stufe 0–5, d: fällig am JJJJ-MM-TT, w: Anzahl Fehler}`),
    `streak` (`{n, last}`), `bonus` (Datum der letzten Extra-Sterne), `tests` (`'theme:id'`/`'level:n'` → `{best, last, date}`),
    `stickers` (freigeschaltete Emojis), `earned` (alle je verdienten Sterne; `stars` ist der Rest nach Sticker-Käufen),
    `speak` (`{n, ok}`: Sprechversuche und davon erkannt).
- Tests: pro Thema 10, pro Level 12 Aufgaben (hören → Bild, Bild → Wort, Deutsch → Englisch, Satz bauen, selbst sagen), ein Versuch pro Aufgabe (sagen: zwei).
  «Sag es auf Englisch» (`sayStep`) nur, wenn die App zuhören kann (`canSpeak()`); auch in «Heute üben» für Einträge ab Stufe 2.
  Geht das Mikrofon nicht, zählt die Aufgabe nicht (`onDone(null)`).
  Medaillen ab 50/75/90 %, bestanden ab 75 % (`testResult` in js/logic.js).
- Sprechen: die App hört zu mit Erkennung auf dem Gerät (Whisper über Transformers.js, `ASR_LIB`/`ASR_MODEL` in `js/app.js`), sonst Eltern-Check.
  Einzige externe Quellen: Bibliothek von cdn.jsdelivr.net (feste Version), Modell von huggingface.co; die Aufnahme bleibt auf dem Gerät.
  Geprüft wird das erwartete Wort gegen die ähnlichsten Einträge des Themas (`checkSpoken`), nicht nur die freie Erkennung.
  Safari-Spracherkennung und Tastatur-Diktat wurden bewusst entfernt (auf dem iPad meist Stille bzw. abhängig von der Tastatursprache).
  Mikrofon-Knopf überall über `attachMic()`; ohne Ziel (`target:null`) liefert die Erkennung nur den Text (Gespräche).
  Bei Sätzen zeigt `showWordFb()` pro Wort grün/rot (`wordMatch`). Geschichten haben «Lies vor». Das Modell wird 5 s nach dem Öffnen der Startseite im Hintergrund vorgeladen (`schedulePreload`).
  Die Bedienungs-Tests täuschen `hearLocal` vor: Playwright-Chromium hat auf dem Mac keine Audio-Verarbeitung, echte Aufnahmen nur am Gerät prüfen.
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
