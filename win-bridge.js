/* win-bridge.js - tela de vitoria (roleta) customizada -- substitui o popup nativo 'er'
   Tema "card claro/creme" (modal-theme.css). Roleta/premios/botoes preservados. */
(function(){
  (function(){var st=document.createElement('style');st.textContent='#lcOverlay,#lcOverlay *{overflow:visible !important}#lcOverlay button{overflow:hidden !important}';document.head.appendChild(st);})();

  // ===== AJUSTES (recompensas das 5 celulas) =====
  var CFG = {
    cells: [
      {kind:'coins', amount:250},   // 0 = moedas (r1)
      {kind:'amp', id:1, qty:2},    // 1 = Rainbow Gates (r2)
      {kind:'amp', id:2, qty:1},    // 2 = Hammer (r3)
      {kind:'amp', id:3, qty:1},    // 3 = Color Delete (r4)
      {kind:'coins', amount:70}     // 4 = moedas (r5)
    ],
    spinMs: 85,        // velocidade da roleta
    claimHoldMs: 950   // tempo mostrando o premio antes de voltar ao mapa
  };
  // ===============================================
  var RING="inset 0 0 0 3px #ffcf2e, 0 0 12px rgba(255,190,20,0.7)", RING_BG="rgba(255,224,140,0.55)";
  var WON ="inset 0 0 0 3px #45c531, 0 0 14px rgba(80,190,45,0.8)",  WON_BG ="rgba(180,235,150,0.6)";

  // ---- icones dos premios ----
  var DIAMOND='<svg width="36" height="33" viewBox="0 0 48 44" style="display:block;"><polygon points="15,5 33,5 46,17 24,42 2,17" fill="#85DBFF"/><polygon points="15,5 33,5 37,17 11,17" fill="#D8F6FF"/><polygon points="2,17 11,17 24,42" fill="#3FB3F0"/><polygon points="46,17 37,17 24,42" fill="#1780C8"/><polygon points="11,17 37,17 24,42" fill="#60C4F6"/><g fill="none" stroke="#0A548C" stroke-width="1.2" stroke-linejoin="round"><polygon points="15,5 33,5 46,17 24,42 2,17"/><path d="M11,17 L37,17 M15,5 L11,17 M33,5 L37,17 M11,17 L24,42 M37,17 L24,42"/></g><circle cx="20" cy="10" r="1.5" fill="#fff"/></svg>';
  var BALL='<span style="position:relative; width:36px; height:36px; border-radius:50%; background: conic-gradient(#ff4d6d, #ff9f1c, #ffe14d, #4dd87b, #38b6ff, #9b6dff, #ff4d6d); box-shadow: inset 0 -3px 5px rgba(40,20,80,0.35); animation: lcBall 2.4s ease-in-out infinite; display:inline-block;"><span style="position:absolute; inset:5px; border-radius:50%; background: radial-gradient(circle at 38% 30%, rgba(255,255,255,0.95), rgba(150,210,255,0.55) 40%, transparent 75%);"></span></span>';
  var HAMMER='<svg width="38" height="38" viewBox="0 0 64 64" style="display:block;"><rect x="27.5" y="26" width="10" height="36" rx="5" transform="rotate(34 32.5 44)" fill="#e23a2c"></rect><rect x="30" y="28" width="3.5" height="32" rx="1.75" transform="rotate(34 32.5 44)" fill="#ffd83b"></rect><g transform="rotate(34 31 21)"><rect x="11" y="11" width="40" height="20" rx="6" fill="#d7dde3"></rect><rect x="11" y="11" width="40" height="8" rx="4" fill="#eef2f5"></rect><rect x="25" y="11" width="10" height="20" fill="#e23a2c"></rect><rect x="35" y="11" width="7" height="20" fill="#ffd83b"></rect></g></svg>';
  var MAGNET='<svg width="34" height="34" viewBox="0 0 64 64" style="display:block;"><path d="M14 47 L14 30 A18 18 0 0 1 50 30 L50 47 L38 47 L38 30 A6 6 0 0 0 26 30 L26 47 Z" fill="#e23a2c" stroke="#b0271c" stroke-width="2" stroke-linejoin="round"/><rect x="12.5" y="45" width="15" height="10" rx="2.5" fill="#d7dde3" stroke="#98a1a9" stroke-width="1.5"/><rect x="36.5" y="45" width="15" height="10" rx="2.5" fill="#d7dde3" stroke="#98a1a9" stroke-width="1.5"/></svg>';

  function cell(icon, val){
    return '<div style="flex:1 1 0; min-width:0; display:flex; flex-direction:column; align-items:center; gap:5px; padding:11px 2px; border-radius:14px; background:#f4f7fb; box-shadow: inset 0 0 0 1px rgba(38,50,74,.06);">' +
             '<span style="width:38px;height:38px;display:flex;align-items:center;justify-content:center;">'+icon+'</span>' +
             '<span style="font-weight:800; font-size:18px; color:#26324a;">'+val+'</span>' +
           '</div>';
  }

  var TPL =
  '<div style="position:relative; width:100%; max-width:380px; padding-top:46px;">' +
    // troféu + raios (acento de celebração)
    '<div style="position:absolute; z-index:5; top:-6px; left:50%; transform:translateX(-50%); width:100px; height:100px; display:flex; align-items:center; justify-content:center;">' +
      '<div style="position:absolute; width:150px; height:150px; background: conic-gradient(from 0deg, rgba(255,210,70,0.9) 0deg 8deg, transparent 8deg 30deg, rgba(255,210,70,0.9) 30deg 38deg, transparent 38deg 60deg, rgba(255,210,70,0.9) 60deg 68deg, transparent 68deg 90deg, rgba(255,210,70,0.9) 90deg 98deg, transparent 98deg 120deg, rgba(255,210,70,0.9) 120deg 128deg, transparent 128deg 150deg, rgba(255,210,70,0.9) 150deg 158deg, transparent 158deg 180deg, rgba(255,210,70,0.9) 180deg 188deg, transparent 188deg 210deg, rgba(255,210,70,0.9) 210deg 218deg, transparent 218deg 240deg, rgba(255,210,70,0.9) 240deg 248deg, transparent 248deg 270deg, rgba(255,210,70,0.9) 270deg 278deg, transparent 278deg 300deg, rgba(255,210,70,0.9) 300deg 308deg, transparent 308deg 330deg, rgba(255,210,70,0.9) 330deg 338deg, transparent 338deg 360deg); -webkit-mask: radial-gradient(circle, transparent 42px, #000 44px, #000 70px, transparent 74px); mask: radial-gradient(circle, transparent 42px, #000 44px, #000 70px, transparent 74px); opacity:0.85; animation: lcRays 26s linear infinite;"></div>' +
      '<svg width="92" height="92" viewBox="0 0 64 64" style="display:block; filter: drop-shadow(0 4px 5px rgba(20,50,90,0.35)); animation: lcStar 2.6s ease-in-out infinite;">' +
        '<path d="M32 3l8.2 16.6L58.5 22l-13.2 12.9L48.4 53 32 44.4 15.6 53l3.1-18.1L5.5 22l18.3-2.4z" fill="#ffd83b" stroke="#e6a90f" stroke-width="2.5" stroke-linejoin="round"></path>' +
        '<path d="M32 11l4.4 9 9.9 1.4-7.2 7 1.7 9.9L32 42.6z" fill="#fff" opacity="0.4"></path>' +
      '</svg>' +
    '</div>' +

    '<div class="mm-card" style="width:100%; max-width:380px;">' +
      '<button class="mm-close" onclick="window.__lcWin._close()" aria-label="Close"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"></line><line x1="19" y1="5" x2="5" y2="19"></line></svg></button>' +

      '<div class="mm-eyebrow" style="margin-top:20px;">You won</div>' +
      '<div class="mm-title">Level Completed</div>' +
      '<div style="text-align:center; font-weight:700; font-size:13px; color:#9aa4b5; margin:-8px 0 14px;">Rewards earned</div>' +

      // barra de premios + overlay seletor da roleta
      '<div style="position:relative; display:flex; justify-content:space-between; gap:6px;">' +
        '<div style="position:absolute; z-index:4; inset:0; display:flex; gap:6px; pointer-events:none;">' +
          '<div id="lcCell0" style="flex:1; border-radius:14px; transition: box-shadow .08s, background .08s;"></div>' +
          '<div id="lcCell1" style="flex:1; border-radius:14px; transition: box-shadow .08s, background .08s;"></div>' +
          '<div id="lcCell2" style="flex:1; border-radius:14px; transition: box-shadow .08s, background .08s;"></div>' +
          '<div id="lcCell3" style="flex:1; border-radius:14px; transition: box-shadow .08s, background .08s;"></div>' +
          '<div id="lcCell4" style="flex:1; border-radius:14px; transition: box-shadow .08s, background .08s;"></div>' +
        '</div>' +
        cell(DIAMOND,'250') + cell(BALL,'2') + cell(HAMMER,'1') + cell(MAGNET,'1') + cell(DIAMOND,'70') +
      '</div>' +

      // botoes Claim / Continue
      '<div style="display:flex; gap:10px; margin-top:16px;">' +
        '<button class="mm-btn" disabled style="flex:1; opacity:.45; filter:grayscale(1); cursor:default; box-shadow:none;">' +
          '<span class="amt">Soon</span>' +
        '</button>' +
        '<button class="mm-btn amber" onclick="window.__lcWin._continue()" style="flex:1;"><span class="amt">Next</span></button>' +
      '</div>' +
    '</div>' +
  '</div>';

  var KF="@keyframes lcBall { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }\n@keyframes lcRays { to { transform: rotate(360deg); } }\n@keyframes lcStar { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }";
  var overlay=null, scene=null, timer=null, claiming=false;
  var st={selected:0,running:true,won:null};

  function ensureStyle(){
    if(document.getElementById('lcStyle'))return;
    var s=document.createElement('style'); s.id='lcStyle';
    s.textContent=KF +
      "\n@keyframes lcSpin{to{transform:rotate(360deg)}}" +
      "\n#lcAdLoading{position:fixed;inset:0;z-index:100001;display:none;align-items:center;justify-content:center;flex-direction:column;gap:14px;background:rgba(14,26,48,.72);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);font-family:'Baloo 2',system-ui,sans-serif;}" +
      "\n#lcAdLoading .sp{width:44px;height:44px;border-radius:50%;border:4px solid rgba(255,255,255,.25);border-top-color:#63d64a;animation:lcSpin .8s linear infinite;}" +
      "\n#lcAdLoading .t{color:#fff;font-weight:800;font-size:17px;}" +
      "\n#lcToast{position:fixed;left:50%;bottom:14%;transform:translateX(-50%);z-index:100002;display:none;padding:11px 18px;border-radius:14px;background:rgba(20,32,56,.94);color:#fff;font-family:'Baloo 2',system-ui,sans-serif;font-weight:700;font-size:14px;}";
    document.head.appendChild(s);
  }

  /* ---- overlay de loading do anuncio + toast ---- */
  var adEl=null, adShownAt=0, toastEl=null, toastTmr=null;
  function adLoadingShow(){
    if(!adEl){
      adEl=document.createElement('div'); adEl.id='lcAdLoading';
      adEl.innerHTML='<div class="sp"></div><div class="t">Loading ad&hellip;</div>';
      document.body.appendChild(adEl);
    }
    adEl.style.display='flex'; adShownAt=Date.now();
  }
  function adLoadingHide(cb){
    if(!adEl){ if(cb)cb(); return; }
    var wait=Math.max(0,350-(Date.now()-adShownAt));
    setTimeout(function(){ adEl.style.display='none'; if(cb)cb(); },wait);
  }
  function toast(msg){
    if(!toastEl){ toastEl=document.createElement('div'); toastEl.id='lcToast'; document.body.appendChild(toastEl); }
    toastEl.textContent=msg; toastEl.style.display='block';
    if(toastTmr)clearTimeout(toastTmr);
    toastTmr=setTimeout(function(){ toastEl.style.display='none'; },2200);
  }
  function ensureOverlay(){
    ensureStyle();
    if(overlay)return;
    overlay=document.createElement('div'); overlay.id='lcOverlay'; overlay.className='mm-overlay';
    overlay.innerHTML='<div id="lcModal" style="position:relative; width:100%; max-width:380px;">'+TPL+'</div>';
    document.body.appendChild(overlay);
    window.addEventListener('resize',fitModal);
  }
  function fitModal(){
    var m=document.getElementById('lcModal');
    if(!m||!overlay||overlay.style.display==='none')return;
    m.style.transform='none';
    var vw=window.innerWidth,vh=window.innerHeight,w=m.offsetWidth,h=m.offsetHeight;
    var over=52,margin=14;
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
  function renderRings(){
    for(var i=0;i<5;i++){
      var c=document.getElementById('lcCell'+i); if(!c)continue;
      if(st.won===i){c.style.boxShadow=WON;c.style.background=WON_BG;}
      else if(st.won===null&&i===st.selected){c.style.boxShadow=RING;c.style.background=RING_BG;}
      else {c.style.boxShadow='';c.style.background='';}
    }
  }
  function grant(i){
    var r=CFG.cells[i]; if(!r||!scene||!scene.saveMngr)return;
    try{
      if(r.kind==='coins') scene.saveMngr.changeCoins(r.amount);
      else if(r.kind==='amp') scene.saveMngr.addAmplifiersSave(r.id,r.qty);
    }catch(e){console.warn('lcWin grant',e);}
  }
  function proceed(){
    if(timer){clearInterval(timer);timer=null;}
    if(overlay)overlay.style.display='none';
    var sc=scene; scene=null;
    if(!sc)return;
    try{ sc.isEndScreenShow=false; sc.closeEnd().closeLevel(true,true,true); }catch(e){console.warn('lcWin proceed',e);}
  }
  window.__lcWin={
    open:function(s){
      scene=s; ensureOverlay(); claiming=false;
      st={selected:0,running:true,won:null}; renderRings();
      overlay.style.display='flex'; fitModal(); setTimeout(fitModal,60); setTimeout(fitModal,250);
      if(timer)clearInterval(timer);
      timer=setInterval(function(){ if(!st.running)return; st.selected=(st.selected+1)%5; renderRings(); },CFG.spinMs);
    },
    _claim:function(){
      if(!st.running || claiming) return;
      claiming=true;
      // trava a roleta no premio sorteado ANTES do anuncio (o jogador ve o que vai levar)
      st.running=false; st.won=st.selected; renderRings();
      if(timer){clearInterval(timer); timer=null;}
      adLoadingShow();

      var settle=function(ok){
        adLoadingHide(function(){
          claiming=false;
          if(ok){
            grant(st.won);
            setTimeout(proceed,CFG.claimHoldMs);
          }else{
            // fail-closed: sem premio. Devolve a roleta pro jogador tentar de novo;
            // o botao Continue continua livre e segue a fase sem nada.
            toast('Ad unavailable - no reward');
            st.won=null; st.running=true; renderRings();
            timer=setInterval(function(){ if(!st.running)return; st.selected=(st.selected+1)%5; renderRings(); },CFG.spinMs);
          }
        });
      };

      // Sem anuncio: o Claim concede o premio da roleta direto (recompensa
      // de fim de fase, nao uma venda). Mantido assincrono pro fluxo/spinner.
      setTimeout(function(){ settle(true); }, 300);
    },
    _continue:function(){ if(claiming)return; proceed(); },
    _close:function(){ if(claiming)return; proceed(); }
  };
})();
