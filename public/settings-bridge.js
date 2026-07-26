/* ============================================================
   SETTINGS bridge (Color Block Jam - estudo)
   Substitui a janela nativa de settings (home e gameplay).
   Home: toggles de Musica/Som. Gameplay (pause): idem + Continuar.
   API do jogo: scene.soundMngr.{soundMuteToogle,musicMuteToogle,
                isSoundMute,isMusicMute}
   ============================================================ */
(function () {
  "use strict";
  (function(){var st=document.createElement('style');st.textContent='#stOverlay,#stOverlay *{overflow:visible !important}#stOverlay button{overflow:hidden !important}';document.head.appendChild(st);})();

  var overlay = null, sceneRef = null, mode = 'home';

  function css() {
    if (document.getElementById('stCss')) return;
    var st = document.createElement('style');
    st.id = 'stCss';
    st.textContent =
      '.st-row{display:flex;align-items:center;justify-content:space-between;background:#f4f7fb;border-radius:16px;padding:13px 16px;margin-bottom:10px;box-shadow:inset 0 0 0 1px rgba(38,50,74,.06);}' +
      '.st-lbl{font-weight:700;font-size:16px;color:#3a4a63;display:flex;align-items:center;gap:9px;}' +
      '.st-sw{position:relative;width:60px;height:32px;border-radius:999px;border:none;cursor:pointer;transition:background .18s;box-shadow:inset 0 1px 3px rgba(20,40,80,.2);}' +
      '.st-sw .knob{position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(20,60,110,.35);transition:left .18s;}' +
      '.st-sw.on{background:linear-gradient(180deg,#63d64a,#3cb52c);}' +
      '.st-sw.off{background:#cdd5e0;}' +
      '.st-sw.on .knob{left:31px;}';
    document.head.appendChild(st);
  }

  function gearSVG() {
    return '<svg width="26" height="26" viewBox="0 0 24 24" fill="#1b5e9e"><path d="M19.4 13a7.6 7.6 0 0 0 .1-1l2-1.5a.6.6 0 0 0 .1-.8l-1.9-3.2a.6.6 0 0 0-.7-.3l-2.3 1a7.5 7.5 0 0 0-1.7-1l-.3-2.5a.6.6 0 0 0-.6-.5h-3.8a.6.6 0 0 0-.6.5l-.3 2.5c-.6.3-1.2.6-1.7 1l-2.3-1a.6.6 0 0 0-.7.3L2.8 9.7a.6.6 0 0 0 .1.8l2 1.5a7.6 7.6 0 0 0 0 2l-2 1.5a.6.6 0 0 0-.1.8l1.9 3.2c.2.3.5.4.7.3l2.3-1c.5.4 1.1.8 1.7 1l.3 2.5c0 .3.3.5.6.5h3.8c.3 0 .6-.2.6-.5l.3-2.5c.6-.3 1.2-.6 1.7-1l2.3 1c.3.1.6 0 .7-.3l1.9-3.2a.6.6 0 0 0-.1-.8l-2-1.5ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"/></svg>';
  }

  function modalHTML() {
    var isGame = (mode === 'game');
    return '' +
    '<div id="stModal" class="mm-card" style="width:320px;">' +
      '<button id="stCloseBtn" class="mm-close" aria-label="Close"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"></line><line x1="19" y1="5" x2="5" y2="19"></line></svg></button>' +
      '<div class="mm-eyebrow">' + (isGame ? 'Paused' : 'Options') + '</div>' +
      '<div class="mm-title">' + (isGame ? 'Pause' : 'Settings') + '</div>' +
      '<div style="margin-top:4px;">' +
        '<div class="st-row"><span class="st-lbl">&#127925; Music</span><button class="st-sw" id="stMusic"><span class="knob"></span></button></div>' +
        '<div class="st-row"><span class="st-lbl">&#128266; Sound</span><button class="st-sw" id="stSound"><span class="knob"></span></button></div>' +
      '</div>' +
      (isGame ?
        '<button class="mm-btn" id="stContinue" style="margin-top:8px;"><span class="amt" style="font-size:19px;">&#9654; Continue</span></button>' +
        '<button class="mm-btn amber" id="stHome" style="margin-top:10px;"><span class="amt" style="font-size:19px;">&#127968; Home</span></button>'
        : '') +
    '</div>';
  }

  function sm() { return sceneRef && sceneRef.soundMngr; }

  function paint(btn, on) {
    btn.classList.toggle('on', !!on);
    btn.classList.toggle('off', !on);
  }

  function refresh() {
    var m = sm(); if (!m) return;
    paint(document.getElementById('stMusic'), !m.isMusicMute());
    paint(document.getElementById('stSound'), !m.isSoundMute());
  }

  function click() { try { sceneRef.sounds.play('click'); } catch (e) {} }

  function ensureOverlay() {
    css();
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'stOverlay';
    overlay.className = 'mm-overlay';
    document.body.appendChild(overlay);
  }

  function fitModal(){
    var m=document.getElementById('stModal');
    if(!m||!overlay||overlay.style.display==='none')return;
    m.style.transform='none';
    var vw=window.innerWidth,vh=window.innerHeight,w=m.offsetWidth,h=m.offsetHeight;
    var over=40,margin=14;
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

  function open(scene, m) {
    sceneRef = scene || sceneRef;
    mode = m || 'home';
    ensureOverlay();
    overlay.innerHTML = modalHTML();
    document.getElementById('stCloseBtn').addEventListener('click', close);
    document.getElementById('stMusic').addEventListener('click', function () {
      var s = sm(); if (!s) return;
      s.musicMuteToogle(); click(); refresh();
    });
    document.getElementById('stSound').addEventListener('click', function () {
      var s = sm(); if (!s) return;
      s.soundMuteToogle(); click(); refresh();
    });
    var c = document.getElementById('stContinue');
    if (c) c.addEventListener('click', function(){ click(); close(); });
    var hbtn = document.getElementById('stHome');
    if (hbtn) hbtn.addEventListener('click', function(){
      click(); close();
      try { if (sceneRef && sceneRef.closeLevel) sceneRef.closeLevel(false, false, true); } catch (e) {}
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    refresh();
    overlay.style.display = 'flex';
    fitModal(); setTimeout(fitModal, 60); setTimeout(fitModal, 250);
  }

  function close() {
    if (overlay) overlay.style.display = 'none';
    click();
  }

  window.__settingsBridge = { open: open, close: close };
})();
