// GET -> cards da fase "7. AGENDOU VISITA", ordenados por data/hora da
// visita. Exige sessao valida. Retorna um payload enxuto pronto pra UI
// (tablet-first), nunca o blob bruto de fields do Pipefy.

const { verifySession } = require('./_lib/session');
const { pipefyRequest } = require('./_lib/pipefy');
const { normalizarCampos } = require('./_lib/campos');

const QUERY = `
  query VisitasDaFase($phaseId: ID!) {
    phase(id: $phaseId) {
      cards(first: 50) {
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

// O campo "visita" (due_date) costuma vir como "DD/MM/AAAA, hh:mm", mas ja
// foi visto sem o horario ("DD/MM/AAAA") e o Pipefy tambem pode devolver algo
// parseavel como ISO em alguns contextos. Trata os formatos de forma
// defensiva em vez de assumir um unico formato exato.
function parseHorarioVisita(valorBruto) {
  if (!valorBruto || typeof valorBruto !== 'string') return null;
  const texto = valorBruto.trim();
  if (!texto) return null;

  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:,?\s+(\d{2}):(\d{2}))?/);
  if (match) {
    const [, dia, mes, ano, hora, minuto] = match;
    const data = new Date(
      Number(ano),
      Number(mes) - 1,
      Number(dia),
      hora ? Number(hora) : 0,
      minuto ? Number(minuto) : 0
    );
    return Number.isNaN(data.getTime()) ? null : data;
  }

  const dataIso = new Date(texto);
  return Number.isNaN(dataIso.getTime()) ? null : dataIso;
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

  const phaseId = process.env.PIPEFY_FASE_AGENDOU_VISITA_ID;
  if (!phaseId) {
    console.error('[visitas/agenda] PIPEFY_FASE_AGENDOU_VISITA_ID nao configurado');
    res.status(502).json({ error: 'Configuração inválida no servidor.' });
    return;
  }

  let data;
  try {
    data = await pipefyRequest(QUERY, { phaseId });
  } catch (err) {
    console.error('[visitas/agenda] erro ao consultar Pipefy', err);
    res.status(502).json({ error: 'Erro ao consultar o Pipefy.' });
    return;
  }

  const edges = (data && data.phase && data.phase.cards && data.phase.cards.edges) || [];
  const agora = Date.now();

  const cards = edges
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
    })
    .map(({ _horarioTs, ...card }) => card);

  res.status(200).json(cards);
};
