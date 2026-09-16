// auth.js
// Wrapper de fetch para chamadas autenticadas a /api/visitas/*.
// Redireciona para o login sempre que a sessao expirar ou nao existir (401).

async function fetchAutenticado(url, options) {
  const res = await fetch(url, { ...options, credentials: 'same-origin' });
  if (res.status === 401) {
    window.location.href = '/visitas/login.html';
    throw new Error('nao_autenticado');
  }
  return res;
}

// Le o corpo de uma resposta de erro da API e devolve a mensagem pronta para
// a tela. O backend responde { error: "..." } ja com texto em pt-BR (ex.:
// "Token do Pipefy inválido ou sem acesso."), entao mostrar esse texto evita
// o generico "Verifique a internet" quando o problema e de configuracao.
async function mensagemErroResposta(res, mensagemPadrao) {
  try {
    const corpo = await res.json();
    if (corpo && typeof corpo.error === 'string' && corpo.error.length > 0) {
      return corpo.error;
    }
  } catch (e) {
    // corpo nao-JSON (ex.: HTML de erro da borda): cai no texto padrao
  }
  return mensagemPadrao;
}

window.fetchAutenticado = fetchAutenticado;
window.mensagemErroResposta = mensagemErroResposta;
