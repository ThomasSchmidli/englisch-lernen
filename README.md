# Englisch lernen

Kleine Lern-App für Kinder, die mit Englisch beginnen: Wörter und einfache Sätze
mit Bildern, Sprachausgabe, Hör-Quiz, Memory, Satz bauen und Sprechübungen.

Reine statische Webseite ohne Build-Schritt: `index.html`, `css/style.css`,
`js/data.js` (Inhalte) und `js/app.js` (Logik).

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

- Spielstand: wird im Browser gespeichert (localStorage, Schlüssel `englisch-lernen-v1`).
  Den Schlüssel nicht ändern, sonst beginnt der Spielstand bei null.
- Sprechübungen: nutzen die Spracherkennung des Browsers (Safari: Diktierfunktion muss
  aktiv sein). Ohne Mikrofon schaltet die App auf den Eltern-Check um.
