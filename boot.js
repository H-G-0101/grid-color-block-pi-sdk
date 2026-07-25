/* ============================================================
   BOOT — injeta o bundle do jogo.

   Injeta o bundle do jogo assim que o DOM esta pronto. Como nao ha
   gate do CiDi (que esperava o SDK de storage do Pi Browser
   inicializar), este loader so injeta o bundle assim que o DOM
   esta pronto. O localStorage funciona nativamente tanto no
   navegador comum quanto no Pi Browser, entao nao ha o que
   esperar.

   Mantido como arquivo separado (e ULTIMO no <head>) para
   preservar a ordem: todas as bridges de UI e o pi-boot ja
   estao definidos quando o bundle comeca a rodar.
   ============================================================ */
(function () {
  "use strict";
  var BUNDLE = "bundle.min.js";

  /* Stub inocuo do objeto de anuncios que o bundle procura (window.appads).
     Todos os pontos de recompensa reais ja foram religados (coin shop -> Pi,
     roleta -> concede direto, modais hard -> Pi), entao aqui basta um no-op
     que resolve, pra apiInit nativa nao ficar sem objeto. */
  if (!window.appads) {
    var noop = {
      showAd: function () { return Promise.resolve(); },
      preloadAd: function () {},
      showBanner: function () {},
      hideBanner: function () {}
    };
    window.appads = noop; window.appsk = noop; window.appApi = noop;
  }

  function ver() {
    try {
      var m = /[?&]v=([^&]+)/.exec((document.currentScript && document.currentScript.src) || "");
      return m ? m[1] : String(window.__ASSET_V || Date.now());
    } catch (e) { return String(Date.now()); }
  }

  function inject() {
    var s = document.createElement("script");
    s.src = BUNDLE + "?v=" + ver();
    s.async = false;
    s.onerror = function () { try { console.log("[boot] ERRO ao carregar", s.src); } catch (e) {} };
    document.head.appendChild(s);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject, { once: true });
  } else {
    inject();
  }
})();
