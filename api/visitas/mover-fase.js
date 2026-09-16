// POST -> move um card para uma nova fase. Exige sessao valida.
// Body: { cardId, destinyPhaseId }
// Response: { ok: true } ou erro 502

const { verifySession } = require('./_lib/session');
const { pipefyRequest, mensagemErroPipefy } = require('./_lib/pipefy');

const MUTATION = `
  mutation MoveCard($cardId: ID!, $destinyPhaseId: ID!) {
    moveCardToPhase(input: { card_id: $cardId, destination_phase_id: $destinyPhaseId }) {
      card {
        id
      }
    }
  }
`;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'metodo_nao_permitido' });
    return;
  }

  const sessao = verifySession(req);
  if (!sessao) {
    res.status(401).json({ error: 'nao_autenticado' });
    return;
  }

  const { cardId, destinyPhaseId } = req.body || {};

  if (!cardId || !destinyPhaseId) {
    res.status(400).json({ error: 'cardId e destinyPhaseId sao obrigatorios' });
    return;
  }

  let data;
  try {
    data = await pipefyRequest(MUTATION, { cardId, destinyPhaseId });
  } catch (err) {
    console.error('[visitas/mover-fase] erro ao consultar Pipefy', err && err.code, err && err.message);
    res.status(502).json({ error: mensagemErroPipefy(err) });
    return;
  }

  const card = data && data.moveCardToPhase && data.moveCardToPhase.card;
  if (!card) {
    console.error('[visitas/mover-fase] card nao retornou apos movimento', cardId);
    res.status(502).json({ error: 'Não foi possível mover o card. Tente novamente.' });
    return;
  }

  console.log('[visitas/mover-fase] card movido', cardId, '->', destinyPhaseId);
  res.status(200).json({ ok: true, cardId: card.id });
};
