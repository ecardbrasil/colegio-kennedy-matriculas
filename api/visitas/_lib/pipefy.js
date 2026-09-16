// Cliente GraphQL minimo para a API do Pipefy. PIPEFY_API_TOKEN so deve ser
// lido aqui dentro -- nunca logar o token nem devolve-lo em respostas da API.

async function pipefyRequest(query, variables) {
  const res = await fetch('https://api.pipefy.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PIPEFY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }

  return json.data;
}

module.exports = { pipefyRequest };
