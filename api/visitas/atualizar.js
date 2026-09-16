// POST { id, fields, moverParaFeitaVisita? } -> grava campos no Pipefy via
// updateFieldsValues e, opcionalmente, move o card para a fase
// "9. FEZ VISITA" via moveCardToPhase. Exige sessao valida.

const { verifySession } = require('./_lib/session');
const { pipefyRequest, mensagemErroPipefy } = require('./_lib/pipefy');
const { paraPipefyValues } = require('./_lib/campos');

// Shape confirmado via introspecao ao vivo do schema do Pipefy:
// UpdateFieldsValuesInput = { nodeId: ID!, values: [NodeFieldValueInput!]! }
// NodeFieldValueInput = { fieldId: ID!, value: [UndefinedInput], operation, generatedByAi }
// `value` e sempre uma LISTA, mesmo para campos de valor unico (ver
// _lib/campos.js -> paraPipefyValues).
const MUTATION_ATUALIZAR = `
  mutation AtualizarCampos($input: UpdateFieldsValuesInput!) {
    updateFieldsValues(input: $input) {
      success
      updatedNode { id }
    }
  }
`;

// Shape confirmado via introspecao ao vivo do schema do Pipefy:
// MoveCardToPhaseInput = { card_id: ID!, destination_phase_id: ID! }
// (snake_case, diferente da mutation acima -- inconsistencia do proprio
// schema do Pipefy, nao um erro de digitacao).
const MUTATION_MOVER_FASE = `
  mutation MoverFase($input: MoveCardToPhaseInput!) {
    moveCardToPhase(input: $input) {
      card {
        id
        current_phase { id name }
      }
    }
  }
`;

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

  const body = getBody(req);
  const { id, fields, moverParaFeitaVisita } = body;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'id_obrigatorio' });
    return;
  }

  const values = paraPipefyValues(fields || {});
  if (values.length === 0 && !moverParaFeitaVisita) {
    res.status(400).json({ error: 'nenhum_campo_para_atualizar' });
    return;
  }

  try {
    if (values.length > 0) {
      const resultado = await pipefyRequest(MUTATION_ATUALIZAR, {
        input: { nodeId: id, values },
      });

      if (!resultado || !resultado.updateFieldsValues || !resultado.updateFieldsValues.success) {
        console.error('[visitas/atualizar] Pipefy retornou success=false', resultado);
        res.status(502).json({ error: 'Não foi possível salvar os dados no Pipefy.' });
        return;
      }
    }

    if (moverParaFeitaVisita) {
      // `.trim()` pelo mesmo motivo da agenda: espaco ou aspas vindos de
      // copy-paste no dashboard da Vercel quebram a mutation.
      const faseDestino = (process.env.PIPEFY_FASE_FEZ_VISITA_ID || '').trim();
      if (!faseDestino) {
        console.error('[visitas/atualizar] PIPEFY_FASE_FEZ_VISITA_ID nao configurado');
        res.status(502).json({ error: 'Fase "9. FEZ VISITA" não configurada no servidor. Avisar o responsável.' });
        return;
      }

      const movido = await pipefyRequest(MUTATION_MOVER_FASE, {
        input: { card_id: id, destination_phase_id: faseDestino },
      });

      if (!movido || !movido.moveCardToPhase || !movido.moveCardToPhase.card) {
        console.error('[visitas/atualizar] moveCardToPhase nao retornou o card', movido);
        res.status(502).json({ error: 'Não foi possível mover o card para a fase "9. FEZ VISITA".' });
        return;
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[visitas/atualizar] erro ao atualizar no Pipefy', err && err.code, err && err.message);
    res.status(502).json({
      error: mensagemErroPipefy(err, 'Não foi possível salvar os dados. Tente novamente.'),
    });
  }
};
