/* ============================================================
   Booster buy-modal bridge (Color Block Jam)
   Substitui os modais nativos de compra pelos modais
   customizados (Claude Design), ligados nas funcoes do jogo.

   AJUSTE AQUI (preco e quantidade concedida por compra):
   id 1 = Rainbow Gates | id 2 = Hammer
   ------------------------------------------------------------ */
   var BOOSTER_CFG = {
     1: { price: 150,  grant: 1, name: "Rainbow Gates", desc: "Gives the ability to destroy any block in any open gates" },
     2: { price: 100,  grant: 1, name: "Hammer",        desc: "Smashes any block you tap" },
     3: { price: 250,  grant: 1, name: "Color Delete",  desc: "Clears every block sharing the same color" }
   };
/* ============================================================ */

(function () {
  "use strict";
  (function(){var st=document.createElement('style');st.textContent='#rgOverlay,#rgOverlay *{overflow:visible !important}#rgOverlay .cs-btn,#rgOverlay .rg-btn,#rgOverlay button{overflow:hidden !important}';document.head.appendChild(st);})();


  var purchased = {};      // contador por id (sessao)
  var currentBooster = null;
  var overlay = null;

  // ---- icones (do seu Claude Design — NAO ALTERADOS) ----
  var ICONS = {
    1: // rainbow ball
      '<div style="position:relative; width:62px; height:62px; border-radius:50%; background: conic-gradient(#ff4d6d, #ff9f1c, #ffe14d, #4dd87b, #38b6ff, #9b6dff, #ff4d6d); box-shadow: inset 0 -5px 8px rgba(40,20,80,0.35), 0 4px 8px rgba(20,50,90,0.3); animation: rgPulse 2.4s ease-in-out infinite;">' +
        '<span style="position:absolute; inset:8px; border-radius:50%; background: radial-gradient(circle at 38% 30%, rgba(255,255,255,0.95), rgba(150,210,255,0.6) 38%, rgba(40,120,210,0.15) 70%, transparent 80%);"></span>' +
        '<span style="position:absolute; top:9px; left:14px; width:14px; height:9px; border-radius:50%; background: rgba(255,255,255,0.9); transform: rotate(-20deg);"></span>' +
      '</div>',
    2: // hammer
      '<div style="position:relative; width:72px; height:72px; display:flex; align-items:center; justify-content:center; animation: rgPulse 2.4s ease-in-out infinite;">' +
        '<svg width="62" height="62" viewBox="0 0 64 64" style="display:block; filter: drop-shadow(0 3px 4px rgba(20,50,90,0.3));">' +
          '<rect x="29" y="26" width="9" height="34" rx="4.5" transform="rotate(34 33.5 43)" fill="#e23a2c"></rect>' +
          '<rect x="31" y="28" width="3" height="30" rx="1.5" transform="rotate(34 33.5 43)" fill="#ffd83b"></rect>' +
          '<g transform="rotate(34 32 22)">' +
            '<rect x="14" y="13" width="36" height="18" rx="5" fill="#d7dde3"></rect>' +
            '<rect x="14" y="13" width="36" height="7" rx="4" fill="#eef2f5"></rect>' +
            '<rect x="26" y="13" width="9" height="18" fill="#e23a2c"></rect>' +
            '<rect x="35" y="13" width="6" height="18" fill="#ffd83b"></rect>' +
          '</g>' +
        '</svg>' +
      '</div>',
    3: // color delete (magnet — igual ao icone do booster)
      '<div style="position:relative; width:72px; height:72px; display:flex; align-items:center; justify-content:center; animation: rgPulse 2.4s ease-in-out infinite;">' +
        '<svg width="64" height="64" viewBox="0 0 64 64" style="display:block; filter: drop-shadow(0 3px 4px rgba(20,50,90,0.3));">' +
          '<path d="M14 47 L14 30 A18 18 0 0 1 50 30 L50 47 L38 47 L38 30 A6 6 0 0 0 26 30 L26 47 Z" fill="#e23a2c" stroke="#b0271c" stroke-width="2" stroke-linejoin="round"></path>' +
          '<path d="M19 45 L19 30 A13 13 0 0 1 24 19" fill="none" stroke="#ff8378" stroke-width="3" stroke-linecap="round" opacity="0.6"></path>' +
          '<rect x="12.5" y="45" width="15" height="10" rx="2.5" fill="#d7dde3" stroke="#98a1a9" stroke-width="1.5"></rect>' +
          '<rect x="36.5" y="45" width="15" height="10" rx="2.5" fill="#d7dde3" stroke="#98a1a9" stroke-width="1.5"></rect>' +
          '<rect x="12.5" y="45" width="15" height="3.6" rx="1.8" fill="#eef2f5"></rect>' +
          '<rect x="36.5" y="45" width="15" height="3.6" rx="1.8" fill="#eef2f5"></rect>' +
          '<line x1="20" y1="58" x2="20" y2="62" stroke="#ffe57a" stroke-width="2.4" stroke-linecap="round"></line>' +
          '<line x1="44" y1="58" x2="44" y2="62" stroke="#38b6ff" stroke-width="2.4" stroke-linecap="round"></line>' +
          '<circle cx="32" cy="60" r="1.6" fill="#9b6dff"></circle>' +
        '</svg>' +
      '</div>'
  };

  // ---- shell do modal (tema "card claro/creme" compartilhado; iconHTML = slot do icone) ----
  function modalHTML(iconHTML) {
    // diamante ciano (moeda v105) exibido antes do preco
    var DIAMOND =
      '<svg width="22" height="20" viewBox="0 0 48 44" style="display:block;">' +
        '<polygon points="15,5 33,5 46,17 24,42 2,17" fill="#85DBFF"></polygon>' +
        '<polygon points="15,5 33,5 37,17 11,17" fill="#D8F6FF"></polygon>' +
        '<polygon points="2,17 11,17 24,42" fill="#3FB3F0"></polygon>' +
        '<polygon points="46,17 37,17 24,42" fill="#1780C8"></polygon>' +
        '<polygon points="11,17 37,17 24,42" fill="#60C4F6"></polygon>' +
        '<g fill="none" stroke="#0A548C" stroke-width="1.2" stroke-linejoin="round">' +
          '<polygon points="15,5 33,5 46,17 24,42 2,17"></polygon>' +
          '<path d="M11,17 L37,17 M15,5 L11,17 M33,5 L37,17 M11,17 L24,42 M37,17 L24,42"></path>' +
        '</g><circle cx="20" cy="10" r="1.5" fill="#fff"></circle></svg>';
    return '' +
    '<div id="rgModal" class="mm-card">' +
      // X
      '<button id="rgCloseBtn" class="mm-close" aria-label="Close">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" style="display:block;"><line x1="5" y1="5" x2="19" y2="19"></line><line x1="19" y1="5" x2="5" y2="19"></line></svg>' +
      '</button>' +
      // header limpo
      '<div class="mm-eyebrow">Booster</div>' +
      '<div id="rgNameHeader" class="mm-title"></div>' +
      // icone num disco tingido (halo vermelho, casa com o ima)
      '<div class="mm-iconwrap">' +
        '<div class="mm-disc" style="--mm-halo:#ffe6dc; --mm-halo2:#ffd3c4; --mm-halo-in:rgba(210,90,60,.18); --mm-halo-out:rgba(210,90,60,.4);">' + iconHTML + '</div>' +
      '</div>' +
      // nome interno (mantido p/ compat; o titulo ja mostra o nome)
      '<div id="rgNameInner" style="display:none;"></div>' +
      // descricao
      '<div id="rgDesc" class="mm-desc"></div>' +
      // botao comprar (verde) com diamante + preco
      '<button id="rgBuyBtn" class="mm-btn" aria-label="Buy">' +
        '<span class="lbl">Buy</span>' + DIAMOND +
        '<span id="rgPrice" class="amt">0</span>' +
      '</button>' +
      // rodape
      '<div class="mm-foot">Purchased <b id="rgPurchased">0</b></div>' +
    '</div>';
  }

  // apenas o que e especifico deste bridge; o resto vem de modal-theme.css
  var STYLE_CSS =
'@keyframes rgPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }' +
'.rg-shake { animation: mmShake .4s; }';

  function ensureStyle() {
    if (document.getElementById("rgBridgeStyle")) return;
    var st = document.createElement("style");
    st.id = "rgBridgeStyle";
    st.textContent = STYLE_CSS;
    document.head.appendChild(st);
  }

  function ensureOverlay() {
    ensureStyle();
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.id = "rgOverlay";
    overlay.className = "mm-overlay";
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
    window.addEventListener("resize", fitModal);
  }

  // escala o modal pra caber na tela (corrige corte em telas pequenas; visual preservado)
  function fitModal(){
    var m=document.getElementById('rgModal');
    if(!m||!overlay||overlay.style.display==='none')return;
    m.style.transform='none';
    var vw=window.innerWidth,vh=window.innerHeight,w=m.offsetWidth,h=m.offsetHeight;
    var over=72,margin=14;
    var sc=Math.min(1,(vw-2*margin)/w,(vh-2*margin)/(h+2*over));
    m.style.transformOrigin='center center';
    m.style.transform='scale('+sc+')';
    /* mede o retangulo visual real (card + penachos) e empurra pra dentro */
    try{
      var r=m.getBoundingClientRect(),top=r.top,bot=r.bottom,els=m.querySelectorAll('*');
      for(var i=0;i<els.length;i++){var b=els[i].getBoundingClientRect();if(b.height>0){if(b.top<top)top=b.top;if(b.bottom>bot)bot=b.bottom;}}
      var dy=0;
      if(top<margin)dy=margin-top;else if(bot>vh-margin)dy=(vh-margin)-bot;
      if(bot-top>vh-2*margin)dy=margin-top; /* maior que a tela: ancora topo visivel */
      if(dy)m.style.transform='translateY('+dy+'px) scale('+sc+')';
    }catch(e){}
  }

  function sv() {
    return currentBooster && currentBooster.scene && currentBooster.scene.saveMngr;
  }

  function cfg() {
    return currentBooster ? BOOSTER_CFG[currentBooster.id] : null;
  }

  function refresh() {
    var s = sv(), c = cfg();
    if (!c) return;
    var id = currentBooster.id;
    var bal = document.getElementById("rgBalance");
    if (s && bal) bal.textContent = s.getCoins();
    document.getElementById("rgPrice").textContent = c.price;
    document.getElementById("rgPurchased").textContent = purchased[id] || 0;
    document.getElementById("rgNameHeader").textContent = c.name;
    document.getElementById("rgNameInner").textContent = c.name;
    document.getElementById("rgDesc").textContent = c.desc;
  }

  function onBuy() {
    var s = sv(), c = cfg();
    if (!s || !c) return;
    var id = currentBooster.id;
    if (s.getCoins() < c.price) {
      var card = overlay.querySelector("div > div > div");
      if (card) { card.classList.remove("rg-shake"); void card.offsetWidth; card.classList.add("rg-shake"); }
      return;
    }
    s.changeCoins(-c.price);                                   // debita + atualiza HUD
    if (s.addAmplifiersSave) s.addAmplifiersSave(id, c.grant); // concede booster
    try {
      if (currentBooster.lvl && currentBooster.lvl.gui && currentBooster.lvl.gui.updateAmp)
        currentBooster.lvl.gui.updateAmp(id);                 // atualiza botao do booster
    } catch (e) {}
    purchased[id] = (purchased[id] || 0) + 1;
    refresh();
  }

  function open(booster) {
    if (!BOOSTER_CFG[booster.id]) return;
    ensureOverlay();
    currentBooster = booster;
    overlay.innerHTML = modalHTML(ICONS[booster.id] || "");
    document.getElementById("rgCloseBtn").addEventListener("click", close);
    document.getElementById("rgBuyBtn").addEventListener("click", onBuy);
    refresh();
    overlay.style.display = "flex";
    fitModal(); setTimeout(fitModal,60); setTimeout(fitModal,250);
  }

  function close() {
    if (overlay) overlay.style.display = "none";
    currentBooster = null;
  }

  function has(id) { return !!BOOSTER_CFG[id]; }

  // exposto pro patch do bundle (openBuyBox)
  window.__rgBooster = { open: open, close: close, has: has };
})();
