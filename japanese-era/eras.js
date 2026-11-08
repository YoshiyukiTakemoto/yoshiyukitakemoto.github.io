// Shared by render.mjs (build time) and app.js (browser). Start dates are Gregorian.
// Meiji is counted from 1 January 1868 at year level; Japan used the lunisolar calendar until 1872.
var ERAS = [
  { ja: "令和", en: "Reiwa", s: [2019, 5, 1] },
  { ja: "平成", en: "Heisei", s: [1989, 1, 8] },
  { ja: "昭和", en: "Showa", s: [1926, 12, 25] },
  { ja: "大正", en: "Taisho", s: [1912, 7, 30] },
  { ja: "明治", en: "Meiji", s: [1868, 1, 1] }
];
var STEMS = "甲乙丙丁戊己庚辛壬癸", BRANCHES = "子丑寅卯辰巳午未申酉戌亥";
var ANIMAL_JA = ["ね", "うし", "とら", "う", "たつ", "み", "うま", "ひつじ", "さる", "とり", "いぬ", "い"];
var ANIMAL_EN = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Boar"];
var MIN_YEAR = 1868;

// Eras that include any part of Gregorian year y, oldest first, with the era year number.
function erasOfYear(y) {
  var out = [];
  for (var i = ERAS.length - 1; i >= 0; i--) {
    var e = ERAS[i], next = ERAS[i - 1];
    var endY = next ? (next.s[1] === 1 && next.s[2] === 1 ? next.s[0] - 1 : next.s[0]) : Infinity;
    if (y >= e.s[0] && y <= endY) out.push({ era: e, n: y - e.s[0] + 1, next: next && y === next.s[0] ? next : null });
  }
  return out;
}
function eraYearLabel(e, n, lang) { return lang === "ja" ? e.ja + (n === 1 ? "元" : n) + "年" : e.en + " " + n; }
function eto(y, lang) {
  var i = ((y - 4) % 12 + 12) % 12, k = STEMS[((y - 4) % 10 + 10) % 10] + BRANCHES[i];
  return lang === "ja" ? k + "（" + ANIMAL_JA[i] + "）" : ANIMAL_EN[i] + " (" + k + ")";
}
function maxYear(e) { var i = ERAS.indexOf(e); return i === 0 ? Infinity : ERAS[i - 1].s[0] - e.s[0] + 1; }
if (typeof module !== "undefined") module.exports = { ERAS, erasOfYear, eraYearLabel, eto, maxYear, MIN_YEAR };
