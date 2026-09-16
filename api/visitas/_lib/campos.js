// Fonte unica de verdade para o mapeamento entre chaves internas
// (snake_case, usadas pelo backend/frontend de /visitas) e os IDs reais dos
// campos no Pipefy (pipe "CK 2027"). Os IDs abaixo foram confirmados como
// reais -- nao inventar nem criar campos novos no Pipefy.
//
// A tabela cobre TODOS os campos do pipe (os 33 de `pipe.start_form_fields`,
// conferidos por introspeccao) mais o campo `visita`, que e um campo da fase
// "7. AGENDOU VISITA" (due_date). Cobertura completa de proposito: a tela da
// visita deixa editar qualquer dado do card, e um campo fora desta tabela
// simplesmente nao apareceria nem seria salvo.
const CAMPOS = {
  // Aluno(s)
  nome_aluno_1: 'nome_do_aluno_a',
  data_nascimento_aluno_1: 'data_de_nascimento',
  escola_atual_aluno_1: 'escola_atual_do_aluno',
  serie_1: 's_rie_de_interesse',
  nome_aluno_2: 'nome_do_aluno_2',
  serie_2: 's_rie_de_interesse_2',
  nome_aluno_3: 'nome_do_aluno_3',
  serie_3: 's_rie_de_interesse_3',
  nome_aluno_4: 'nome_do_aluno_4',
  serie_4: 's_rie_de_interesse_4',
  quantidade_alunos: 'quantidade_de_alunos',
  resumo_alunos: 'resumo_dos_alunos',
  // Responsavel 1
  responsavel_1_nome: 'nome_do_respons_vel_1',
  responsavel_1_telefone: 'tel_respons_vel_1',
  responsavel_1_email: 'email',
  responsavel_1_cpf: 'cpf',
  responsavel_1_parentesco: 'parentesco',
  // Responsavel 2
  responsavel_2_nome: 'nome_do_respons_vel_2',
  responsavel_2_telefone: 'telefone_respons_vel_2',
  responsavel_2_email: 'email_resp_2',
  responsavel_2_cpf: 'copy_of_cpf',
  responsavel_2_parentesco: 'parentesco_1',
  // Necessidade educacional especial
  necessidade_especial: 'existe_alguma_necessidade_educacional_especial',
  necessidade_especial_obs: 'alguma_observa_o',
  // Origem e campanha (inclui o registro do formulario publico)
  origem: 'veio_atrav_s_de',
  utm_source: 'utm_source',
  utm_medium: 'utm_medium',
  utm_campaign: 'utm_campaign',
  utm_term: 'utm_term',
  utm_content: 'utm_content',
  gclid: 'gclid',
  url_pagina: 'url_da_p_gina',
  data_hora_lead: 'data_hora_do_lead',
  // Agenda (so existe em cards na fase 7, AGENDOU VISITA)
  visita_horario: 'visita',
};

// Campos que a tela da visita agrupa por aluno (1 a 4): o nome e a serie de
// cada filho. Hoje o pipe tem esses campos por numero, nao como repeticao.
const CAMPOS_POR_ALUNO = {
  nome: ['nome_aluno_1', 'nome_aluno_2', 'nome_aluno_3', 'nome_aluno_4'],
  serie: ['serie_1', 'serie_2', 'serie_3', 'serie_4'],
};

// Campos de aluno que so existem para o primeiro filho (o formulario publico
// so pergunta isso uma vez).
const CAMPOS_ALUNO_1 = ['data_nascimento_aluno_1', 'escola_atual_aluno_1'];


// Campos considerados "faltantes" se vazios -- responsavel 2 e o que Diego
// normalmente coleta durante a visita presencial.
const REQUIRED_FIELDS = ['responsavel_2_nome', 'responsavel_2_telefone'];

// Mapa reverso: field.id do Pipefy -> chave interna.
const CAMPOS_REVERSO = Object.entries(CAMPOS).reduce((acc, [chaveInterna, fieldId]) => {
  acc[fieldId] = chaveInterna;
  return acc;
}, {});

// Converte o array `fields` retornado pelo Pipefy (cada item com
// { name, value, field: { id } }) num objeto plano usando as chaves internas.
function normalizarCampos(pipefyFieldsArray) {
  const out = {};
  if (!Array.isArray(pipefyFieldsArray)) return out;

  pipefyFieldsArray.forEach((f) => {
    const fieldId = f && f.field && f.field.id;
    if (!fieldId) return;
    const chaveInterna = CAMPOS_REVERSO[fieldId];
    if (!chaveInterna) return;
    out[chaveInterna] = f.value;
  });

  return out;
}

// Converte um objeto { chaveInterna: valor, ... } no array
// [{ fieldId, value: [...] }, ...] esperado pela mutation
// updateFieldsValues. O input `NodeFieldValueInput` do Pipefy exige `value`
// como lista mesmo para campos de valor unico (short_text/phone/email/etc),
// entao valores escalares sao empacotados em array de um item; valores que
// ja chegam como array (ex.: campos multi-select) sao mantidos como estao.
// Chaves internas desconhecidas sao ignoradas silenciosamente.
function paraPipefyValues(internalFieldsObject) {
  const values = [];
  if (!internalFieldsObject || typeof internalFieldsObject !== 'object') return values;

  Object.entries(internalFieldsObject).forEach(([chaveInterna, value]) => {
    const fieldId = CAMPOS[chaveInterna];
    if (!fieldId) return;
    values.push({ fieldId, value: Array.isArray(value) ? value : [value] });
  });

  return values;
}

// Dado um objeto ja normalizado (via normalizarCampos), retorna a lista de
// chaves de REQUIRED_FIELDS que estao vazias/ausentes.
function campoVazio(valor) {
  return valor === undefined || valor === null || String(valor).trim() === '';
}

function calcularFaltantes(camposNormalizados) {
  const normalizado = camposNormalizados || {};
  return REQUIRED_FIELDS.filter((chave) => campoVazio(normalizado[chave]));
}

module.exports = {
  CAMPOS,
  CAMPOS_POR_ALUNO,
  CAMPOS_ALUNO_1,
  REQUIRED_FIELDS,
  normalizarCampos,
  paraPipefyValues,
  calcularFaltantes,
};
