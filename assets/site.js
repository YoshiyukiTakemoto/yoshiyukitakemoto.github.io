// Site-wide behaviour: remember recently used tools, share buttons for tools, and offline support.
(function () {
  var L = document.documentElement.lang === "ja" ? "ja" : "en";
  var UI = {
    en: { share: "Share", x: "Post on X", line: "LINE", copy: "Copy result", copied: "Copied" },
    ja: { share: "シェア", x: "Xでポスト", line: "LINEで送る", copy: "結果をコピー", copied: "コピーしました" }
  }[L];
  var get = function (k, d) { try { var v = JSON.parse(localStorage.getItem("pk:" + k)); return v == null ? d : v; } catch (e) { return d; } };
  var set = function (k, v) { try { localStorage.setItem("pk:" + k, JSON.stringify(v)); } catch (e) {} };

  // Recently used: tool pages record themselves; the home page shows them first.
  var slug = document.body.getAttribute("data-slug");
  if (slug) set("recent", [slug].concat(get("recent", []).filter(function (s) { return s !== slug; })).slice(0, 8));
  var box = document.getElementById("recent");
  if (box) {
    var list = document.getElementById("recent-list"), n = 0;
    get("recent", []).forEach(function (s) {
      var a = document.querySelector('#tools a[href$="/' + s + '/"]');
      if (a && n < 4) { list.appendChild(a.parentNode.cloneNode(true)); n++; }
    });
    if (n) box.hidden = false;
  }

  // PK.share(el, text): render share buttons for a result. The page URL is appended.
  window.PK = {
    share: function (el, text) {
      var url = location.origin + location.pathname, full = text + " " + url;
      var x = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url);
      var line = "https://line.me/R/share?text=" + encodeURIComponent(full);
      el.innerHTML = '<div class="share-row">' +
        (navigator.share ? '<button type="button" class="btn primary" data-native>' + UI.share + "</button>" : "") +
        '<a class="btn" href="' + x + '" target="_blank" rel="noopener">' + UI.x + "</a>" +
        '<a class="btn" href="' + line + '" target="_blank" rel="noopener">' + UI.line + "</a>" +
        '<button type="button" class="btn" data-copy>' + UI.copy + "</button></div>";
      var nb = el.querySelector("[data-native]");
      if (nb) nb.onclick = function () { navigator.share({ text: text, url: url }).catch(function () {}); };
      var cb = el.querySelector("[data-copy]");
      cb.onclick = function () {
        var done = function () { cb.textContent = UI.copied; setTimeout(function () { cb.textContent = UI.copy; }, 1500); };
        try { navigator.clipboard.writeText(full).then(done, function () {}); } catch (e) {}
      };
    },
    get: get, set: set
  };

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
  }
})();
