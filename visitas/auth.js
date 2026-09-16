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

window.fetchAutenticado = fetchAutenticado;
