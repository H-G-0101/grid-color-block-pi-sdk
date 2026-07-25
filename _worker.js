/* ============================================================
   Cloudflare Worker — backend de pagamento Pi + servidor do jogo
   ------------------------------------------------------------
   Rotas de API (chamadas pelo pi-pay.js do cliente):
     POST /api/pi-approve   { paymentId }         -> aprova no Pi
     POST /api/pi-complete  { paymentId, txid }   -> completa no Pi
     POST /api/pi-cancel    { paymentId }         -> cancela no Pi

   Qualquer outra rota -> serve os arquivos estaticos do jogo
   (index.html, bundle, imagens...) via binding [assets].

   VARIAVEL DE AMBIENTE (Settings -> Variables and Secrets):
     PI_API_KEY = <sua Server API Key do Pi Developer Portal>
   Marque como "Secret" (encrypt). NUNCA colocar a chave no codigo.
   ============================================================ */

const PI_API = "https://api.minepi.com/v2";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ---- API de pagamento ----
    if (path.startsWith("/api/pi-")) {
      return handlePi(request, env, path);
    }

    // ---- estaticos do jogo ----
    // (binding [assets] no wrang.toml serve a pasta do projeto)
    return env.ASSETS.fetch(request);
  },
};

async function handlePi(request, env, path) {
  // CORS + metodo
  if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
  if (request.method !== "POST") return cors(json({ error: "method" }, 405));

  const key = env.PI_API_KEY;
  if (!key) return cors(json({ error: "server_not_configured" }, 500));

  let body = {};
  try { body = await request.json(); } catch (e) {}

  const auth = { Authorization: "Key " + key, "Content-Type": "application/json" };

  try {
    // /api/pi-approve  { paymentId }
    if (path === "/api/pi-approve") {
      const id = body.paymentId;
      if (!id) return cors(json({ error: "missing paymentId" }, 400));
      const r = await fetch(`${PI_API}/payments/${id}/approve`, { method: "POST", headers: auth });
      const data = await r.json().catch(() => ({}));
      return cors(json(data, r.status));
    }

    // /api/pi-complete  { paymentId, txid }
    if (path === "/api/pi-complete") {
      const id = body.paymentId, txid = body.txid;
      if (!id || !txid) return cors(json({ error: "missing paymentId/txid" }, 400));
      const r = await fetch(`${PI_API}/payments/${id}/complete`, {
        method: "POST", headers: auth, body: JSON.stringify({ txid }),
      });
      const data = await r.json().catch(() => ({}));
      // Se quiser creditar do lado servidor (banco de dados), faca aqui,
      // lendo data.metadata.pack. O jogo ja credita no cliente ao receber 200.
      return cors(json(data, r.status));
    }

    // /api/pi-cancel  { paymentId }
    if (path === "/api/pi-cancel") {
      const id = body.paymentId;
      if (!id) return cors(json({ error: "missing paymentId" }, 400));
      const r = await fetch(`${PI_API}/payments/${id}/cancel`, { method: "POST", headers: auth });
      const data = await r.json().catch(() => ({}));
      return cors(json(data, r.status));
    }

    return cors(json({ error: "not_found" }, 404));
  } catch (e) {
    return cors(json({ error: "upstream", detail: String(e) }, 502));
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" },
  });
}

function cors(res) {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(res.body, { status: res.status, headers: h });
}
