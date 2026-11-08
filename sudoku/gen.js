// Seeded sudoku generator. Same seed → same puzzle on every device. Puzzles always have exactly one solution.
var Sudoku = (function () {
  function rng(seed) { return function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
  var BOX = []; for (var i = 0; i < 81; i++) BOX[i] = Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3);
  function bits(n) { var c = 0; while (n) { n &= n - 1; c++; } return c; }
  // Count solutions up to `limit`, filling g in place with the first one found when fill=true.
  function search(g, limit, rand, fill) {
    var R = [0,0,0,0,0,0,0,0,0], C = R.slice(), B = R.slice(), i;
    for (i = 0; i < 81; i++) if (g[i]) { var m = 1 << g[i]; R[(i / 9) | 0] |= m; C[i % 9] |= m; B[BOX[i]] |= m; }
    var count = 0;
    (function rec() {
      var best = -1, bestMask = 0, bestN = 10;
      for (var k = 0; k < 81; k++) if (!g[k]) {
        var free = ~(R[(k / 9) | 0] | C[k % 9] | B[BOX[k]]) & 0x3FE, n = bits(free);
        if (n < bestN) { best = k; bestMask = free; bestN = n; if (n <= 1) break; }
      }
      if (best < 0) { count++; return; }
      var ds = []; for (var d = 1; d <= 9; d++) if (bestMask & (1 << d)) ds.push(d);
      if (rand) for (var a = ds.length - 1; a > 0; a--) { var b = Math.floor(rand() * (a + 1)); var t = ds[a]; ds[a] = ds[b]; ds[b] = t; }
      var r = (best / 9) | 0, c = best % 9, bx = BOX[best];
      for (var j = 0; j < ds.length; j++) {
        var mm = 1 << ds[j]; g[best] = ds[j]; R[r] |= mm; C[c] |= mm; B[bx] |= mm;
        rec();
        if (count >= limit) { if (!fill) g[best] = 0; return; }
        g[best] = 0; R[r] &= ~mm; C[c] &= ~mm; B[bx] &= ~mm;
      }
    })();
    return count;
  }
  // clues: target number of givens. Cells are removed in symmetric pairs while the solution stays unique.
  function make(seedStr, clues) {
    var rand = rng(hash(seedStr)), sol = new Array(81).fill(0);
    search(sol, 1, rand, true);
    var puz = sol.slice(), order = [];
    for (var i = 0; i <= 40; i++) order.push(i);
    for (var a = order.length - 1; a > 0; a--) { var b = Math.floor(rand() * (a + 1)); var t = order[a]; order[a] = order[b]; order[b] = t; }
    var filled = 81;
    for (var k = 0; k < order.length && filled > clues; k++) {
      var p = order[k], q = 80 - p, sp = puz[p], sq = puz[q];
      puz[p] = 0; puz[q] = 0;
      if (search(puz.slice(), 2, null, false) !== 1) { puz[p] = sp; puz[q] = sq; }
      else filled -= p === q ? 1 : 2;
    }
    return { puzzle: puz, solution: sol, clues: filled };
  }
  return { make: make };
})();
if (typeof module !== "undefined") module.exports = Sudoku;
