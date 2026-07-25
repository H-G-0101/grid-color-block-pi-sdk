/* ============================================================
   modal-bridge.js v3  (estudo local) — reescrito do zero
   O modal nativo é removido da tela (estacionado fora do canvas,
   vivo) e o NOSSO modal DOM assume. Suporta reabertura mesmo se
   o jogo cachear a instância do prefab.

   SETTINGS -> toggles 100% nossos (cc.audioEngine + prefs).
   BOOSTER  -> Buy/Get disparam toque simulado nos botões nativos.
   ============================================================ */
(function () {
  "use strict";
  var TAG = "[modal-bridge v3]";
  var PARK_X = 100000;

  /* ============ preferências de áudio ============ */
  var PREF_KEY = "mb_prefs";
  var prefs = { bgm: true, sfx: true };
  try { var sv = localStorage.getItem(PREF_KEY); if (sv) prefs = JSON.parse(sv); } catch (e) {}
  function savePrefs(){ try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) {} }
  function applyAudio(){
    try {
      if (!window.cc || !cc.audioEngine) return;
      cc.audioEngine.setMusicVolume(prefs.bgm ? 1 : 0);
      cc.audioEngine.setEffectsVolume(prefs.sfx ? 1 : 0);
    } catch (e) {}
  }

  /* ============ CSS + DOM base ============ */
  var css = ""
  + "#mbOverlay{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;"
  + "background:rgba(15,18,32,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);"
  + "font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif}"
  + "#mbCard{position:relative;width:min(86vw,360px);background:#fff;border-radius:24px;"
  + "box-shadow:0 24px 60px rgba(0,0,0,.35);animation:mbPop .22s cubic-bezier(.34,1.56,.64,1)}"
  + "@keyframes mbPop{from{transform:scale(.82);opacity:0}to{transform:scale(1);opacity:1}}"
  + "#mbHead{margin:-18px 18px 0;background:linear-gradient(135deg,#7c4dff,#448aff);border-radius:16px;"
  + "padding:14px 12px;text-align:center;color:#fff;font-size:24px;font-weight:800;letter-spacing:.5px;"
  + "text-shadow:0 2px 0 rgba(0,0,0,.18);box-shadow:0 8px 18px rgba(68,138,255,.35)}"
  + "#mbX{position:absolute;top:-14px;right:-14px;width:46px;height:46px;border:none;border-radius:50%;"
  + "background:#ff5252;color:#fff;font-size:22px;font-weight:900;line-height:46px;cursor:pointer;z-index:2;"
  + "box-shadow:0 4px 10px rgba(0,0,0,.3)}#mbX:active{transform:scale(.9)}"
  + "#mbBody{padding:14px 18px 20px}"
  + "#mbIconWrap{display:flex;align-items:center;justify-content:center;margin:10px auto 6px;width:150px;height:150px;"
  + "background:radial-gradient(circle at 50% 35%,#f6f9ff,#e8eefc);border-radius:28px;box-shadow:0 6px 16px rgba(30,60,120,.10);overflow:hidden}"
  + "#mbDes{padding:6px 8px 16px;text-align:center;color:#3a3f52;font-size:16px;line-height:1.45;font-weight:600}"
  + "#mbBtns{display:flex;gap:12px}"
  + "#mbBtns button{flex:1;border:none;border-radius:16px;padding:14px 8px;font-size:18px;font-weight:800;color:#fff;"
  + "cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;"
  + "box-shadow:0 5px 0 rgba(0,0,0,.18),0 8px 16px rgba(0,0,0,.15);transition:transform .06s}"
  + "#mbBtns button:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.18)}"
  + "#mbBuy{background:linear-gradient(180deg,#42c6ff,#1e88e5)}"
  + "#mbGet{background:linear-gradient(180deg,#ffd54f,#fb9e00);color:#5c3d00!important}"
  + ".mbCoin{display:inline-block;width:22px;height:20px;"
  + "clip-path:polygon(28% 0,72% 0,100% 34%,50% 100%,0 34%);"
  + "background:linear-gradient(180deg,#aaf2ff 0%,#41d6ff 38%,#1e88e5 75%,#1556 9e 100%);"
  + "background:linear-gradient(180deg,#aaf2ff 0%,#41d6ff 38%,#1e88e5 100%)}"
  + ".mbPlay{display:inline-block;width:0;height:0;border-left:14px solid #5c3d00;border-top:9px solid transparent;border-bottom:9px solid transparent}"
  + ".mbRow{display:flex;align-items:center;gap:14px;padding:14px 6px;border-bottom:1px solid #eef1f7}"
  + ".mbRow:last-child{border-bottom:none}"
  + ".mbRowIco{font-size:26px;width:36px;text-align:center}"
  + ".mbRowLbl{flex:1;font-size:19px;font-weight:800;color:#2d3348}"
  + ".mbSw{position:relative;width:64px;height:34px;border-radius:17px;background:#cfd6e4;cursor:pointer;"
  + "transition:background .18s;box-shadow:0 2px 4px rgba(0,0,0,.15) inset}"
  + ".mbSw.on{background:linear-gradient(180deg,#6fdc4f,#3cb527)}"
  + ".mbSw i{position:absolute;top:3px;left:3px;width:28px;height:28px;border-radius:50%;background:#fff;"
  + "box-shadow:0 2px 5px rgba(0,0,0,.25);transition:left .18s}"
  + ".mbSw.on i{left:33px}"
  /* shop */
  + ".mbShopRow{display:flex;align-items:center;gap:12px;padding:12px 10px;margin-bottom:12px;"
  + "background:linear-gradient(180deg,#f8faff,#eef2fb);border:2px solid #e3e9f6;border-radius:18px;"
  + "box-shadow:0 3px 8px rgba(30,60,120,.08)}"
  + ".mbShopRow:last-child{margin-bottom:0}"
  + ".mbShopIco{width:64px;height:64px;display:flex;align-items:center;justify-content:center;flex:none;"
  + "background:radial-gradient(circle at 50% 35%,#fff,#e8eefc);border-radius:14px;overflow:hidden}"
  + ".mbShopTxt{flex:1;font-size:17px;font-weight:800;color:#2d3348;line-height:1.25}"
  + ".mbShopTxt small{display:block;font-size:13px;color:#8b93ab;font-weight:700}"
  + ".mbShopBtn{border:none;border-radius:14px;padding:12px 16px;font-size:16px;font-weight:800;color:#5c3d00;"
  + "cursor:pointer;display:flex;align-items:center;gap:7px;background:linear-gradient(180deg,#ffd54f,#fb9e00);"
  + "box-shadow:0 4px 0 rgba(0,0,0,.18),0 6px 12px rgba(0,0,0,.12);transition:transform .06s}"
  + ".mbShopBtn:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.18)}"
  + ".mbShopBtn.free{background:linear-gradient(180deg,#6fdc4f,#3cb527);color:#fff}"
  + ".mbShopBtn .mbPlay{border-left-color:#5c3d00;border-top-width:7px;border-bottom-width:7px;border-left-width:11px}"
  + ".mbShopBtn.free .mbPlay{border-left-color:#fff}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var overlay = document.createElement("div");
  overlay.id = "mbOverlay";
  overlay.innerHTML = '<div id="mbCard"><button id="mbX">\u2715</button><div id="mbHead"></div><div id="mbBody"></div></div>';
  function mount(){ if(!overlay.parentNode && document.body) document.body.appendChild(overlay); }
  mount(); document.addEventListener("DOMContentLoaded", mount);

  /* ============ helpers cc ============ */
  function findDesc(root, name, comp) {
    var out = null;
    (function w(n){ if(out||!n) return;
      if(n.name===name && (!comp||(n.getComponent&&n.getComponent(comp)))){ out=n; return; }
      var c=n.children||[]; for(var i=0;i<c.length;i++) w(c[i]); })(root);
    return out;
  }
  function labelText(node) {
    if (!node) return "";
    var out = "";
    (function w(n){ var lb=n.getComponent&&n.getComponent(cc.Label);
      if(lb&&lb.string) out+=(out?" ":"")+lb.string;
      (n.children||[]).forEach(w); })(node);
    return out;
  }
  function simTouch(node) {
    if (!node || !node.isValid) return false;
    try {
      var wp = node.convertToWorldSpaceAR ? node.convertToWorldSpaceAR(cc.v2(0,0)) : cc.v2(0,0);
      var t = new cc.Touch(wp.x, wp.y, 0);
      var e1 = new cc.Event.EventTouch([t], false);
      e1.type = cc.Node.EventType.TOUCH_START; e1.touch = t;
      node.dispatchEvent(e1);
      var e2 = new cc.Event.EventTouch([t], false);
      e2.type = cc.Node.EventType.TOUCH_END; e2.touch = t;
      node.dispatchEvent(e2);
      return true;
    } catch (e) { return false; }
  }
  function fireBtn(node) {
    if (simTouch(node)) return;
    try {
      var btn = node && node.isValid && node.getComponent(cc.Button);
      if (btn && btn.clickEvents && btn.clickEvents.length)
        cc.Component.EventHandler.emitEvents(btn.clickEvents, { target: node, currentTarget: node });
      else if (node && node.isValid) node.emit("click", btn || node);
    } catch (e) {}
  }

  /* ============ estado ============ */
  var current = null;        // { kind, root }
  var parked = [];           // instancias nativas estacionadas [{node,kind}]
  function hideDom(){
    if (current && current.root && current.root.isValid) current.root._mbShowing = false;
    overlay.style.display = "none"; current = null;
  }
  function park(node, kind){
    node._mbKind = kind;
    if (node.x < PARK_X/2) node.x += PARK_X;
    parked.push({ node: node, kind: kind });
  }

  /* ============ SETTINGS (100% nosso) ============ */
  function renderSettings(root) {
    var title = labelText(findDesc(root, "Title")) || "Settings";
    var labels = { Music: "BGM", Sound: "SFX" };
    ["Music","Sound"].forEach(function(nm){
      var br = findDesc(root, nm);
      var tx = br && labelText(findDesc(br, "Text"));
      if (tx) labels[nm] = tx.trim();
    });
    document.getElementById("mbHead").textContent = title;
    var body = document.getElementById("mbBody"); body.innerHTML = "";
    [["Music","bgm","\uD83C\uDFB5"],["Sound","sfx","\uD83D\uDD0A"]].forEach(function(cfg){
      var nm=cfg[0], key=cfg[1], ico=cfg[2];
      var row = document.createElement("div"); row.className = "mbRow";
      row.innerHTML = '<div class="mbRowIco">'+ico+'</div><div class="mbRowLbl">'+labels[nm]+
        '</div><div class="mbSw'+(prefs[key]?" on":"")+'"><i></i></div>';
      var sw = row.querySelector(".mbSw");
      sw.onclick = function(){
        prefs[key] = !prefs[key];
        sw.classList.toggle("on", prefs[key]);
        savePrefs(); applyAudio();
      };
      body.appendChild(row);
    });
  }

  /* ============ BOOSTER ============ */
  function renderBooster(root) {
    var title=findDesc(root,"Title"), des=findDesc(root,"Des");
    var buy=findDesc(root,"Buy",cc.Button)||findDesc(root,"Coin",cc.Button);
    var get=findDesc(root,"Get",cc.Button)||findDesc(root,"GetItem",cc.Button);
    var icon=findDesc(root,"Icon");

    document.getElementById("mbHead").textContent = labelText(title) || "Booster";
    var body=document.getElementById("mbBody");
    body.innerHTML='<div id="mbIconWrap"><div id="mbIcon"></div></div><div id="mbDes"></div><div id="mbBtns">'
      +'<button id="mbBuy"><span class="mbCoin"></span><span id="mbBuyTxt"></span></button>'
      +'<button id="mbGet"><span class="mbPlay"></span><span id="mbGetTxt"></span></button></div>';
    document.getElementById("mbDes").textContent = labelText(des) || "";
    document.getElementById("mbBuyTxt").textContent = (labelText(buy).replace(/[^\d]/g,"")) || "50";
    document.getElementById("mbGetTxt").textContent = (labelText(get)||"Get").trim().split(/\s+/)[0];
    document.getElementById("mbBuy").style.display = buy ? "" : "none";
    document.getElementById("mbGet").style.display = get ? "" : "none";

    var iconDiv=document.getElementById("mbIcon");
    try {
      var sp=icon&&icon.getComponent(cc.Sprite), sf=sp&&sp.spriteFrame, tex=sf&&sf.getTexture();
      if(tex&&tex.nativeUrl){
        var r=sf.getRect(), rot=sf.isRotated();
        var w=rot?r.height:r.width, h=rot?r.width:r.height;
        var sc=Math.min(120/w,120/h);
        iconDiv.style.width=w+"px"; iconDiv.style.height=h+"px";
        iconDiv.style.background="url('"+tex.nativeUrl+"') no-repeat -"+r.x+"px -"+r.y+"px";
        iconDiv.style.transform="scale("+sc+")"+(rot?" rotate(-90deg)":"");
      } else { iconDiv.textContent="\uD83D\uDD28"; iconDiv.style.fontSize="84px"; }
    } catch(e){ iconDiv.textContent="\uD83D\uDD28"; iconDiv.style.fontSize="84px"; }

    document.getElementById("mbBuy").onclick=function(){ fireBtn(buy); };
    document.getElementById("mbGet").onclick=function(){ fireBtn(get); };
  }

  /* ============ SHOP (GetCoin) ============ */
  function cssSpriteInto(div, node, box) { // recorta sprite real p/ CSS
    try {
      var sp = node && node.getComponent(cc.Sprite), sf = sp && sp.spriteFrame, tex = sf && sf.getTexture();
      if (tex && tex.nativeUrl) {
        var r = sf.getRect(), rot = sf.isRotated();
        var w = rot ? r.height : r.width, h = rot ? r.width : r.height;
        var sc = Math.min(box / w, box / h);
        div.style.width = w + "px"; div.style.height = h + "px";
        div.style.background = "url('" + tex.nativeUrl + "') no-repeat -" + r.x + "px -" + r.y + "px";
        div.style.transform = "scale(" + sc + ")" + (rot ? " rotate(-90deg)" : "");
        div.style.transformOrigin = "center";
        return true;
      }
    } catch (e) {}
    return false;
  }
  function renderShop(root) {
    document.getElementById("mbHead").textContent = labelText(findDesc(root, "Title")) || "Shop";
    var body = document.getElementById("mbBody"); body.innerHTML = "";
    [["FreeContent", true], ["FirstContent", false], ["SecondContent", false]].forEach(function (cfg) {
      var row = findDesc(root, cfg[0]); if (!row || !row.activeInHierarchy) return;
      var buy = findDesc(row, "Buy", cc.Button);
      var icon = findDesc(row, "Icon");
      var texts = [];
      (function w(n){ var lb=n.getComponent&&n.getComponent(cc.Label);
        if(lb&&lb.string&&(!buy||!isDescOf(n,buy))) texts.push(lb.string.trim());
        (n.children||[]).forEach(w); })(row);
      var btnTxt = buy ? (labelText(buy).trim() || "Get") : "Get";
      var main = texts.length ? texts[0] : "Coins";
      var sub  = texts.slice(1).join(" \u00b7 ");

      var el = document.createElement("div"); el.className = "mbShopRow";
      el.innerHTML = '<div class="mbShopIco"><div></div></div>' +
        '<div class="mbShopTxt">' + main + (sub ? '<small>' + sub + '</small>' : '') + '</div>' +
        '<button class="mbShopBtn' + (cfg[1] ? ' free' : '') + '"><span class="mbPlay"></span><span>' + btnTxt + '</span></button>';
      if (!cssSpriteInto(el.querySelector(".mbShopIco div"), icon, 52)) {
        var d = el.querySelector(".mbShopIco div"); d.textContent = "\uD83D\uDC8E"; d.style.fontSize = "38px";
      }
      el.querySelector(".mbShopBtn").onclick = function () { fireBtn(buy); };
      body.appendChild(el);
    });
  }
  function isDescOf(n, anc) { var p = n; while (p) { if (p === anc) return true; p = p.parent; } return false; }

  /* ============ mostrar/fechar ============ */
  function show(root, kind) {
    if (kind === "settings") renderSettings(root);
    else if (kind === "shop") renderShop(root);
    else renderBooster(root);
    root._mbShowing = true;
    if (root.x < PARK_X/2) root.x += PARK_X; // garante estacionado
    overlay.style.display = "flex";
    current = { kind: kind, root: root };
    console.log(TAG, kind, "aberto (DOM)");
  }
  function closeCurrent() {
    if (!current) return;
    var kind = current.kind, root = current.root;
    var back = root && root.isValid && findDesc(root, "Back", cc.Button);
    hideDom();
    fireBtn(back); // deixa o jogo fechar/limpar pelo fluxo normal
    setTimeout(function(){
      if (root && root.isValid && root.activeInHierarchy) {
        console.warn(TAG, kind, "back nativo nao fechou; forcando active=false");
        try { root.active = false; } catch (e) {}
      }
    }, 800);
  }
  document.addEventListener("click", function (ev) {
    if (!current) return;
    if (ev.target.id === "mbX" || ev.target === overlay) closeCurrent();
  });

  /* ============ detecção ============ */
  function hasMaskChild(n){
    var c=n.children||[];
    for(var i=0;i<c.length;i++) if(c[i].name==="Mask") return true;
    return false;
  }
  function classify(n){
    if (findDesc(n,"Music") && findDesc(n,"Sound")) return "settings";
    if (findDesc(n,"FreeContent") || (findDesc(n,"FirstContent") && findDesc(n,"SecondContent"))) return "shop";
    if (findDesc(n,"Des") && (findDesc(n,"Get",cc.Button)||findDesc(n,"GetItem",cc.Button))) return "booster";
    return null;
  }

  /* ============ preload: elimina o "%" no 1o clique ============ */
  // Os prefabs dos modais carregam sob demanda (o jogo mostra % durante o load).
  // Pre-carregamos o bundle 'local' em background: no clique, ja esta em cache.
  var preloadState = 0; // 0=pendente 1=rodando 2=feito
  var bootSeenAt = 0;
  function preloadAll() {
    if (preloadState || !cc.assetManager || !cc.assetManager.getBundle) return;
    var b = cc.assetManager.getBundle("local");
    if (!b) return;
    preloadState = 1;
    console.log(TAG, "pre-carregando bundle local em background...");
    b.loadDir("", function (err) {
      preloadState = 2;
      console.log(TAG, err ? "preload com erros (ok, parcial)" : "preload completo — modais abrem sem loading");
    });
  }
  var hooksDone = false;
  function inspectNew(child) {
    try {
      if (!child || child._mbKind || !hasMaskChild(child)) return;
      var kind = classify(child);
      if (!kind) return;
      park(child, kind);            // mesmo tick: nunca renderiza na tela
      setTimeout(function () {      // espera o controller preencher labels
        if (child.isValid && child.activeInHierarchy && !current) show(child, kind);
      }, 60);
    } catch (e) {}
  }
  function installHooks() {
    if (hooksDone || !window.cc || !cc.Node) return;
    hooksDone = true;
    // 1) novas instancias: addChild
    var oAdd = cc.Node.prototype.addChild;
    cc.Node.prototype.addChild = function (child) {
      var r = oAdd.apply(this, arguments);
      inspectNew(child);
      return r;
    };
    // 2) reabertura de instancia cacheada: active = true
    var d = Object.getOwnPropertyDescriptor(cc.Node.prototype, "active");
    if (d && d.set) {
      Object.defineProperty(cc.Node.prototype, "active", {
        configurable: true,
        get: d.get,
        set: function (v) {
          d.set.call(this, v);
          if (v && this._mbKind && !this._mbShowing) {
            var n = this, kind = this._mbKind;
            if (n.x < PARK_X / 2) n.x += PARK_X; // garante fora da tela ja
            setTimeout(function () {
              if (n.isValid && n.activeInHierarchy && !current) show(n, kind);
            }, 60);
          }
        }
      });
    }
    console.log(TAG, "hooks instalados (addChild/active)");
  }

  setInterval(function () {
    try {
      if (!window.cc || !cc.director || !cc.director.getScene) return;
      installHooks();
      applyAudio();
      var scene = cc.director.getScene(); if (!scene) return;
      // dispara o preload ~2.5s depois do jogo subir (nao concorre com o boot)
      if (!bootSeenAt) bootSeenAt = Date.now();
      else if (preloadState === 0 && Date.now() - bootSeenAt > 2500) preloadAll();

      // modal DOM aberto: fecha se o nativo sumiu; mantem estacionado
      if (current) {
        var r = current.root;
        if (!r || !r.isValid || !r.activeInHierarchy) { hideDom(); return; }
        if (r.x < PARK_X / 2) r.x += PARK_X; // reancora se o jogo reposicionar
        return;
      }
      // fallback (caso os hooks percam algo)
      for (var i = parked.length - 1; i >= 0; i--) {
        var p = parked[i];
        if (!p.node || !p.node.isValid) { parked.splice(i,1); continue; }
        if (p.node.activeInHierarchy && !p.node._mbShowing) { show(p.node, p.kind); return; }
      }
      (function walk(n) {
        if (!n || !n.activeInHierarchy || current) return;
        if (!n._mbKind && hasMaskChild(n)) {
          var kind = classify(n);
          if (kind) { park(n, kind); show(n, kind); return; }
        }
        var c = n.children || [];
        for (var i = 0; i < c.length; i++) walk(c[i]);
      })(scene);
    } catch (e) {}
  }, 250);

  console.log(TAG, "carregado");
})();
