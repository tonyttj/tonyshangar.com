# tonyshangar.com

Portfolio of Tony Jürgens, mechanical engineering student at TU Eindhoven (electric aviation,
experimental aerodynamics). Hosted on GitHub Pages; the custom domain is set by `CNAME`.

Hand-built static site with no build step: plain HTML, one stylesheet, one small script.

- `index.html`: the page (intro, index, four case studies, in brief, about, contact)
- `styles.css`: the design system (tokens, 12-column grid with named lines, figure/spec components)
- `script.js`: progressive enhancement (reveal, hand-drawn marks, header, index preview, clock)
- `fonts/`: Newsreader, Instrument Sans and IBM Plex Mono, subsetted WOFF (SIL OFL, see licence file)
- `assets/`: photos (metadata stripped; `name.jpg` large + `name-800.jpg` small) and the share card
- `404.html`: page-not-found

Adding a photo: `python3 ~/CV/tools/web_image.py SOURCE NAME` writes both sizes into `assets/`
and prints a `<figure>` snippet to paste into a case study.

Preview locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
