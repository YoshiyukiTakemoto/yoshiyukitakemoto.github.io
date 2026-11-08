// Minimal PDF writer: one JPEG image per page (DCTDecode). Shared by tools that export PDF.
// pages: [{ jpeg: Uint8Array, w: px, h: px, pw: pt, ph: pt }]  → Blob (application/pdf)
window.miniPDF = function (pages) {
  var enc = new TextEncoder(), parts = [], offsets = [], len = 0;
  var push = function (x) { var b = typeof x === "string" ? enc.encode(x) : x; parts.push(b); len += b.length; };
  var n = 2 + pages.length * 3, kids = [];
  for (var i = 0; i < pages.length; i++) kids.push((3 + i * 3) + " 0 R");
  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  var obj = function (id, body) { offsets[id] = len; push(id + " 0 obj\n"); body(); push("\nendobj\n"); };
  obj(1, function () { push("<< /Type /Catalog /Pages 2 0 R >>"); });
  obj(2, function () { push("<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + pages.length + " >>"); });
  pages.forEach(function (p, i) {
    var pid = 3 + i * 3, cid = pid + 1, iid = pid + 2;
    var cs = "q " + p.pw.toFixed(2) + " 0 0 " + p.ph.toFixed(2) + " 0 0 cm /Im0 Do Q";
    obj(pid, function () { push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + p.pw.toFixed(2) + " " + p.ph.toFixed(2) + "] /Resources << /XObject << /Im0 " + iid + " 0 R >> >> /Contents " + cid + " 0 R >>"); });
    obj(cid, function () { push("<< /Length " + cs.length + " >>\nstream\n" + cs + "\nendstream"); });
    obj(iid, function () { push("<< /Type /XObject /Subtype /Image /Width " + p.w + " /Height " + p.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + p.jpeg.length + " >>\nstream\n"); push(p.jpeg); push("\nendstream"); });
  });
  var xref = len, x = "xref\n0 " + (n + 1) + "\n0000000000 65535 f \n";
  for (var k = 1; k <= n; k++) x += String(offsets[k]).padStart(10, "0") + " 00000 n \n";
  push(x + "trailer\n<< /Size " + (n + 1) + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF");
  return new Blob(parts, { type: "application/pdf" });
};
// Encode a canvas as JPEG bytes.
window.canvasJPEG = function (canvas, q) {
  return new Promise(function (ok) { canvas.toBlob(function (b) { b.arrayBuffer().then(function (a) { ok(new Uint8Array(a)); }); }, "image/jpeg", q || 0.92); });
};
window.saveBlob = function (blob, name) {
  var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
};
