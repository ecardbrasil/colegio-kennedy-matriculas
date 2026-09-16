// Helpers para a sessao (cookie assinado com HMAC-SHA256) usada nas rotas de
// /api/visitas/*. Nao ha estado de sessao no servidor: o cookie carrega o
// payload (base64url) + assinatura (base64url), separados por ".".

const crypto = require('crypto');

function base64urlEncode(buf) {
  return Buffer.from(buf).toString('base64url');
}

function base64urlDecode(str) {
  return Buffer.from(str, 'base64url');
}

function sign(payloadB64) {
  const secret = process.env.SESSION_SECRET || '';
  return crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
}

// Parser simples de "Cookie" header (req.headers.cookie).
function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return out;
  cookieHeader.split(';').forEach((par) => {
    const idx = par.indexOf('=');
    if (idx === -1) return;
    const chave = par.slice(0, idx).trim();
    const valor = par.slice(idx + 1).trim();
    if (!chave) return;
    try {
      out[chave] = decodeURIComponent(valor);
    } catch (e) {
      out[chave] = valor;
    }
  });
  return out;
}

// Monta o valor do cookie "visitas_session" a partir de um payload (ex.
// { exp: <timestamp> }). Usado por login.js.
function createSessionCookieValue(payloadObj) {
  const payloadB64 = base64urlEncode(Buffer.from(JSON.stringify(payloadObj), 'utf8'));
  const assinatura = sign(payloadB64);
  return `${payloadB64}.${assinatura}`;
}

// Valida o valor bruto do cookie (payload.assinatura) e retorna o payload
// decodificado, ou null se invalido/expirado/sem SESSION_SECRET configurado.
function verifyCookieValue(value) {
  if (!value || typeof value !== 'string') return null;
  if (!process.env.SESSION_SECRET) return null;

  const partes = value.split('.');
  if (partes.length !== 2) return null;
  const [payloadB64, assinaturaRecebida] = partes;
  if (!payloadB64 || !assinaturaRecebida) return null;

  const assinaturaEsperada = sign(payloadB64);

  const bufRecebido = Buffer.from(assinaturaRecebida);
  const bufEsperado = Buffer.from(assinaturaEsperada);
  if (bufRecebido.length !== bufEsperado.length) return null;
  if (!crypto.timingSafeEqual(bufRecebido, bufEsperado)) return null;

  let payload;
  try {
    payload = JSON.parse(base64urlDecode(payloadB64).toString('utf8'));
  } catch (e) {
    return null;
  }

  if (!payload || typeof payload.exp !== 'number' || payload.exp <= Date.now()) return null;

  return payload;
}

// Le e valida a sessao a partir da requisicao. Retorna o payload decodificado
// ou null. Deve ser a primeira coisa chamada por qualquer rota protegida.
function verifySession(req) {
  const cookies = parseCookies(req.headers && req.headers.cookie);
  return verifyCookieValue(cookies.visitas_session);
}

module.exports = {
  parseCookies,
  createSessionCookieValue,
  verifyCookieValue,
  verifySession,
};
