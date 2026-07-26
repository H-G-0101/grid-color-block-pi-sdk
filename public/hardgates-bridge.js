/* ============================================================
   HARD/GATES/BOMB BRIDGE — Grid Color Block
   Substitui 3 modais nativos roxos por cards creme (.mm-*):

   1) __hardIntro   — "Congratulations!" (hard/very hard/timer tutor)
      nativo: classe wa. So informativo, botao Continue.
   2) __gatesClosed — "Gates closed / Open for N"
      nativo: classe ji. Pagar -> lvl.unlockHardGates(); X -> closeLevel.
   3) __bombEnd     — "Bomb exploded / Continue N"
      nativo: classe ci. Pagar -> lvl.extendBomb()/extendDynamite();
      X -> closeLevel. PRECO REDUZIDO: 600 -> 200.

   Contrato copiado do bundle:
   - gates/bomb: scene.bombendmenu = stub {update,updatePos,deleteAll},
     scene.isBombEndMenuShow = true enquanto aberto (bloqueia o board),
     dispatchEvent('coins-front') ao abrir e 'coins-back' ao fechar.
   - intro: scene.newMechanicWindow = stub, isNewMechanicWindow = true.
   - Sem saldo: numero fica vermelho e botao desabilita (checkHaveMoney).
   ============================================================ */

(function () {
  "use strict";

  var GATE_PRICE = 400;   // "Open for" do Gates closed
  var BOMB_PRICE = 200;   // "Continue" do Bomb exploded (era 600)

  /* ---------- infra comum ---------- */
  var overlay = null, sceneRef = null, lvlRef = null, kind = null;

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "hgOverlay";
    overlay.className = "mm-overlay";
    document.body.appendChild(overlay);
    var st = document.createElement("style");
    st.textContent =
      "#hgOverlay{overflow:visible;}" +
      "#hgModal .hg-icon{width:96px;height:96px;margin:6px auto 2px;display:flex;align-items:center;justify-content:center;" +
        "border-radius:50%;background:radial-gradient(circle at 50% 35%,#eef4ff 0%,#dbe7fb 60%,#c9d9f4 100%);" +
        "box-shadow:0 10px 22px -8px rgba(38,50,74,.35), inset 0 2px 0 #fff;animation:hgPulse 2.6s ease-in-out infinite;}" +
      "@keyframes hgPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}" +
      "#hgModal .hg-price{font-weight:800;font-size:22px;}" +
      "#hgModal .hg-price.no{color:#e23d28;}" +
      "#hgModal .hg-gem{display:inline-block;transform:translateY(2px);margin-left:6px;}";
    document.head.appendChild(st);
    return overlay;
  }

  function gemSVG(sz) {
    return '<svg class="hg-gem" width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24">' +
      '<path d="M4 9 8 4h8l4 5-8 11z" fill="#59c2f7" stroke="#1d7fc4" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M4 9h16M8 4l4 5 4-5M12 20 8 9M12 20l4-11" stroke="#bfe9ff" stroke-width="1" fill="none"/></svg>';
  }

  function gateSVG() {
    // portao: caixa arredondada com barras azuis e seta, igual ao sprite nativo
    return '<svg width="64" height="46" viewBox="0 0 64 46">' +
      '<rect x="1" y="1" width="62" height="44" rx="8" fill="#dfe6f2" stroke="#9fb0cc" stroke-width="2"/>' +
      '<rect x="8"  y="7" width="7" height="32" rx="2.5" fill="#2f7ff0"/>' +
      '<rect x="18" y="7" width="7" height="32" rx="2.5" fill="#2f7ff0"/>' +
      '<rect x="39" y="7" width="7" height="32" rx="2.5" fill="#2f7ff0"/>' +
      '<rect x="49" y="7" width="7" height="32" rx="2.5" fill="#2f7ff0"/>' +
      '<path d="M32 14 l9 0 -0 0 -9 16 -9-16 z" transform="translate(0,2)" d="M23 16h18l-9 15z" fill="#eaf6ff" stroke="#9fb0cc" stroke-width="1.5"/></svg>';
  }

  function defeatSVG() {
    // bandeira num mastro, levemente caida
    return '<svg width="58" height="58" viewBox="0 0 64 64">' +
      '<rect x="18" y="8" width="4" height="46" rx="2" fill="#8a94a6"/>' +
      '<path d="M22 10 L50 16 Q46 21 50 26 L22 20 Z" fill="#e23d28" stroke="#b02a19" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<ellipse cx="20" cy="55" rx="10" ry="3" fill="#c9d3e4"/></svg>';
  }

  function timerSVG() {
    return '<svg width="58" height="58" viewBox="0 0 64 64">' +
      '<circle cx="32" cy="36" r="22" fill="#eef3fb" stroke="#2f7ff0" stroke-width="4"/>' +
      '<rect x="28" y="4" width="8" height="7" rx="2" fill="#2f7ff0"/>' +
      '<path d="M32 36 L32 22" stroke="#26324a" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M32 36 L42 40" stroke="#e23d28" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="32" cy="36" r="3" fill="#26324a"/></svg>';
  }

  function bombSVG() {
    return '<svg width="60" height="60" viewBox="0 0 64 64">' +
      '<circle cx="30" cy="38" r="21" fill="#3c4450"/>' +
      '<circle cx="24" cy="31" r="7" fill="#5b6572" opacity=".8"/>' +
      '<rect x="34" y="12" width="12" height="9" rx="2.5" fill="#59616d" transform="rotate(18 40 16)"/>' +
      '<path d="M46 12c3-4 7-5 10-3" stroke="#c98a3d" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<circle cx="57" cy="8" r="4" fill="#ffd23e"/><circle cx="57" cy="8" r="2" fill="#ff8a2a"/></svg>';
  }

  function card(inner) {
    return '<div id="hgModal" style="position:relative; width:100%; max-width:360px;">' +
             '<div class="mm-card" style="width:100%; max-width:360px; text-align:center;">' +
               '<button class="mm-close" id="hgClose" aria-label="close">&times;</button>' +
               inner +
             '</div>' +
           '</div>';
  }

  function getText(scene, key) {
    try { return scene.langMngr.getText(key) || key; } catch (e) { return key; }
  }
  function coins(scene) {
    try { return scene.gameSaves.coins | 0; } catch (e) { return 0; }
  }
  function play(scene, snd) { try { scene.sounds.play(snd); } catch (e) {} }

  function stubWindowObj() {
    return { update: function () {}, updatePos: function () {}, resize: function () {},
             deleteAll: function () {}, setDepth: function () { return this; } };
  }

  function openShell(scene, lvl, which) {
    sceneRef = scene; lvlRef = lvl; kind = which;
    if (which !== "intro") {
      try { scene.bombendmenu = stubWindowObj(); scene.isBombEndMenuShow = true; } catch (e) {}
      try { window.dispatchEvent(new Event("coins-front")); } catch (e) {}
    } else {
      try { scene.isNewMechanicWindow = true; scene.newMechanicWindow = stubWindowObj(); } catch (e) {}
    }
    ensureOverlay();
  }

  function closeShell() {
    if (overlay) overlay.style.display = "none";
    var scene = sceneRef;
    if (!scene) return;
    if (kind !== "intro") {
      try { scene.bombendmenu = null; scene.isBombEndMenuShow = false; } catch (e) {}
      try { window.dispatchEvent(new Event("coins-back")); } catch (e) {}
    } else {
      try { scene.newMechanicWindow = null; scene.isNewMechanicWindow = false; } catch (e) {}
    }
    sceneRef = null; lvlRef = null; kind = null;
  }

  function fitModal() {
    var m = document.getElementById("hgModal");
    if (!m) return;
    m.style.transform = "";
    var h = m.getBoundingClientRect().height, vh = window.innerHeight - 28;
    if (h > vh) m.style.transform = "scale(" + (vh / h) + ")";
  }
  window.addEventListener("resize", fitModal);

  /* ============ 1) INTRO hard / very hard / timer ============ */
  function openIntro(scene, n) {
    openShell(scene, null, "intro");
    var title = getText(scene, "newHardTitle");
    var d1 = getText(scene, "newHardDesc" + n);
    var d2 = getText(scene, "newHardDesc" + (1 == n ? 3 : 4));
    if (3 === n) {
      title = getText(scene, "timerOpenTitle");
      d1 = getText(scene, "timerOpenDesc1");
      d2 = getText(scene, "timerOpenDesc2");
    }
    overlay.innerHTML = card(
      '<div class="hg-icon">' + gateSVG() + '</div>' +
      '<div class="mm-eyebrow">Unlocked</div>' +
      '<div class="mm-title">' + esc(title) + '</div>' +
      '<div style="font-weight:700;font-size:17px;color:#26324a;margin:10px 4px 2px;white-space:pre-line;">' + esc(d1) + '</div>' +
      '<div style="font-weight:600;font-size:14px;color:#7a869c;margin:8px 6px 14px;white-space:pre-line;">' + esc(d2) + '</div>' +
      '<button class="mm-btn" id="hgContinue" style="width:100%;"><span class="amt">Continue</span></button>'
    );
    var done = function () { play(scene, "click"); closeShell(); };
    document.getElementById("hgContinue").addEventListener("click", done);
    document.getElementById("hgClose").addEventListener("click", done);
    overlay.style.display = "flex";
    fitModal(); setTimeout(fitModal, 60);
  }

  /* ============ 2/3) GATES CLOSED e BOMB EXPLODED ============ */
  function openPay(scene, lvl, cfg) {
    openShell(scene, lvl, cfg.kind);
    var have = coins(scene), ok = have >= cfg.price;
    overlay.innerHTML = card(
      '<div class="hg-icon">' + cfg.icon + '</div>' +
      '<div class="mm-title" style="margin-top:8px;">' + esc(cfg.title) + '</div>' +
      '<div style="font-weight:700;font-size:16px;color:#26324a;margin:10px 6px 14px;white-space:pre-line;">' + esc(cfg.desc) + '</div>' +
      '<button class="mm-btn" id="hgBuy" style="width:100%;" ' + (ok ? '' : 'disabled') + '>' +
        '<span class="amt">' + esc(cfg.btnLabel) + '</span>' +
        '<span class="hg-price ' + (ok ? '' : 'no') + '">' + cfg.price + gemSVG(20) + '</span>' +
      '</button>'
    );
    var buying = false;
    document.getElementById("hgBuy").addEventListener("click", function () {
      if (buying) return;
      var have2 = coins(scene);
      play(scene, "click");
      if (have2 < cfg.price) return;
      buying = true;
      try { scene.saveMngr.changeCoins(-cfg.price); } catch (e) {}
      try { cfg.onPay(); } catch (e) {}
      closeShell();
    });
    document.getElementById("hgClose").addEventListener("click", function () {
      if (buying) return;
      play(scene, "click");
      closeShell();
      try { scene.closeLevel(!1, !1, !0); } catch (e) {}
    });
    overlay.style.display = "flex";
    fitModal(); setTimeout(fitModal, 60);
  }

  function esc(t) { return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  /* ---------- API publica (chamada pelo bundle patchado) ---------- */
  window.__hardIntro = { open: openIntro };

  window.__gatesClosed = {
    open: function (scene, lvl) {
      openPay(scene, lvl, {
        kind: "gates", price: GATE_PRICE,
        icon: gateSVG(),
        title: getText(scene, "hardEndTitle"),
        desc: getText(scene, "hardEndDesc"),
        btnLabel: getText(scene, "hardBuyCoinsButton"),  // "Open for"
        onPay: function () { if (lvl) lvl.unlockHardGates(); }
      });
    }
  };

  /* ============ 4) DEFEAT (fim de movimentos) ============ */
  window.__defeat = {
    open: function (scene) {
      sceneRef = scene; lvlRef = null; kind = "defeat";
      // contrato da classe nativa Ua
      try {
        scene.isMovesEndShow = true;
        scene.movesend = stubWindowObj();       // update loop chama .update()/.updatePos()
        play(scene, "movesend");
        scene.gameplayStop && scene.gameplayStop();
        scene.saveprogress && scene.saveprogress(!0);
      } catch (e) {}
      ensureOverlay();
      var title = getText(scene, "endGameOver");   // "Defeat!"
      overlay.innerHTML = card(
        '<div class="hg-icon">' + defeatSVG() + '</div>' +
        '<div class="mm-title" style="margin-top:8px;">' + esc(title) + '</div>' +
        '<div style="height:10px;"></div>' +
        '<button class="mm-btn" id="hgRetry" style="width:100%;"><span class="amt">Try Again</span></button>' +
        '<button class="mm-btn amber" id="hgMenu" style="width:100%;margin-top:10px;"><span class="amt">' +
          esc(getText(scene, "endMenuButton")) + '</span></button>'
      );
      // sem X: derrota nao tem fechar-sem-escolher (igual ao nativo)
      var closeBtn = document.getElementById("hgClose");
      if (closeBtn) closeBtn.style.display = "none";

      var acted = false;
      function leave(replay) {
        if (acted) return; acted = true;
        play(scene, "click");
        if (overlay) overlay.style.display = "none";
        try {
          scene.isMovesEndShow = false;
          // closeMovesEnd(): anula movesend chamando deleteAll do stub
          if (scene.closeMovesEnd) scene.closeMovesEnd();
          else scene.movesend = null;
          if (replay) scene.closeLevel(!0); else scene.closeLevel();
        } catch (e) {}
        sceneRef = null; kind = null;
      }
      document.getElementById("hgRetry").addEventListener("click", function () { leave(true); });
      document.getElementById("hgMenu").addEventListener("click", function () { leave(false); });
      overlay.style.display = "flex";
      fitModal(); setTimeout(fitModal, 60);
    }
  };

  /* ============ 5) TIMER ENDED (fase hard com cronometro) ============ */
  window.__timerEnd = {
    open: function (scene, lvl) {
      openPay(scene, lvl, {
        kind: "timer", price: BOMB_PRICE,   // mesmo produto da bomba: +20s
        icon: timerSVG(),
        title: getText(scene, "timerEndTitle"),      // "Timer ended"
        desc: getText(scene, "bombEndDesc"),         // "Get 20 seconds to keep playing!"
        btnLabel: getText(scene, "bombBuyCoinsButton"),
        onPay: function () { if (lvl) lvl.extendTimer(); }
      });
    }
  };

  window.__bombEnd = {
    open: function (scene, lvl, isDynamite) {
      openPay(scene, lvl, {
        kind: "bomb", price: BOMB_PRICE,
        icon: bombSVG(),
        title: getText(scene, isDynamite ? "dynamiteEndTitle" : "bombEndTitle"),
        desc: getText(scene, isDynamite ? "dynamiteEndDesc" : "bombEndDesc"),
        btnLabel: getText(scene, "bombBuyCoinsButton"),  // "Continue"
        onPay: function () {
          if (!lvl) return;
          if (isDynamite) lvl.extendDynamite(); else lvl.extendBomb();
        }
      });
    }
  };
})();
