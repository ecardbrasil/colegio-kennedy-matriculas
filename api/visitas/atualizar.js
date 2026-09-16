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
// UpdateFieldsValuesPayload = { success: Boolean!, updatedNode: UpdatedNode, userErrors: [UserError!] }
// UserError = { field: [String], message: String! }
//
// BUG REAL (17/09/2026): a versao anterior pedia `updatedNode { id }`.
// `updatedNode` e um UNION (`Card | TableRecord`), entao o GraphQL recusava a
// mutation INTEIRA na validacao ("Selections can't be made directly on unions
// (see selections on UpdatedNode)") sem executar nada. Como esse erro do
// Pipefy nao casava com nenhum caso conhecido de mensagemErroPipefy, o tablet
// mostrava so "Nao foi possivel salvar os dados. Tente novamente." e o dado
// nunca era gravado. Nada aqui precisa do `updatedNode` (ja temos o id do
// card), entao ele foi removido; `userErrors` entrou no lugar porque e o que
// explica uma recusa do Pipefy (ex.: "Field not found").
const MUTATION_ATUALIZAR = `
  mutation AtualizarCampos($input: UpdateFieldsValuesInput!) {
    updateFieldsValues(input: $input) {
      success
      userErrors { field message }
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

// Transforma os `userErrors` do Pipefy numa frase curta e legivel para o
// tablet (ex.: "Field not found"), em vez de um erro opaco. `field` vem como
// lista de caminhos (ex.: ["values", "fieldId", "nome_do_respons_vel_2"]).
function descreverUserErrors(userErrors) {
  if (!Array.isArray(userErrors) || userErrors.length === 0) return '';
  const partes = userErrors
    .filter((e) => e && e.message)
    .map((e) => {
      const caminho = Array.isArray(e.field) && e.field.length > 0 ? e.field[e.field.length - 1] : '';
      return caminho ? `${e.message} (${caminho})` : String(e.message);
    });
  return partes.join('; ').slice(0, 200);
}

// Erro interno que carrega a mensagem ja pronta para a tela, usado para
// devolver o motivo real de uma recusa do Pipefy sem repetir o try/catch.
function criarErroRecusa(mensagem, detalhe) {
  const err = new Error(detalhe ? `${mensagem} (${detalhe})` : mensagem);
  err.code = 'pipefy_recusa';
  return err;
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

      const atualizacao = resultado && resultado.updateFieldsValues;
      if (!atualizacao || !atualizacao.success) {
        // `userErrors` e o que explica a recusa (ex.: "Field not found" quando
        // um id de campo em _lib/campos.js deixa de existir no Pipefy). Sem
        // isso o tablet so mostrava "Tente novamente", sem pista nenhuma.
        const detalhe = descreverUserErrors(atualizacao && atualizacao.userErrors);
        console.error('[visitas/atualizar] Pipefy retornou success=false', detalhe, resultado);
        throw criarErroRecusa('O Pipefy não aceitou os dados', detalhe);
      }
    }

    if (moverParaFeitaVisita) {
      // `.trim()` pelo mesmo motivo da agenda: espaco ou aspas vindos de
      // copy-paste no dashboard da Vercel quebram a mutation.
      const faseDestino = (process.env.PIPEFY_FASE_FEZ_VISITA_ID || '').trim();
      if (!faseDestino) {
        console.error('[visitas/atualizar] PIPEFY_FASE_FEZ_VISITA_ID nao configurado');
        throw criarErroRecusa('Fase "9. FEZ VISITA" não configurada no servidor');
      }

      const movido = await pipefyRequest(MUTATION_MOVER_FASE, {
        input: { card_id: id, destination_phase_id: faseDestino },
      });

      if (!movido || !movido.moveCardToPhase || !movido.moveCardToPhase.card) {
        console.error('[visitas/atualizar] moveCardToPhase nao retornou o card', movido);
        throw criarErroRecusa('Não foi possível mover o card para a fase "9. FEZ VISITA"');
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
