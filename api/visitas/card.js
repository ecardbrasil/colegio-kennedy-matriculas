// GET ?id=... -> campos normalizados de um card + lista de campos faltantes +
// metadados de cada campo (label, tipo, opcoes) para a tela montar o
// formulario de edicao. Exige sessao valida.

const { verifySession } = require('./_lib/session');
const { pipefyRequest, mensagemErroPipefy } = require('./_lib/pipefy');
const { CAMPOS, normalizarCampos, calcularFaltantes } = require('./_lib/campos');

// Uma unica ida ao Pipefy traz as tres coisas de que a tela precisa:
// - os VALORES do card (`card.fields` so devolve os campos que tem valor);
// - os metadados dos campos da FASE atual (pega o `visita`, que e due_date e
//   so existe na fase "7. AGENDOU VISITA");
// - os metadados dos campos do FORMULARIO do pipe (os outros 33).
// O frontend nao chuta o tipo de campo: um `radio` precisa virar <select> com
// as opcoes exatas do Pipefy, um `due_date` precisa virar campo de data, etc.
const QUERY = `
  query CardDetalhe($cardId: ID!, $pipeId: ID!) {
    card(id: $cardId) {
      id
      title
      current_phase {
        id
        name
        fields { id label type options }
      }
      fields { name value field { id } }
    }
    pipe(id: $pipeId) {
      start_form_fields { id label type options }
    }
  }
`;

// Cruza o mapeamento interno (ver _lib/campos.js) com os metadados vindos do
// Pipefy. Campo que existe no mapeamento mas nao veio do Pipefy (renomeado ou
// removido) fica de fora em vez de aparecer quebrado na tela.
function montarMetaCampos(camposDoPipe, camposDaFase) {
  const porFieldId = {};

  (camposDoPipe || []).forEach((campo) => {
    if (campo && campo.id) porFieldId[campo.id] = campo;
  });
  // A fase vence em caso de duplicidade: e a configuracao mais especifica.
  (camposDaFase || []).forEach((campo) => {
    if (campo && campo.id) porFieldId[campo.id] = campo;
  });

  const meta = {};
  Object.keys(CAMPOS).forEach((chave) => {
    const fieldId = CAMPOS[chave];
    const campo = porFieldId[fieldId];
    if (!campo) return;
    meta[chave] = {
      fieldId,
      label: campo.label || chave,
      tipo: campo.type || 'short_text',
      opcoes: Array.isArray(campo.options) ? campo.options : [],
    };
  });

  return meta;
}

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

  // Sem o id do pipe nao da para montar o formulario de edicao. Falha alto em
  // vez de devolver uma tela sem campos editaveis (mesmo criterio do resto de
  // api/visitas/*: configuracao errada nunca vira "nao tem nada aqui").
  const pipeId = (process.env.PIPEFY_PIPE_ID || '').trim();
  if (!pipeId) {
    console.error('[visitas/card] PIPEFY_PIPE_ID nao configurado');
    res.status(502).json({ error: 'Pipe do Pipefy não configurado no servidor. Avisar o responsável.' });
    return;
  }

  let data;
  try {
    data = await pipefyRequest(QUERY, { cardId: id, pipeId });
  } catch (err) {
    console.error('[visitas/card] erro ao consultar Pipefy', err && err.code, err && err.message);
    res.status(502).json({ error: mensagemErroPipefy(err) });
    return;
  }

  const node = data && data.card;
  if (!node) {
    res.status(404).json({ error: 'card_nao_encontrado' });
    return;
  }

  const normalizado = normalizarCampos(node.fields || []);
  const faltantes = calcularFaltantes(normalizado);
  const campos = montarMetaCampos(data.pipe && data.pipe.start_form_fields, node.current_phase && node.current_phase.fields);

  // `visita_horario` so existe na fase de agenda, entao ele nao entra nesse
  // aviso: so interessa saber de campo que sumiu de verdade do pipe.
  const sumiram = Object.keys(CAMPOS).filter((chave) => !campos[chave] && chave !== 'visita_horario');
  if (sumiram.length > 0) {
    console.error('[visitas/card] campos do mapeamento nao encontrados no Pipefy', sumiram.join(', '));
  }

  res.status(200).json({
    card: {
      id: node.id,
      title: node.title,
      ...normalizado,
    },
    faltantes,
    campos,
  });
};
