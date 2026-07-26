/* ============================================================
   COIN SHOP bridge (Color Block Jam - estudo)
   Abre ao tocar na pilula de moedas (coroa) da home/mapa.
   4 pacotes AD-GATED PROGRESSIVOS: cada pacote exige N anuncios.
   diamantes via pagamento em Pi (PiPay.pay).

   AJUSTE AQUI (pacotes):
   ------------------------------------------------------------ */
var COINSHOP_PACKS = [
  { coins: 100,  pricePi: 10  },
  { coins: 250,  pricePi: 30  },
  { coins: 500,  pricePi: 60  },
  { coins: 1000, pricePi: 100 }
];
/* ============================================================ */

(function () {
  (function(){var st=document.createElement('style');st.textContent='#csOverlay,#csOverlay *{overflow:visible !important}#csOverlay button{overflow:hidden !important}';document.head.appendChild(st);})();

  "use strict";
  var overlay = null;
  var sceneRef = null;
  var claiming = false;


  var AD_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px;margin-right:5px;"><rect x="2" y="7" width="20" height="14" rx="2.5" fill="#fff" fill-opacity=".92"/><path d="M2.6 7l3.2-4 3.2 4M8.6 7l3.2-4 3.2 4M14.6 7l3.2-4 3.2 4" stroke="#fff" stroke-width="2.2" stroke-linejoin="round" fill="none"/><path d="M10.4 11.6v5l4.3-2.5z" fill="#2f9a1f"/></svg>';

  function coinIcon(sz) {
    sz = sz || 54;
    return '<svg width="__SZ__" height="__SZ__" viewBox="0 0 48 44" style="display:block;margin:0 auto;filter:drop-shadow(0 2px 2px rgba(10,60,110,.35));"><polygon points="15,5 33,5 37,17 11,17" fill="#D8F6FF"/><polygon points="15,5 11,17 2,17" fill="#96E4FF"/><polygon points="33,5 46,17 37,17" fill="#60C4F6"/><polygon points="2,17 11,17 24,42" fill="#3FB3F0"/><polygon points="11,17 37,17 24,42" fill="#85DBFF"/><polygon points="37,17 46,17 24,42" fill="#1780C8"/><g stroke="#0A548C" stroke-opacity=".45" stroke-width="1"><line x1="15" y1="5" x2="11" y2="17"/><line x1="33" y1="5" x2="37" y2="17"/><line x1="11" y1="17" x2="24" y2="42"/><line x1="37" y1="17" x2="24" y2="42"/><line x1="2" y1="17" x2="46" y2="17"/></g><polygon points="15,5 33,5 46,17 24,42 2,17" fill="none" stroke="#0A548C" stroke-width="2.4" stroke-linejoin="round"/><circle cx="19" cy="10" r="2.1" fill="#fff" fill-opacity=".95"/><path d="M14.5 10 H23.5 M19 5.5 V14.5" stroke="#fff" stroke-opacity=".8" stroke-width="1.1"/><circle cx="30" cy="24" r="1" fill="#fff" fill-opacity=".8"/></svg>'.replace(/__SZ__/g, sz);
  }

  function css() {
    if (document.getElementById('csCss')) return;
    var st = document.createElement('style');
    st.id = 'csCss';
    st.textContent =
      '@keyframes csShine{0%{transform:translateX(-130%) rotate(18deg)}100%{transform:translateX(240%) rotate(18deg)}}' +
      '@keyframes csFly{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-46px) scale(1.25);opacity:0}}' +
      '@keyframes csSpin{to{transform:rotate(360deg)}}' +
      '.cs-card{background:#f4f7fb;border-radius:18px;padding:14px 8px 12px;display:flex;flex-direction:column;align-items:center;gap:7px;box-shadow:inset 0 0 0 1px rgba(38,50,74,.06);}' +
      '.cs-amt{font-weight:800;font-size:20px;color:#26324a;}' +
      '.cs-btn{position:relative;overflow:hidden;border:none;cursor:pointer;border-radius:13px;padding:10px 0;width:100%;font-weight:800;font-size:14px;color:#fff;background:linear-gradient(180deg,#63d64a,#3cb52c);box-shadow:0 6px 14px -4px rgba(40,150,30,.55), inset 0 1px 0 rgba(255,255,255,.4);transition:transform .07s,filter .12s;}' +
      '.cs-btn:hover{filter:brightness(1.04);}' +
      '.cs-btn:active{transform:translateY(2px);}' +
      '.cs-btn .sh{position:absolute;top:-30%;left:0;width:34%;height:160%;background:rgba(255,255,255,.35);filter:blur(2px);animation:csShine 2.8s linear infinite;}' +
      '.cs-pill{display:inline-flex;align-items:center;gap:7px;background:#eef4fb;border-radius:999px;padding:5px 15px 5px 8px;box-shadow:inset 0 0 0 1px rgba(38,50,74,.08);}' +
      '.cs-pill b{font-weight:800;font-size:16px;color:#26324a;}' +
      '.cs-fly{position:absolute;left:50%;top:8px;transform:translateX(-50%);font-weight:800;font-size:18px;color:#2d7d00;pointer-events:none;animation:csFly .8s ease-out forwards;}' +
      '#csAdLoading{position:fixed;inset:0;z-index:100001;display:none;align-items:center;justify-content:center;flex-direction:column;gap:14px;background:rgba(14,26,48,.72);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);font-family:\'Baloo 2\',system-ui,sans-serif;}' +
      '#csAdLoading .sp{width:44px;height:44px;border-radius:50%;border:4px solid rgba(255,255,255,.25);border-top-color:#63d64a;animation:csSpin .8s linear infinite;}' +
      '#csAdLoading .t{color:#fff;font-weight:800;font-size:17px;}' +
      '#csAdLoading .s{color:#cfe0f2;font-weight:600;font-size:13px;margin-top:-8px;}';
    document.head.appendChild(st);
  }

  /* ---------- overlay de loading do anuncio ---------- */
  var adLoadEl = null, adLoadShownAt = 0;
  function ensureAdLoading() {
    if (adLoadEl) return adLoadEl;
    adLoadEl = document.createElement('div');
    adLoadEl.id = 'csAdLoading';
    adLoadEl.innerHTML = '<div class="sp"></div><div class="t">Loading ad&hellip;</div><div class="s" id="csAdSub"></div>';
    document.body.appendChild(adLoadEl);
    return adLoadEl;
  }
  function showAdLoading() {
    ensureAdLoading();
    var sub = document.getElementById('csAdSub');
    if (sub) sub.textContent = 'Processing payment...';
    adLoadEl.style.display = 'flex';
    adLoadShownAt = Date.now();
  }
  function hideAdLoading(cb) {
    if (!adLoadEl) { if (cb) cb(); return; }
    var wait = Math.max(0, 350 - (Date.now() - adLoadShownAt));
    setTimeout(function () {
      adLoadEl.style.display = 'none';
      if (cb) cb();
    }, wait);
  }

  function piMark() {
    // simbolo Pi (π) num circulo roxo, estilo Pi Network
    return '<span style="display:inline-flex;align-items:center;justify-content:center;' +
           'width:20px;height:20px;border-radius:50%;background:#7d3cff;color:#fff;' +
           'font:800 13px system-ui;margin-right:6px;vertical-align:-4px;">\u03C0</span>';
  }
  function btnLabel(i) {
    var p = COINSHOP_PACKS[i];
    return piMark() + p.pricePi + ' Pi';
  }

  function modalHTML() {
    var cards = '';
    for (var i = 0; i < COINSHOP_PACKS.length; i++) {
      var p = COINSHOP_PACKS[i];
      cards +=
        '<div class="cs-card" id="csCard' + i + '" style="position:relative;">' +
          coinIcon(i >= 2 ? 60 : 52) +
          '<div class="cs-amt">+' + p.coins + '</div>' +
          '<button class="cs-btn" data-i="' + i + '">' + btnLabel(i) + '<span class="sh"></span></button>' +
        '</div>';
    }
    return '' +
    '<div id="csModal" class="mm-card" style="width:340px;">' +
      '<button id="csCloseBtn" class="mm-close" aria-label="Close"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"></line><line x1="19" y1="5" x2="5" y2="19"></line></svg></button>' +
      '<div class="mm-eyebrow">Get more</div>' +
      '<div class="mm-title" style="margin-bottom:10px;">Coin Shop</div>' +
      '<div style="display:flex;justify-content:center;margin-bottom:16px;">' +
        '<span class="cs-pill"><span style="width:22px;height:22px;display:inline-block;">' + coinIcon(22) + '</span><b id="csBalance">0</b></span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' + cards + '</div>' +
    '</div>';
  }

  function ensureOverlay() {
    css();
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'csOverlay';
    overlay.className = 'mm-overlay';
    document.body.appendChild(overlay);
  }

  function sv() { return sceneRef && sceneRef.saveMngr; }

  function refresh() {
    var s = sv();
    var el = document.getElementById('csBalance');
    if (s && el) el.textContent = s.getCoins();
    var btns = overlay ? overlay.querySelectorAll('.cs-btn') : [];
    for (var i = 0; i < btns.length; i++) {
      var k = parseInt(btns[i].getAttribute('data-i'), 10);
      btns[i].innerHTML = btnLabel(k) + '<span class="sh"></span>';
    }
  }

  function grant(i) {
    var p = COINSHOP_PACKS[i]; if (!p) return;
    var s = sv(); if (!s) return;
    s.changeCoins(p.coins); // credita + atualiza HUD (evento change-coins)
    try { sceneRef.sounds.play('addCoins'); } catch (e) {}
    var card = document.getElementById('csCard' + i);
    if (card) {
      var f = document.createElement('div');
      f.className = 'cs-fly'; f.textContent = '+' + p.coins;
      card.appendChild(f);
      setTimeout(function(){ if (f.parentNode) f.parentNode.removeChild(f); }, 850);
    }
  }

  function onClaim(ev) {
    if (claiming) return;
    var b = ev.currentTarget, i = parseInt(b.getAttribute('data-i'), 10);
    var p = COINSHOP_PACKS[i]; if (!p) return;

    claiming = true;
    showAdLoading();   // spinner enquanto o pagamento Pi acontece

    var settle = function (ok) {
      hideAdLoading(function () {
        claiming = false;
        if (ok) grant(i);   // credita SO quando o pagamento completou
      });
    };

    try {
      if (window.PiPay && window.PiPay.pay) {
        var memo = 'Grid Color Block - ' + p.coins + ' gems';
        window.PiPay.pay(p.pricePi, memo, { type: 'gems', pack: p.coins })
          .then(function () { settle(true); }, function () { settle(false); });
      } else {
        settle(false); // sem Pi disponivel -> nao credita
      }
    } catch (e) { settle(false); }
  }

  function fitModal(){
    var m=document.getElementById('csModal');
    if(!m||!overlay||overlay.style.display==='none')return;
    m.style.transform='none';
    var vw=window.innerWidth,vh=window.innerHeight,w=m.offsetWidth,h=m.offsetHeight;
    var over=72,margin=14;
    var sc=Math.min(1,(vw-2*margin)/w,(vh-2*margin)/(h+2*over));
    m.style.transformOrigin='center center';
    m.style.transform='scale('+sc+')';
    try{
      var r=m.getBoundingClientRect(),top=r.top,bot=r.bottom,els=m.querySelectorAll('*');
      for(var i=0;i<els.length;i++){var b=els[i].getBoundingClientRect();if(b.height>0){if(b.top<top)top=b.top;if(b.bottom>bot)bot=b.bottom;}}
      var dy=0;
      if(top<margin)dy=margin-top;else if(bot>vh-margin)dy=(vh-margin)-bot;
      if(bot-top>vh-2*margin)dy=margin-top;
      if(dy)m.style.transform='translateY('+dy+'px) scale('+sc+')';
    }catch(e){}
  }
  window.addEventListener('resize', fitModal);

  function open(scene) {
    sceneRef = scene || sceneRef;
    ensureOverlay();
    overlay.innerHTML = modalHTML();
    document.getElementById('csCloseBtn').addEventListener('click', close);
    var btns = overlay.querySelectorAll('.cs-btn');
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', onClaim);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    refresh();
    overlay.style.display = 'flex';
    fitModal(); setTimeout(fitModal, 60); setTimeout(fitModal, 250);
  }

  function close() {
    if (claiming) return;            // nao fecha no meio de um anuncio
    if (overlay) overlay.style.display = 'none';
  }

  window.__coinShop = { open: open, close: close };
})();
