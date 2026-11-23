# Treningslogg – 80/20-løping

- `index.html` – selve appen (mobil). Leser `data.js`.
- `data.js` – alt fast innhold: løpeøkter, planer og teori.
- `bygg.mjs` – lager `del/` fra `data.js`. Kjør `node bygg.mjs` hver gang innholdet i `data.js` endres.
- `del/` – ferdige, delbare sider (ren HTML uten JavaScript) som KI-verktøy kan lese. Start på `del/index.html`, eller `del/alt.html` for alt på én side.

Publiser hele mappen (inkludert `del/`) på GitHub Pages. Knappene «Kopier lenke» i appen peker til `del/`-sidene på samme adresse som appen.
