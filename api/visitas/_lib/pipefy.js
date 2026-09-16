// Cliente GraphQL minimo para a API do Pipefy. PIPEFY_API_TOKEN so deve ser
// lido aqui dentro -- nunca logar o token nem devolve-lo em respostas da API.

// Cada erro carrega um `code` para que as rotas respondam algo util ao
// navegador. Motivo (bug real, 16/09/2026): a API do Pipefy responde HTTP 401
// com o corpo { "error": "invalid_token" } -- chave no SINGULAR. A versao
// anterior so verificava `json.errors` (plural), entao um token invalido
// passava batido, `data` virava undefined e a agenda devolvia "nenhuma visita
// agendada" em vez de avisar que a credencial estava errada.
function criarErro(code, mensagem) {
  const err = new Error(mensagem);
  err.code = code;
  return err;
}

async function pipefyRequest(query, variables) {
  const token = (process.env.PIPEFY_API_TOKEN || '').trim();
  if (!token) {
    throw criarErro('pipefy_token_ausente', 'PIPEFY_API_TOKEN nao configurado');
  }

  let res;
  try {
    res = await fetch('https://api.pipefy.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (err) {
    throw criarErro('pipefy_rede', `falha de rede ao chamar o Pipefy: ${err.message}`);
  }

  if (res.status === 401 || res.status === 403) {
    throw criarErro('pipefy_nao_autorizado', `Pipefy recusou o token (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw criarErro('pipefy_http', `Pipefy respondeu HTTP ${res.status}`);
  }

  let json;
  try {
    json = await res.json();
  } catch (err) {
    throw criarErro('pipefy_resposta_invalida', 'resposta do Pipefy nao e JSON valido');
  }

  if (json.errors && json.errors.length > 0) {
    throw criarErro('pipefy_graphql', json.errors.map((e) => e.message).join('; '));
  }

  if (json.data === undefined || json.data === null) {
    throw criarErro('pipefy_sem_dados', 'resposta do Pipefy sem o campo data');
  }

  return json.data;
}

// Traduz o erro acima numa frase pt-BR pronta para a tela do tablet. Nunca
// cita o token: o Diego precisa saber que e problema de configuracao e que
// deve avisar o responsavel, nao que "nao tem visita".
//
// Regra geral: quando o erro vem do proprio Pipefy (GraphQL/HTTP), a mensagem
// tecnica original aparece resumida entre parenteses. Isso e de proposito --
// em 17/09/2026 uma mutation invalida ("Selections can't be made directly on
// unions") virou um genErico "Nao foi possivel salvar os dados. Tente
// novamente." e o bug ficou invisivel por horas. O texto do Pipefy e curto,
// sem dados pessoais e sem token, entao vale mais na tela do que escondido.
function resumirDetalhe(mensagem) {
  const texto = String(mensagem || '').replace(/\s+/g, ' ').trim();
  if (!texto) return '';
  return texto.length > 160 ? `${texto.slice(0, 157)}...` : texto;
}

function mensagemErroPipefy(err, mensagemPadrao) {
  const code = err && err.code;
  if (code === 'pipefy_nao_autorizado') {
    return 'Token do Pipefy inválido ou sem acesso. Avisar o responsável.';
  }
  if (code === 'pipefy_token_ausente') {
    return 'Token do Pipefy não configurado no servidor. Avisar o responsável.';
  }
  if (code === 'pipefy_sem_dados' || code === 'pipefy_resposta_invalida') {
    return 'Resposta inesperada do Pipefy. Avisar o responsável.';
  }
  // Erro ja montado pela propria rota (ver criarErroRecusa em atualizar.js).
  if (code === 'pipefy_recusa') {
    return `${err.message}. Avisar o responsável.`;
  }
  if (code === 'pipefy_graphql') {
    if (/acesso negado|permission/i.test(String(err.message))) {
      return 'Pipefy negou acesso à fase ou ao pipe. Avisar o responsável.';
    }
    const detalhe = resumirDetalhe(err.message);
    if (detalhe) return `O Pipefy recusou a operação (${detalhe}). Avisar o responsável.`;
  }
  if (code === 'pipefy_http') {
    const detalhe = resumirDetalhe(err.message);
    if (detalhe) return `O Pipefy respondeu com erro (${detalhe}). Avisar o responsável.`;
  }
  return mensagemPadrao || 'Erro ao consultar o Pipefy. Avisar o responsável.';
}

module.exports = { pipefyRequest, mensagemErroPipefy };
