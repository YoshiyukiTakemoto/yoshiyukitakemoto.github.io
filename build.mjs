// Static site builder for Plainkit. No dependencies: `node build.mjs` writes everything to dist/.
// Each tool lives in src/tools/<slug>/ with:
//   meta.json   order, category, assets[], and per-language copy (en/ja)
//   tool.html   the interactive markup (or render.mjs exporting default (lang) => html)
//   tool.css    page-specific styles (optional)
//   app.js      the tool's script; reads the page language from <html lang>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "dist");
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
const LANGS = ["en", "ja"];
const BASE = (cfg.domain ? `https://${cfg.domain}` : cfg.baseUrl).replace(/\/$/, "");
const today = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const url = (lang, slug = "") => (lang === "en" ? "/" : `/${lang}/`) + (slug ? `${slug}/` : "");
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
const write = (rel, data) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };

const LOGO = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="9" height="9" rx="2" fill="var(--accent)"/><rect x="13" y="2" width="9" height="9" rx="2" fill="var(--line)"/><rect x="2" y="13" width="9" height="9" rx="2" fill="var(--line)"/><rect x="13" y="13" width="9" height="9" rx="4.5" fill="var(--accent)"/></svg>`;
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="2" width="9" height="9" rx="2" fill="#2440c4"/><rect x="13" y="2" width="9" height="9" rx="2" fill="#cfd8ec"/><rect x="2" y="13" width="9" height="9" rx="2" fill="#cfd8ec"/><rect x="13" y="13" width="9" height="9" rx="4.5" fill="#2440c4"/></svg>`;
const FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=IBM+Plex+Sans+JP:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";

// ---- load tools ----
const tools = [];
for (const slug of fs.readdirSync(path.join(SRC, "tools"))) {
  const dir = path.join(SRC, "tools", slug);
  if (!fs.statSync(dir).isDirectory()) continue;
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
  const read = (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), "utf8") : "");
  let render;
  if (fs.existsSync(path.join(dir, "render.mjs"))) render = (await import(pathToFileURL(path.join(dir, "render.mjs")))).default;
  else { const html = read("tool.html"); render = () => html; }
  tools.push({ slug, dir, meta, render, css: read("tool.css") });
}
tools.sort((a, b) => a.meta.order - b.meta.order);

// ---- page chrome ----
function page({ lang, slug = "", title, desc, main, css = "", scripts = [], schema = [], noindex = false }) {
  const ui = cfg.ui[lang];
  const other = lang === "en" ? "ja" : "en";
  const alt = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${BASE}${url(l, slug)}">`).join("\n") +
    `\n<link rel="alternate" hreflang="x-default" href="${BASE}${url("en", slug)}">`;
  const footList = tools.map((t) => `<li><a href="${url(lang, t.slug)}">${esc(t.meta[lang].name)}</a></li>`).join("");
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${BASE}${url(lang, slug)}">\n${alt}`}
<meta property="og:site_name" content="${esc(cfg.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${BASE}${url(lang, slug)}">
<meta property="og:locale" content="${lang === "ja" ? "ja_JP" : "en_US"}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#2440c4">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="${url(lang)}manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/assets/base.css">
${css ? `<style>\n${css}\n</style>` : ""}
${schema.map(ld).join("\n")}
</head>
<body${slug ? ` data-slug="${slug}"` : ""}>
<header class="bar"><div class="bar-in">
  <a class="brand" href="${url(lang)}">${LOGO}${esc(cfg.name)}</a>
  <nav><a href="${url(lang)}#tools">${ui.allTools}</a><a class="lang" href="${url(other, slug)}" hreflang="${other}" lang="${other}">${cfg.ui[other].langName}</a></nav>
</div></header>
${main}
<footer class="foot"><div class="foot-in">
  <ul>${footList}</ul>
  <p style="margin:0">${esc(ui.foot)} <a href="${cfg.repo}">${ui.source}</a></p>
  <p style="margin:0">© ${new Date().getFullYear()} ${esc(cfg.name)}</p>
</div></footer>
${["/assets/site.js", ...scripts].map((s) => `<script src="${s}" defer></script>`).join("\n")}
</body>
</html>
`;
}

const cards = (lang, list) => `<ul class="cards">${list.map((t) => `<li><a href="${url(lang, t.slug)}"><strong>${esc(t.meta[lang].name)}</strong><span>${esc(t.meta[lang].card)}</span></a></li>`).join("")}</ul>`;

function related(t) {
  const same = tools.filter((x) => x !== t && x.meta.category === t.meta.category);
  const rest = tools.filter((x) => x !== t && x.meta.category !== t.meta.category);
  return same.concat(rest).slice(0, 6);
}

// ---- build ----
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
write("assets/base.css", fs.readFileSync(path.join(SRC, "base.css")));
write("assets/site.js", fs.readFileSync(path.join(SRC, "site.js")));
write("assets/minipdf.js", fs.readFileSync(path.join(SRC, "minipdf.js")));
for (const f of fs.readdirSync(path.join(SRC, "static"))) write(f, fs.readFileSync(path.join(SRC, "static", f)));
write("favicon.svg", FAVICON);
write(".nojekyll", "");
if (cfg.domain) write("CNAME", cfg.domain + "\n");

const sitemap = [];
const addUrl = (slug) => sitemap.push(`<url><loc>${BASE}${url("en", slug)}</loc><lastmod>${today}</lastmod>${LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${BASE}${url(l, slug)}"/>`).join("")}<xhtml:link rel="alternate" hreflang="x-default" href="${BASE}${url("en", slug)}"/></url>`,
  `<url><loc>${BASE}${url("ja", slug)}</loc><lastmod>${today}</lastmod>${LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${BASE}${url(l, slug)}"/>`).join("")}<xhtml:link rel="alternate" hreflang="x-default" href="${BASE}${url("en", slug)}"/></url>`);

for (const t of tools) {
  for (const f of ["app.js", ...(t.meta.assets || [])]) write(`${t.slug}/${f}`, fs.readFileSync(path.join(t.dir, f)));
  for (const lang of LANGS) {
    const m = t.meta[lang], ui = cfg.ui[lang];
    const main = `<main class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${url(lang)}">${ui.home}</a></li><li aria-current="page">${esc(m.name)}</li></ol></nav>
<div><h1>${esc(m.h1)}</h1><p class="lede">${esc(m.lede)}</p></div>
${t.render(lang)}
<article class="content">
<h2>${ui.howTo}</h2>
<ol>${m.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
${(m.sections || []).map((s) => `<h2>${esc(s.h)}</h2>\n${s.html}`).join("\n")}
<h2>${ui.faq}</h2>
<div class="faq">${m.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join("")}</div>
<h2>${ui.related}</h2>
</article>
${cards(lang, related(t))}
</main>`;
    const schema = [
      { "@context": "https://schema.org", "@type": "WebApplication", name: m.name, url: BASE + url(lang, t.slug), description: m.description, applicationCategory: t.meta.schemaCategory || "UtilitiesApplication", operatingSystem: "Any", browserRequirements: "Requires JavaScript", inLanguage: lang, isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: ui.home, item: BASE + url(lang) }, { "@type": "ListItem", position: 2, name: m.name, item: BASE + url(lang, t.slug) }] },
    ];
    const scripts = [...(t.meta.scripts || []).map((s) => (s.startsWith("/") ? s : `/${t.slug}/${s}`)), `/${t.slug}/app.js`];
    write(`${url(lang, t.slug).slice(1)}index.html`, page({ lang, slug: t.slug, title: `${m.title} | ${cfg.name}`, desc: m.description, main, css: t.css, scripts, schema }));
  }
  addUrl(t.slug);
}

for (const lang of LANGS) {
  const ui = cfg.ui[lang];
  const groups = cfg.categories.map((c) => ({ c, list: tools.filter((t) => t.meta.category === c) })).filter((g) => g.list.length);
  const main = `<main class="wrap">
<div><h1>${esc(ui.homeH1)}</h1><p class="lede">${esc(ui.homeLede)}</p></div>
<section id="recent" class="cat" hidden><h2>${esc(ui.recent)}</h2><ul class="cards" id="recent-list"></ul></section>
<section id="tools" style="display:grid;gap:18px">${groups.map((g) => `<div class="cat"><h2>${esc(ui.cat[g.c])}</h2>${cards(lang, g.list)}</div>`).join("")}</section>
<section class="promise">${ui.promise.map(([h, p]) => `<div><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join("")}</section>
</main>`;
  const schema = [
    { "@context": "https://schema.org", "@type": "WebSite", name: cfg.name, url: BASE + url(lang), inLanguage: lang, description: ui.homeDesc },
    { "@context": "https://schema.org", "@type": "ItemList", itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: BASE + url(lang, t.slug), name: t.meta[lang].name })) },
  ];
  write(`${url(lang).slice(1)}index.html`, page({ lang, title: ui.homeTitle, desc: ui.homeDesc, main, schema }));
}
addUrl("");

const nf = cfg.ui.en;
write("404.html", page({ lang: "en", title: `${nf.notFound} | ${cfg.name}`, desc: nf.notFound, noindex: true,
  main: `<main class="wrap"><div><h1>${nf.notFound}</h1><p class="lede">${nf.notFoundBody} · <a href="/ja/">日本語</a></p></div>${cards("en", tools)}</main>` }));
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemap.join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);
// ---- PWA: per-language manifest (with shortcuts to repeat-use tools) and a service worker ----
const SHORTCUTS = ["pomodoro", "notepad", "character-count", "quiet-qr"];
for (const lang of LANGS) {
  const ui = cfg.ui[lang];
  write(`${url(lang).slice(1)}manifest.webmanifest`, JSON.stringify({
    name: `${cfg.name}: ${ui.appDesc}`, short_name: cfg.name, description: ui.homeDesc, lang,
    start_url: url(lang), scope: "/", display: "standalone", background_color: "#f2f4f8", theme_color: "#2440c4",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
    shortcuts: SHORTCUTS.map((s) => tools.find((t) => t.slug === s)).filter(Boolean).map((t) => ({ name: t.meta[lang].name, url: url(lang, t.slug), icons: [{ src: "/icon-192.png", sizes: "192x192" }] })),
  }, null, 1));
}
// Network-first for our own files (fresh after each deploy, cached for offline); cache-first for fonts.
write("sw.js", `const V = "pk-${Date.now()}";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(V).then((c) => c.addAll(["/", "/ja/", "/assets/base.css", "/assets/site.js", "/favicon.svg"]))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  if (u.origin === location.origin) {
    e.respondWith(fetch(r).then((res) => { if (res.ok) { const c = res.clone(); caches.open(V).then((ca) => ca.put(r, c)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then((m) => m || (r.mode === "navigate" ? caches.match(u.pathname.startsWith("/ja/") ? "/ja/" : "/") : undefined))));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => { const c = res.clone(); caches.open(V).then((ca) => ca.put(r, c)); return res; })));
  }
});
`);

console.log(`Built ${tools.length} tools × ${LANGS.length} languages → dist/ (${BASE})`);
