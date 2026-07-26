/* ============================================================
   BOOSTER UNLOCK bridge (Color Block Jam - estudo)
   Substitui a janela nativa "Congratulations / new booster" (classe Er).
   Estilo "card claro/creme" (modal-theme.css), com acento de celebração.
   ============================================================ */
var BU_TITLE = "New Booster!";
var BU_CFG = {
  1: { name: "Rainbow Gates", desc: "Gives the ability to destroy any block in any open gates" },
  2: { name: "Hammer",        desc: "Smashes any block you tap" },
  3: { name: "Color Delete",  desc: "Clears every block sharing the same color" }
};
var BU_ICONS = {
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
    3: // color delete (magnet — igual ao modal de compra)
      '<div style="position:relative; width:72px; height:72px; display:flex; align-items:center; justify-content:center; animation: rgPulse 2.4s ease-in-out infinite;">' +
        '<svg width="62" height="62" viewBox="0 0 64 64" style="display:block; filter: drop-shadow(0 3px 4px rgba(20,50,90,0.3));">' +
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

(function () {
  "use strict";
  (function(){var st=document.createElement('style');st.textContent='#buOverlay,#buOverlay *{overflow:visible !important}#buOverlay button{overflow:hidden !important}';document.head.appendChild(st);})();

  var overlay=null, sceneRef=null;
  var RAYS="conic-gradient(from 0deg, rgba(255,210,70,0.9) 0deg 8deg, transparent 8deg 30deg, rgba(255,210,70,0.9) 30deg 38deg, transparent 38deg 60deg, rgba(255,210,70,0.9) 60deg 68deg, transparent 68deg 90deg, rgba(255,210,70,0.9) 90deg 98deg, transparent 98deg 120deg, rgba(255,210,70,0.9) 120deg 128deg, transparent 128deg 150deg, rgba(255,210,70,0.9) 150deg 158deg, transparent 158deg 180deg, rgba(255,210,70,0.9) 180deg 188deg, transparent 188deg 210deg, rgba(255,210,70,0.9) 210deg 218deg, transparent 218deg 240deg, rgba(255,210,70,0.9) 240deg 248deg, transparent 248deg 270deg, rgba(255,210,70,0.9) 270deg 278deg, transparent 278deg 300deg, rgba(255,210,70,0.9) 300deg 308deg, transparent 308deg 330deg, rgba(255,210,70,0.9) 330deg 338deg, transparent 338deg 360deg)";
  var MASK="radial-gradient(circle, transparent 42px, #000 44px, #000 70px, transparent 74px)";

  function css(){
    if(document.getElementById('buCss'))return;
    var st=document.createElement('style'); st.id='buCss';
    st.textContent=
      '@keyframes rgPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}'+
      '@keyframes buRays{to{transform:rotate(360deg)}}'+
      '@keyframes buStar{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}';
    document.head.appendChild(st);
  }

  function ensureOverlay(){
    css(); if(overlay)return;
    overlay=document.createElement('div'); overlay.id='buOverlay'; overlay.className='mm-overlay';
    document.body.appendChild(overlay);
  }

  function modalHTML(id){
    var c=BU_CFG[id]||{name:"Booster",desc:""};
    var icon=BU_ICONS[id]||"";
    return ''+
    '<div id="buModal" style="position:relative; width:100%; max-width:360px; padding-top:46px;">'+
      // estrela + raios (acento de celebração)
      '<div style="position:absolute; z-index:5; top:-6px; left:50%; transform:translateX(-50%); width:100px; height:100px; display:flex; align-items:center; justify-content:center;">'+
        '<div style="position:absolute; width:150px; height:150px; background: '+RAYS+'; -webkit-mask: '+MASK+'; mask: '+MASK+'; opacity:0.85; animation: buRays 26s linear infinite;"></div>'+
        '<svg width="92" height="92" viewBox="0 0 64 64" style="display:block; filter: drop-shadow(0 4px 5px rgba(20,50,90,0.35)); animation: buStar 2.6s ease-in-out infinite;">'+
          '<path d="M32 3l8.2 16.6L58.5 22l-13.2 12.9L48.4 53 32 44.4 15.6 53l3.1-18.1L5.5 22l18.3-2.4z" fill="#ffd83b" stroke="#e6a90f" stroke-width="2.5" stroke-linejoin="round"></path>'+
          '<path d="M32 11l4.4 9 9.9 1.4-7.2 7 1.7 9.9L32 42.6z" fill="#fff" opacity="0.4"></path>'+
        '</svg>'+
      '</div>'+
      // card creme
      '<div class="mm-card" style="width:100%; max-width:360px;">'+
        '<button class="mm-close" onclick="window.__boosterUnlock.close()" aria-label="Close"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"></line><line x1="19" y1="5" x2="5" y2="19"></line></svg></button>'+
        '<div class="mm-eyebrow" style="margin-top:20px;">Unlocked</div>'+
        '<div class="mm-title">'+BU_TITLE+'</div>'+
        '<div class="mm-iconwrap"><div class="mm-disc" style="--mm-halo:#e3f0ff; --mm-halo2:#cfe6ff; --mm-halo-in:rgba(40,110,190,.16); --mm-halo-out:rgba(40,110,190,.4);">'+icon+'</div></div>'+
        '<div style="text-align:center; font-weight:700; font-size:14px; color:#9aa4b5; margin:-6px 0 2px;">You have unlocked</div>'+
        '<div style="text-align:center; font-weight:800; font-size:22px; color:#3cb52c; margin-bottom:12px;">'+c.name+'</div>'+
        '<div class="mm-desc" style="margin-bottom:20px;">'+c.desc+'</div>'+
        '<button class="mm-btn" id="buContinue"><span class="amt">Continue</span></button>'+
      '</div>'+
    '</div>';
  }

  function proceed(){
    if(overlay)overlay.style.display='none';
    try{ if(sceneRef){ sceneRef.newMechanicWindow=null; sceneRef.isNewMechanicWindow=false; } }catch(e){}
  }

  function fitModal(){
    var m=document.getElementById('buModal');
    if(!m||!overlay||overlay.style.display==='none')return;
    m.style.transform='none';
    var vw=window.innerWidth,vh=window.innerHeight,w=m.offsetWidth,h=m.offsetHeight,over=52,margin=14;
    var sc=Math.min(1,(vw-2*margin)/w,(vh-2*margin)/(h+2*over));
    m.style.transformOrigin='center center'; m.style.transform='scale('+sc+')';
    try{ var r=m.getBoundingClientRect(),top=r.top,bot=r.bottom,els=m.querySelectorAll('*');
      for(var i=0;i<els.length;i++){var b=els[i].getBoundingClientRect();if(b.height>0){if(b.top<top)top=b.top;if(b.bottom>bot)bot=b.bottom;}}
      var dy=0; if(top<margin)dy=margin-top;else if(bot>vh-margin)dy=(vh-margin)-bot;
      if(bot-top>vh-2*margin)dy=margin-top; if(dy)m.style.transform='translateY('+dy+'px) scale('+sc+')';
    }catch(e){}
  }
  window.addEventListener('resize', fitModal);

  function open(scene, id){
    /* Se o booster ja nasce desbloqueado (amplifiers.open-level <= 1), nao ha
       o que "desbloquear": o jogador comeca com ele. Sem esta guarda, os 3
       botoes batem a condicao no MESMO frame do nivel 1 e empilham 3 modais
       (todos gravam no mesmo slot scene.newMechanicWindow).
       Data-driven: se voltar open-level p/ [8,12,16], o modal volta sozinho. */
    try{
      var ol = scene.getSetting('amplifiers','open-level',[8,12,16]);
      if ((ol[id-1] || 0) <= 1) return;
    }catch(e){}

    sceneRef=scene;
    try{ scene.isNewMechanicWindow=true; scene.newMechanicWindow={ deleteAll:function(){}, updatePos:function(){}, resize:function(){}, setDepth:function(){return this;} }; }catch(e){}
    ensureOverlay();
    overlay.innerHTML=modalHTML(id);
    document.getElementById('buContinue').addEventListener('click', function(){ try{scene.sounds.play('click')}catch(e){} proceed(); });
    overlay.style.display='flex';
    fitModal(); setTimeout(fitModal,60); setTimeout(fitModal,250);
  }

  window.__boosterUnlock={ open:open, close:proceed };
})();
