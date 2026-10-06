# Plainkit

Free tools that run in the browser: no sign-up, no cookies, no tracking. English and Japanese.

Live: https://tools.motty.jp/

## Adding a tool

1. Create `src/tools/<slug>/` with:
   - `meta.json`: `order`, `category` (`time` / `media` / `text`), optional `assets` and `scripts`, and `en` / `ja` copy (`name`, `title`, `description`, `h1`, `lede`, `card`, `steps`, `sections`, `faq`).
   - `tool.html`: the interactive markup, or `render.mjs` exporting `default (lang) => html` for content rendered at build time.
   - `tool.css`: page styles (optional; shared tokens and components are in `src/base.css`).
   - `app.js`: the script. Read the language from `document.documentElement.lang`.
2. Run `node build.mjs` and open `dist/` with any static server, e.g. `python3 -m http.server -d dist`.
3. Commit to `main`, then run `./deploy.sh` to build and publish to the `gh-pages` branch.

To deploy automatically on every push instead, run `gh auth refresh -s workflow`, move `ci/pages.yml` to `.github/workflows/pages.yml`, and set Settings → Pages → Source to GitHub Actions.

Each tool gets `/<slug>/` (English) and `/ja/<slug>/` (Japanese) with canonical, hreflang, Open Graph and JSON-LD, and is added to `sitemap.xml`, the home page and the footer automatically.

## Custom domain

Set `"domain"` in `site.config.json` (e.g. `"tools.example.com"`). The build writes `CNAME` and switches canonical URLs and the sitemap to that domain. Then add the domain under Settings → Pages.

## Credits

- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT) by Kazuhiko Arase. QR Code is a registered trademark of DENSO WAVE INCORPORATED.
- [JSZip](https://github.com/Stuk/jszip) (MIT).
