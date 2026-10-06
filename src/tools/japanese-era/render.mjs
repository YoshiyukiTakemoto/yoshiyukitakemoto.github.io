import { createRequire } from "node:module";
const { ERAS, erasOfYear, eraYearLabel, eto, MIN_YEAR } = createRequire(import.meta.url)("./eras.js");

const L = {
  en: { y2j: "Year → Japanese era", j2y: "Japanese era → year", date: "Exact date", year: "Year", era: "Era", eraYear: "Era year", table: "Japanese era chart", tYear: "Year", tEra: "Japanese era", tEto: "Zodiac", tAge: (y) => `Age in ${y}` },
  ja: { y2j: "西暦 → 和暦", j2y: "和暦 → 西暦", date: "日付で変換", year: "西暦", era: "元号", eraYear: "年", table: "和暦・西暦 早見表", tYear: "西暦", tEra: "和暦", tEto: "干支", tAge: (y) => `${y}年の年齢` },
};

export default function render(lang) {
  const t = L[lang], now = new Date().getFullYear(), rows = [];
  for (let y = now + 1; y >= MIN_YEAR; y--) {
    const eras = erasOfYear(y).map((x) => eraYearLabel(x.era, x.n, lang)).join(" / ");
    rows.push(`<tr${y === now ? ' class="cur"' : ""}><td class="num">${y}</td><td>${eras}</td><td>${eto(y, lang)}</td><td class="num" data-y="${y}">${now - y >= 0 ? now - y : "–"}</td></tr>`);
  }
  return `<div class="je">
  <section class="panel">
    <h2 class="eyebrow">${t.y2j}</h2>
    <div class="row"><div class="field"><label for="y">${t.year}</label><input id="y" type="number" min="${MIN_YEAR}" max="2200" value="${now}" inputmode="numeric"></div></div>
    <div class="out" id="y-out" aria-live="polite"></div>
  </section>
  <section class="panel">
    <h2 class="eyebrow">${t.j2y}</h2>
    <div class="row"><div class="field"><label for="era">${t.era}</label><select id="era">${ERAS.map((e, i) => `<option value="${i}">${lang === "ja" ? e.ja : `${e.en} ${e.ja}`}</option>`).join("")}</select></div>
    <div class="field"><label for="ey">${t.eraYear}</label><input id="ey" type="number" min="1" value="1" inputmode="numeric"></div></div>
    <div class="out" id="e-out" aria-live="polite"></div>
  </section>
  <section class="panel">
    <h2 class="eyebrow">${t.date}</h2>
    <div class="row"><div class="field"><label for="d">${t.date}</label><input id="d" type="date" min="1868-01-01"></div></div>
    <div class="out" id="d-out" aria-live="polite"></div>
  </section>
</div>
<section class="chart">
  <h2>${t.table}</h2>
  <div class="tscroll"><table><thead><tr><th>${t.tYear}</th><th>${t.tEra}</th><th>${t.tEto}</th><th id="age-h">${t.tAge(now)}</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>
</section>`;
}
