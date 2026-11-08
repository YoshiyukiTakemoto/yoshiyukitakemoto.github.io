// Plainkit WordPress security check: a passive scan of a site's public pages.
// It only requests URLs any visitor's browser could request, sends about 10–40 requests per scan,
// never logs in or submits forms, and returns findings only (never page contents).
//   POST /scan      {url}               -> findings
//   POST /waitlist  {email, url, lang}  -> stores a sign-up for the paid monitoring service

const ORIGINS = ["https://tools.motty.jp", "https://yoshiyukitakemoto.github.io"];
const UA = "PlainkitWPCheck/1.0 (+https://tools.motty.jp/wordpress-security-check/)";
const MAX_PLUGINS = 30;
const CACHE_TTL = 600;

// PHP branch end-of-life dates (security support end): https://www.php.net/supported-versions.php
const PHP_EOL = { "8.1": "2025-12-31", "8.2": "2026-12-31", "8.3": "2027-12-31", "8.4": "2028-12-31", "8.5": "2029-12-31" };

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ORIGINS.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin) ? origin : ORIGINS[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const { pathname } = new URL(req.url);
    if (req.method !== "POST" || !["/scan", "/waitlist"].includes(pathname)) return json({ error: "not_found" }, 404);

    let input;
    try { input = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
    const ip = req.headers.get("CF-Connecting-IP") || "local";

    if (pathname === "/waitlist") {
      const email = String(input.email || "").trim().slice(0, 254);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "bad_email" }, 400);
      if (!(await allowed(env, ip))) return json({ error: "rate_limited" }, 429);
      await env.WAITLIST.put(email.toLowerCase(), JSON.stringify({ url: String(input.url || "").slice(0, 300), lang: input.lang === "ja" ? "ja" : "en", at: new Date().toISOString() }));
      return json({ ok: true });
    }

    const target = normalize(input.url);
    if (!target) return json({ error: "bad_url" }, 400);
    const cacheKey = new Request(`https://cache.invalid/scan?u=${encodeURIComponent(target)}`);
    const hit = await caches.default.match(cacheKey);
    if (hit) return json(await hit.json());
    if (!(await allowed(env, ip))) return json({ error: "rate_limited" }, 429);

    let result;
    try { result = await scan(target); } catch { return json({ error: "unreachable" }, 502); }
    if (result.error) return json(result, 422);
    await caches.default.put(cacheKey, new Response(JSON.stringify(result), { headers: { "Cache-Control": `max-age=${CACHE_TTL}` } }));
    return json(result);
  },
};

async function allowed(env, ip) {
  if (!env.LIMIT) return true;
  const { success } = await env.LIMIT.limit({ key: ip });
  return success;
}

// Accepts "example.com" or a full URL; returns the site origin, or null for anything that isn't a public hostname.
function normalize(raw) {
  let s = String(raw || "").trim();
  if (!s || s.length > 300) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  let u;
  try { u = new URL(s); } catch { return null; }
  const h = u.hostname.toLowerCase();
  if (u.port || u.username || u.password) return null;
  if (!h.includes(".") || /^[\d.]+$/.test(h) || h.includes(":")) return null; // no bare names or IP literals
  if (/(^|\.)(localhost|local|internal|lan|home|arpa|test|invalid|example)$/.test(h)) return null;
  return `${u.protocol}//${h}`;
}

async function get(url, { method = "GET", range, max = 1_500_000, redirect = "follow" } = {}) {
  const headers = { "User-Agent": UA, "Accept": "text/html,application/json;q=0.9,*/*;q=0.8" };
  if (range) headers.Range = range;
  const res = await fetch(url, { method, headers, redirect, signal: AbortSignal.timeout(8000) });
  let text = "";
  if (method !== "HEAD" && res.body) {
    const reader = res.body.getReader(), dec = new TextDecoder();
    while (text.length < max) {
      const { done, value } = await reader.read();
      if (done) break;
      text += dec.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});
  }
  return { status: res.status, headers: res.headers, text, url: res.url || url };
}
const tryGet = (url, opts) => get(url, opts).catch(() => null);

function cmp(a, b) {
  const pa = String(a).split(".").map((n) => parseInt(n, 10) || 0), pb = String(b).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
}
const branch = (v) => String(v).split(".").slice(0, 2).join(".");

async function scan(target) {
  let home = await tryGet(target + "/");
  if (!home && target.startsWith("https:")) home = await tryGet(target.replace("https:", "http:") + "/");
  if (!home) return { error: "unreachable" };
  if (home.status >= 400) return { error: "http_error", status: home.status };

  const final = new URL(home.url);
  const site = final.origin;
  const html = home.text;
  const isWP = /\/wp-(content|includes)\/|<meta[^>]+generator[^>]+WordPress|api\.w\.org/i.test(html);
  const checks = [];
  const add = (id, level, extra = {}) => checks.push({ id, level, ...extra });

  // Transport
  add("https", final.protocol === "https:" ? "ok" : "danger");
  if (final.protocol === "https:") {
    const plain = await tryGet(`http://${final.host}/`, { method: "HEAD", redirect: "manual" });
    const loc = plain?.headers.get("Location") || "";
    add("http_redirect", plain && plain.status >= 300 && plain.status < 400 && loc.startsWith("https:") ? "ok" : "warn");
    add("hsts", home.headers.get("Strict-Transport-Security") ? "ok" : "warn");
  }
  add("nosniff", /nosniff/i.test(home.headers.get("X-Content-Type-Options") || "") ? "ok" : "warn");
  const csp = home.headers.get("Content-Security-Policy") || "";
  add("clickjacking", home.headers.get("X-Frame-Options") || /frame-ancestors/i.test(csp) ? "ok" : "warn");

  // PHP version, only when the server announces it
  const powered = (home.headers.get("X-Powered-By") || "") + " " + (home.headers.get("Server") || "");
  const phpv = powered.match(/PHP\/(\d+\.\d+(?:\.\d+)?)/i)?.[1];
  if (phpv) {
    const end = PHP_EOL[branch(phpv)];
    const today = new Date().toISOString().slice(0, 10);
    add("php", !end ? (cmp(phpv, "8.1") < 0 ? "danger" : "info") : end < today ? "danger" : "warn", { version: phpv, eol: end || null, note: "exposed" });
  }

  if (!isWP) return { site, isWordPress: false, checks, plugins: [], themes: [], core: null };

  // WordPress core version: generator tag, then the RSS feed
  let core = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']WordPress ([\d.]+)/i)?.[1] || null;
  add("generator", core ? "warn" : "ok");
  const [feed, stable, readme, xmlrpc, users, uploads, debug] = await Promise.all([
    core ? null : tryGet(site + "/feed/", { max: 20000 }),
    tryGet("https://api.wordpress.org/core/stable-check/1.0/", { max: 200000 }),
    tryGet(site + "/readme.html", { max: 4000 }),
    tryGet(site + "/xmlrpc.php", { max: 2000 }),
    tryGet(site + "/wp-json/wp/v2/users?per_page=1", { max: 20000 }),
    tryGet(site + "/wp-content/uploads/", { max: 4000 }),
    tryGet(site + "/wp-content/debug.log", { range: "bytes=0-511", max: 512 }),
  ]);
  if (!core) core = feed?.text.match(/wordpress\.org\/\?v=([\d.]+)/)?.[1] || null;
  // stable-check marks every release "latest", "outdated" (older branch that still gets security fixes) or "insecure".
  let latest = null, state = null;
  try { const d = JSON.parse(stable.text); latest = Object.keys(d).find((v) => d[v] === "latest") || null; state = core ? d[core] || null : null; } catch {}
  if (!core) add("core", "info", { version: null, latest });
  else if (!latest || cmp(core, latest) >= 0) add("core", "ok", { version: core, latest });
  else add("core", state === "outdated" ? "warn" : "danger", { version: core, latest, state: state || "insecure" });

  const ok200 = (r) => r && r.status === 200;
  add("readme", ok200(readme) && /wordpress/i.test(readme.text) ? "warn" : "ok");
  add("xmlrpc", xmlrpc && /XML-RPC server accepts POST requests only/i.test(xmlrpc.text) ? "warn" : "ok");
  let userCount = 0;
  try { if (ok200(users)) userCount = JSON.parse(users.text).length || 0; } catch {}
  add("users_api", userCount > 0 ? "warn" : "ok");
  add("uploads_listing", ok200(uploads) && /<title>Index of/i.test(uploads.text) ? "warn" : "ok");
  const logLike = debug && (debug.status === 200 || debug.status === 206) && /^\s*\[\d{2}-\w{3}-\d{4}|PHP (Warning|Notice|Fatal|Deprecated)/.test(debug.text);
  add("debug_log", logLike ? "danger" : "ok");

  // Plugins and themes referenced by the home page, checked against the wordpress.org directory
  const found = (kind) => {
    const map = new Map();
    const re = new RegExp(`/wp-content/${kind}/([a-z0-9_-]+)/([^"'\\s>)]*)`, "gi");
    for (const m of html.matchAll(re)) {
      const slug = m[1].toLowerCase();
      const ver = m[2].match(/[?&](?:amp;)?ver=([\d][\w.-]*)/)?.[1] || null;
      // The ver= value is usually the component's version, but some assets carry WordPress's own version instead.
      if (!map.has(slug) || (!map.get(slug) && ver && ver !== core)) map.set(slug, ver && ver !== core ? ver : map.get(slug) || null);
    }
    return [...map];
  };
  const pluginList = found("plugins");
  const plugins = await Promise.all(pluginList.slice(0, MAX_PLUGINS).map(([slug, ver]) => directory("plugins", slug, ver)));
  const themes = await Promise.all(found("themes").slice(0, 2).map(([slug, ver]) => directory("themes", slug, ver)));

  return { site, isWordPress: true, core: { version: core, latest }, checks, plugins, themes, pluginsTruncated: pluginList.length > MAX_PLUGINS, userCount };
}

async function directory(kind, slug, version) {
  const type = kind === "plugins" ? "plugin" : "theme";
  const r = await tryGet(`https://api.wordpress.org/${kind}/info/1.2/?action=${type}_information&request[slug]=${slug}&request[fields][sections]=0&request[fields][description]=0`, { max: 300000 });
  let d = null;
  try { d = JSON.parse(r.text); } catch {}
  if (!d || (d.error && !d.closed)) return { slug, version, status: "unknown" };
  if (d.closed || d.error === "closed") return { slug, version, status: "closed", reason: d.reason || null, name: d.name || slug };
  const updated = String(d.last_updated || "").slice(0, 10) || null;
  const stale = updated && Date.now() - Date.parse(updated) > 2 * 365 * 864e5;
  const status = version && cmp(version, d.version) < 0 ? "outdated" : stale ? "abandoned" : version ? "ok" : "unknown_version";
  return { slug, name: decode(d.name || slug), version, latest: d.version, updated, status };
}
const decode = (s) => String(s).replace(/<[^>]*>/g, "")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
