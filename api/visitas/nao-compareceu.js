// POST { id } -> a familia nao compareceu: move o card da fase "7. AGENDOU
// VISITA" para "8. N VEIO VISITA, REMARCAR" e deixa um comentario no card.
// Exige sessao valida. So move card que ainda esta na fase 7: se o card ja
// avancou (ex.: Diego ja trocou de fase no Pipefy), responde 409 e nao mexe.

const { verifySession } = require('./_lib/session');
const { pipefyRequest, mensagemErroPipefy } = require('./_lib/pipefy');

// IDs de fase nao sao segredo; as variaveis de ambiente, se existirem, mandam.
const FASE_AGENDOU_VISITA = '343928415';
const FASE_NAO_VEIO_REMARCAR = '343928419';

const QUERY_FASE = `
  query FaseDoCard($id: ID!) {
    card(id: $id) {
      id
      current_phase { id name }
    }
  }
`;

const MUTATION_MOVER = `
  mutation NaoVeio($input: MoveCardToPhaseInput!) {
    moveCardToPhase(input: $input) {
      card { id current_phase { id name } }
    }
  }
`;

const MUTATION_COMENTARIO = `
  mutation Comentar($input: CreateCommentInput!) {
    createComment(input: $input) {
      comment { id }
    }
  }
`;

function agoraBrasilia() {
  const d = new Date(Date.now() - 3 * 3600000).toISOString();
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)} ${d.slice(11, 16)}`;
}

function lerCorpo(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return {};
    }
  }
  return req.body || {};
}

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

  const id = lerCorpo(req).id;
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'id_obrigatorio' });
    return;
  }

  const faseOrigem = (process.env.PIPEFY_FASE_AGENDOU_VISITA_ID || '').trim() || FASE_AGENDOU_VISITA;
  const faseDestino = (process.env.PIPEFY_FASE_NAO_VEIO_ID || '').trim() || FASE_NAO_VEIO_REMARCAR;

  try {
    const lido = await pipefyRequest(QUERY_FASE, { id });
    const card = lido && lido.card;
    if (!card) {
      res.status(404).json({ error: 'Card não encontrado no Pipefy.' });
      return;
    }
    const faseAtual = card.current_phase ? String(card.current_phase.id) : '';
    if (faseAtual === faseDestino) {
      res.status(200).json({ ok: true, jaEstava: true, cardId: card.id });
      return;
    }
    if (faseAtual !== faseOrigem) {
      const nome = card.current_phase ? card.current_phase.name : 'outra fase';
      res.status(409).json({ error: `Este card já está em "${nome}". Nada foi alterado.` });
      return;
    }

    const movido = await pipefyRequest(MUTATION_MOVER, {
      input: { card_id: id, destination_phase_id: faseDestino },
    });
    if (!movido || !movido.moveCardToPhase || !movido.moveCardToPhase.card) {
      console.error('[visitas/nao-compareceu] moveCardToPhase nao retornou o card', id);
      res.status(502).json({ error: 'Não foi possível mover o card. Tente novamente.' });
      return;
    }

    // O comentario e secundario: se falhar, o card ja foi movido e a tela nao
    // deve mostrar erro.
    try {
      await pipefyRequest(MUTATION_COMENTARIO, {
        input: {
          card_id: id,
          text: `Família não compareceu à visita. Marcado na tela /visitas em ${agoraBrasilia()}. Card movido para "8. Ñ VEIO VISITA, REMARCAR".`,
        },
      });
    } catch (err) {
      console.error('[visitas/nao-compareceu] comentario falhou', err && err.code, err && err.message);
    }

    console.log('[visitas/nao-compareceu] card movido', id, '->', faseDestino);
    res.status(200).json({ ok: true, cardId: id });
  } catch (err) {
    console.error('[visitas/nao-compareceu] erro', err && err.code, err && err.message);
    res.status(502).json({
      error: mensagemErroPipefy(err, 'Não foi possível marcar a falta. Tente novamente.'),
    });
  }
};
