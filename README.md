# Englisch lernen

Kleine Lern-App für Kinder, die mit Englisch beginnen: Wörter und einfache Sätze
mit Bildern, Sprachausgabe, Hör-Quiz, Memory, Satz bauen und Sprechübungen.
«Heute üben» mischt fällige Wiederholungen aus allen Themen (1, 2, 4, 7, 14 Tage)
mit neuen Wörtern und zählt die Tage hintereinander.

Die App lässt sich auf Tablet und Handy installieren (Safari: «Teilen» → «Zum
Home-Bildschirm») und läuft danach auch ohne Internet.

Reine statische Webseite ohne Build-Schritt: `index.html`, `css/style.css`,
`js/data.js` (Inhalte), `js/app.js` (Logik), `sw.js` (Offline) und
`manifest.webmanifest` mit den Icons in `icons/`.

## Veröffentlichen mit GitHub Pages

1. Auf GitHub ein neues Repository `englisch-lernen` anlegen.
2. Diese Dateien hochladen (oder mit Git pushen).
3. Im Repository: Settings → Pages → «Deploy from a branch» → Branch `main`, Ordner `/ (root)` → Save.
4. Nach ca. einer Minute ist die App erreichbar unter
   `https://<benutzername>.github.io/englisch-lernen/`

Jeder Push auf `main` aktualisiert die App automatisch. Die Adresse bleibt gleich,
damit bleibt auch der Spielstand auf dem Gerät erhalten.

## Lokal testen

```
python3 -m http.server 8000
```
und dann http://localhost:8000 öffnen. Die Spracherkennung braucht https oder localhost.

## Hinweise

- Prüfen: `node scripts/check.js` kontrolliert Inhalte und Offline-Dateiliste
  (läuft bei jedem Push automatisch als GitHub Action).
- Sicherung: Startseite → «Für Eltern» → als Datei speichern oder Code kopieren.

- Spielstand: wird im Browser gespeichert (localStorage, Schlüssel `englisch-lernen-v1`).
  Den Schlüssel nicht ändern, sonst beginnt der Spielstand bei null.
- Sprechübungen: Die Aufnahme wird direkt auf dem Gerät erkannt (Whisper, Transformers.js).
  Beim ersten Mal wird das Modell (ca. 41 MB) von huggingface.co geladen, danach klappt es offline.
  Im Eltern-Bereich lässt sich stattdessen Safari-Erkennung, Tastatur-Diktat oder Eltern-Check wählen.
