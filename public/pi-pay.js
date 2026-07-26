/* ============================================================================
   pi-pay.js — helper reutilizável de Pi (autenticação + pagamento U2A)
   Independente de game. Expõe window.PiPay.

   REQUISITOS
   - Rodar dentro do Pi Browser (auth/pagamento reais).
   - Carregar o SDK oficial ANTES deste arquivo:
       <script src="https://sdk.minepi.com/pi-sdk.js"></script>
       <script src="pi-pay.js"></script>
   - Backend com 3 rotas (mesmo domínio por padrão):
       POST /api/pi-approve   { paymentId }
       POST /api/pi-complete  { paymentId, txid }
       POST /api/pi-cancel    { paymentId }
     (código pronto na pasta backend/ — Worker ou Pages Functions)

   USO
     PiPay.init({ sandbox:false, onOverlay:function(on){ ... } });
     PiPay.pay(5, "Meu Game — 100 gemas", { type:"gems", pack:100 })
       .then(function(){ crediteRecompensa(); })   // pagamento COMPLETO
       .catch(function(e){ naoCredite(); });        // cancelou/falhou

   FLUXO U2A (User-to-App), oficial da Pi:
     createPayment -> onReadyForServerApproval  -> POST /api/pi-approve
                   -> (usuário assina)          -> onReadyForServerCompletion
                   -> POST /api/pi-complete     -> SÓ ENTÃO resolve a Promise
   Fora do Pi Browser em dev (localhost/file) o pagamento é SIMULADO, pra testar UI.
   ============================================================================ */
(function (global) {
  var PI = {
    apiBase: '',                       // '' = mesma origem; ou 'https://api.seu-backend.com'
    sandbox: false,                    // true só pra testar no Sandbox da Pi
    scopes: ['username', 'payments'],  // 'payments' é obrigatório pra cobrar
    onOverlay: null,                   // function(bool) opcional: liga/desliga spinner
    _auth: null, _loginP: null, _busy: false, last: null, mode: null
  };

  function post(path, body) {
    return fetch(PI.apiBase + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        j = j || {}; j.__status = r.status; j.__ok = r.ok; return j;
      });
    });
  }

  // Um pagamento anterior ficou pendente: completa (se tem txid) ou cancela.
  function handleIncomplete(payment) {
    try {
      var id = payment && payment.identifier;
      var txid = payment && payment.transaction && payment.transaction.txid;
      console.warn('[pi] pagamento incompleto:', id, 'txid=' + (txid || '-'));
      if (!id) return;
      if (txid) post('/api/pi-complete', { paymentId: id, txid: txid });
      else post('/api/pi-cancel', { paymentId: id });
    } catch (e) {}
  }

  // Configura. Chame uma vez no boot. opts sobrescreve os defaults acima.
  PI.init = function (opts) {
    opts = opts || {};
    for (var k in opts) if (opts.hasOwnProperty(k)) PI[k] = opts[k];
    try { if (global.Pi && Pi.init) Pi.init({ version: '2.0', sandbox: !!PI.sandbox }); }
    catch (e) { console.warn('[pi] init falhou:', e); }
    return PI;
  };

  // Login (cacheado 1x por sessão). Retorna Promise<authResult|null>.
  PI.login = function () {
    if (PI._loginP) return PI._loginP;
    PI._loginP = (function () {
      try {
        if (!global.Pi || !Pi.authenticate) return Promise.resolve(null);
        return Pi.authenticate(PI.scopes, handleIncomplete).then(function (a) {
          PI._auth = a;
          console.log('[pi] auth OK:', a && a.user && a.user.username);
          return a;
        }).catch(function (e) { console.warn('[pi] auth falhou:', e); return null; });
      } catch (e) { return Promise.resolve(null); }
    })();
    return PI._loginP;
  };

  // Pagamento. Resolve SÓ quando o /api/pi-complete confirma (ou simulado no dev).
  PI.pay = function (amount, memo, metadata) {
    return new Promise(function (resolve, reject) {
      if (PI._busy) { reject(new Error('busy')); return; }
      PI._busy = true; if (PI.onOverlay) try { PI.onOverlay(true); } catch (e) {}
      function settle(ok, info) {
        PI._busy = false; if (PI.onOverlay) try { PI.onOverlay(false); } catch (e) {}
        PI.last = { ok: ok, info: info, mode: PI.mode };
        if (ok) resolve(info || {}); else reject(info || new Error('fail'));
      }

      var isDev = /^(file|content):/.test(location.protocol) ||
                  /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
      var inPi = /PiBrowser/i.test(navigator.userAgent || '');

      // Sem SDK: dev -> simula sucesso; produção -> falha (fail-closed)
      if (!(global.Pi && Pi.createPayment)) {
        if (isDev && !inPi) {
          PI.mode = 'fallback';
          console.warn('[pi] pay: FALLBACK DEV (SIMULADO) ' + amount + 'π "' + memo + '"');
          setTimeout(function () { settle(true, { simulated: true, amount: amount }); }, 600);
        } else {
          PI.mode = 'real';
          console.warn('[pi] pay: SDK ausente -> FALHA');
          settle(false, new Error('Pi SDK ausente'));
        }
        return;
      }

      PI.mode = 'real';
      PI.login().then(function (auth) {
        if (!auth) { settle(false, new Error('sem login Pi')); return; }
        try {
          Pi.createPayment({ amount: amount, memo: memo || '', metadata: metadata || {} }, {
            onReadyForServerApproval: function (pid) {
              console.warn('[pi] approval:', pid);
              post('/api/pi-approve', { paymentId: pid })
                .then(function (res) { console.warn('[pi] approve resp ' + (res && res.__status) + ':', JSON.stringify(res)); })
                .catch(function (e) { console.warn('[pi] approve FALHOU (rede/404):', String(e)); });
            },
            onReadyForServerCompletion: function (pid, txid) {
              console.warn('[pi] completion:', pid, 'txid=' + txid);
              post('/api/pi-complete', { paymentId: pid, txid: txid })
                .then(function (res) {
                  console.warn('[pi] complete resp ' + (res && res.__status) + ':', JSON.stringify(res));
                  if (res && res.__ok) settle(true, { paymentId: pid, txid: txid });
                  else settle(false, new Error('complete http ' + (res && res.__status)));
                })
                .catch(function (e) { console.warn('[pi] complete FALHOU (rede):', String(e)); settle(false, e); });
            },
            onCancel: function (pid) { console.warn('[pi] cancel:', pid); settle(false, { cancelled: true }); },
            onError: function (err) { console.warn('[pi] error:', err); settle(false, err || new Error('erro pagamento')); }
          });
        } catch (e) { settle(false, e); }
      });
    });
  };

  global.PiPay = PI;
})(window);
