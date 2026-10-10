# Hinweise für Claude Code

- Projekt: Englisch-Lern-App für ein 8-jähriges Kind. Bedienung auf Deutsch, Inhalte auf Englisch.
- Schweizer Schreibweise: «ss» statt «ß», Schweizer Wörter (Glace, Velo, Kappe).
- Keine Frameworks, kein Build-Schritt. Reines HTML/CSS/JavaScript, damit GitHub Pages die Dateien direkt ausliefert.
- Inhalte (Themen, Wörter, Sätze) gehören in `js/data.js`, Logik in `js/app.js`.
  - Wort-Thema: `{id, kind:'words', name, icon, color, items:[W(en, de, emoji)]}` (Farben: `c`, Zahlen: `n`, kurzer Text wie «Mo»: `t`)
  - Satz-Thema: `{id, kind:'sentences', ..., items:[S(en, de, emoji)]}`
  - Bestehende `id`s und `en`-Texte nicht ändern: daran hängt der Spielstand.
- Spielstand-Schlüssel `englisch-lernen-v1` in localStorage nicht ändern. Bei Änderungen am Datenformat eine Übernahme der alten Daten einbauen.
  - Inhalt: `stars`, `known` (gelernt pro Thema), `srs` (`'themaId|en'` → `{l: Stufe 0–5, d: fällig am JJJJ-MM-TT}`), `streak` (`{n, last}`), `bonus` (Datum der letzten Extra-Sterne).
- Bei jeder Veröffentlichung `VERSION` in `js/app.js` erhöhen (unten auf der Startseite sichtbar, so sieht man, ob ein Gerät aktuell ist).
- Offline: `sw.js` lädt eigene Dateien zuerst aus dem Netz. Neue Dateien in `FILES` eintragen und bei Änderungen an `sw.js` die Version in `CACHE` erhöhen.
- Jedes Thema braucht mindestens 6 Einträge (Memory) und Emojis, die sich im Quiz klar unterscheiden.
- Schrift «Baloo 2» liegt in `fonts/` (keine externen Quellen wie Google Fonts einbinden).
- Sprechen: Standard ist die Erkennung auf dem Gerät (Whisper über Transformers.js, `ASR_LIB`/`ASR_MODEL` in `js/app.js`).
  Einzige externe Quellen: Bibliothek von cdn.jsdelivr.net (feste Version), Modell von huggingface.co; die Aufnahme bleibt auf dem Gerät.
  Geprüft wird das erwartete Wort gegen die ähnlichsten Einträge des Themas (`checkSpoken`), nicht nur die freie Erkennung.
  Die Safari-Spracherkennung liefert auf iPhone/iPad oft nur Stille und bleibt nur als Auswahl im Eltern-Bereich.
- Für Eltern (Sichern/Wiederherstellen) nutzt `normalize()`: neue Felder dort mit Standardwert ergänzen.
- Nach Änderungen: `node scripts/check.js` (läuft auch als GitHub Action), lokal mit `python3 -m http.server` testen, dann committen und auf `main` pushen.
