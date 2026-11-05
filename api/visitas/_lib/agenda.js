// Leitura da fase "7. AGENDOU VISITA" compartilhada por agenda.js e
// agenda-completa.js.
//
// Dois bugs corrigidos aqui (05/11/2026, visitas no Pipefy/Calendar que nao
// apareciam na tela):
// 1. A query pedia `cards(first: 50)` sem paginar. Visitas antigas ficam na
//    fase 7 ate alguem mover; passando de 50 cards, o resto sumia. Agora
//    percorre todas as paginas.
// 2. O horario "DD/MM/AAAA, hh:mm" era lido no fuso do servidor (UTC na
//    Vercel), 3h adiantado em relacao a Brasilia: a visita virava
//    "encerrada" 3h antes da hora e o aviso "chegando" errava. Agora o
//    horario e lido como Brasilia (-03:00, sem horario de verao desde 2019).

const { pipefyRequest } = require('./pipefy');
const { normalizarCampos } = require('./campos');

const QUERY = `
  query VisitasDaFase($phaseId: ID!, $after: String) {
    phase(id: $phaseId) {
      id
      name
      cards(first: 50, after: $after) {
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            id
            title
            fields { name value field { id } }
          }
        }
      }
    }
  }
`;

const JANELA_CHEGANDO_MS = 30 * 60 * 1000;
const MAX_PAGINAS = 20;

function parseHorarioVisita(valorBruto) {
  if (!valorBruto || typeof valorBruto !== 'string') return null;
  const texto = valorBruto.trim();
  if (!texto) return null;

  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:,?\s+(\d{2}):(\d{2}))?/);
  if (match) {
    const [, dia, mes, ano, hora, minuto] = match;
    const iso = `${ano}-${mes}-${dia}T${hora || '00'}:${minuto || '00'}:00-03:00`;
    const data = new Date(iso);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  const dataIso = new Date(texto);
  return Number.isNaN(dataIso.getTime()) ? null : dataIso;
}

// Devolve { fase, edges } com TODOS os cards da fase.
async function buscarCardsDaFase(phaseId) {
  let fase = null;
  const edges = [];
  let after = null;

  for (let i = 0; i < MAX_PAGINAS; i++) {
    const data = await pipefyRequest(QUERY, { phaseId, after });
    const f = data && data.phase;
    if (!f) return { fase: null, edges: [] };
    fase = f;
    const conexao = f.cards || {};
    (conexao.edges || []).forEach((e) => edges.push(e));
    const info = conexao.pageInfo || {};
    if (!info.hasNextPage || !info.endCursor) break;
    after = info.endCursor;
  }

  return { fase, edges };
}

function processarCards(edges, agora) {
  return (edges || [])
    .map(({ node }) => {
      const normalizado = normalizarCampos(node.fields || []);
      const horarioDate = parseHorarioVisita(normalizado.visita_horario);
      return {
        id: node.id,
        nomeResponsavel: normalizado.responsavel_1_nome || node.title || '',
        nomeAluno: normalizado.nome_aluno_1 || '',
        horario: normalizado.visita_horario || null,
        chegando: horarioDate ? Math.abs(horarioDate.getTime() - agora) <= JANELA_CHEGANDO_MS : false,
        _horarioTs: horarioDate ? horarioDate.getTime() : null,
      };
    })
    .sort((a, b) => {
      if (a._horarioTs === null && b._horarioTs === null) return 0;
      if (a._horarioTs === null) return 1;
      if (b._horarioTs === null) return -1;
      return a._horarioTs - b._horarioTs;
    });
}

module.exports = { buscarCardsDaFase, processarCards, parseHorarioVisita };
