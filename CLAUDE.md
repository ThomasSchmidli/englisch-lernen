# Hinweise für Claude Code

- Projekt: Englisch-Lern-App für ein 8-jähriges Kind. Bedienung auf Deutsch, Inhalte auf Englisch.
- Schweizer Schreibweise: «ss» statt «ß», Schweizer Wörter (Glace, Velo, Kappe).
- Keine Frameworks, kein Build-Schritt. Reines HTML/CSS/JavaScript, damit GitHub Pages die Dateien direkt ausliefert.
- Inhalte (Themen, Wörter, Sätze) gehören in `js/data.js`, Logik in `js/app.js`.
  - Wort-Thema: `{id, kind:'words', name, icon, color, items:[W(en, de, emoji)]}` (Farben: `c`, Zahlen: `n`)
  - Satz-Thema: `{id, kind:'sentences', ..., items:[S(en, de, emoji)]}`
  - Bestehende `id`s und `en`-Texte nicht ändern: daran hängt der Spielstand.
- Spielstand-Schlüssel `englisch-lernen-v1` in localStorage nicht ändern. Bei Änderungen am Datenformat eine Übernahme der alten Daten einbauen.
- Jedes Thema braucht mindestens 6 Einträge (Memory) und Emojis, die sich im Quiz klar unterscheiden.
- Nach Änderungen: Syntax prüfen, lokal mit `python3 -m http.server` testen, dann committen und auf `main` pushen.
