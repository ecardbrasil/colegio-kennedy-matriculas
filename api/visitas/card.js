// GET ?id=... -> campos normalizados de um card + lista de campos faltantes.
// Exige sessao valida.

const { verifySession } = require('./_lib/session');
const { pipefyRequest } = require('./_lib/pipefy');
const { normalizarCampos, calcularFaltantes } = require('./_lib/campos');

const QUERY = `
  query CardDetalhe($cardId: ID!) {
    card(id: $cardId) {
      id
      title
      fields { name value field { id } }
    }
  }
`;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'metodo_nao_permitido' });
    return;
  }

  const sessao = verifySession(req);
  if (!sessao) {
    res.status(401).json({ error: 'nao_autenticado' });
    return;
  }

  const id = req.query && req.query.id;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ error: 'id_obrigatorio' });
    return;
  }

  let data;
  try {
    data = await pipefyRequest(QUERY, { cardId: id });
  } catch (err) {
    console.error('[visitas/card] erro ao consultar Pipefy', err);
    res.status(502).json({ error: 'Erro ao consultar o Pipefy.' });
    return;
  }

  const node = data && data.card;
  if (!node) {
    res.status(404).json({ error: 'card_nao_encontrado' });
    return;
  }

  const normalizado = normalizarCampos(node.fields || []);
  const faltantes = calcularFaltantes(normalizado);

  res.status(200).json({
    card: {
      id: node.id,
      title: node.title,
      ...normalizado,
    },
    faltantes,
  });
};
