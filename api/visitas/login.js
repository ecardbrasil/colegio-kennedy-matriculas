// POST { senha } -> valida contra process.env.VISITAS_SENHA e, se correto,
// seta o cookie de sessao assinado (visitas_session).

const crypto = require('crypto');
const { createSessionCookieValue } = require('./_lib/session');

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h, mesmo prazo do Max-Age do cookie
const ATRASO_MINIMO_MS = 300; // friccao contra brute-force

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBody(req) {
  if (req.body === undefined || req.body === null) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch (e) {
      return {};
    }
  }
  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString('utf8') || '{}');
    } catch (e) {
      return {};
    }
  }
  return req.body;
}

// Compara em tempo constante. Nunca usar === para comparar segredos.
function senhaConfere(senhaRecebida) {
  const senhaEsperada = process.env.VISITAS_SENHA;
  if (!senhaEsperada || typeof senhaRecebida !== 'string') return false;

  const bufRecebida = Buffer.from(senhaRecebida, 'utf8');
  const bufEsperada = Buffer.from(senhaEsperada, 'utf8');

  if (bufRecebida.length !== bufEsperada.length) {
    // Ainda faz uma comparacao de tamanho fixo para nao vazar o tamanho da
    // senha via timing (best-effort; o early-return acima ja e uma pequena
    // fuga residual, mas nao ha jeito barato de evitar 100% em JS puro).
    crypto.timingSafeEqual(Buffer.alloc(bufEsperada.length), Buffer.alloc(bufEsperada.length));
    return false;
  }

  return crypto.timingSafeEqual(bufRecebida, bufEsperada);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'metodo_nao_permitido' });
    return;
  }

  const inicio = Date.now();

  const falhar = async () => {
    const decorrido = Date.now() - inicio;
    const restante = ATRASO_MINIMO_MS - decorrido;
    if (restante > 0) await esperar(restante);
    res.status(401).json({ error: 'senha_invalida' });
  };

  try {
    if (!process.env.SESSION_SECRET) {
      console.error('[visitas/login] SESSION_SECRET nao configurado');
      await falhar();
      return;
    }
    if (!process.env.VISITAS_SENHA) {
      console.error('[visitas/login] VISITAS_SENHA nao configurado');
      await falhar();
      return;
    }

    const body = getBody(req);

    if (!senhaConfere(body.senha)) {
      await falhar();
      return;
    }

    const cookieValue = createSessionCookieValue({ exp: Date.now() + SESSION_TTL_MS });
    res.setHeader(
      'Set-Cookie',
      `visitas_session=${cookieValue}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=43200`
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[visitas/login] erro inesperado', err);
    await falhar();
  }
};
