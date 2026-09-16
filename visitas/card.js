// card.js
// Carrega os dados de uma visita (card.html?id=...), renderiza o roteiro de
// conversa e o formulario com TODOS os dados do card. Todo campo e editavel e
// o envio vai para POST /api/visitas/atualizar.
//
// O tipo de cada campo NAO e chutado aqui: o backend devolve, junto com os
// valores, os metadados do Pipefy (`resposta.campos`: label, tipo e opcoes).
// E por isso que um campo de escolha vira <select> com as opcoes exatas do
// Pipefy e o campo `visita` (due_date) vira campo de data e hora, sem precisar
// mexer neste arquivo quando alguem mudar um campo no Pipefy.
//
// So os campos ALTERADOS sao enviados: evita reescrever por cima UTM/GCLID de
// um card so porque a tela foi aberta.

(function () {
  // Rotulos curtos para o tablet. O label do Pipefy e longo (ex.: "Tel.
  // Responsável 1") e empurra o campo para fora da tela num tablet em retrato.
  var LABELS = {
    nome_aluno_1: 'Nome do aluno',
    nome_aluno_2: 'Nome do aluno',
    nome_aluno_3: 'Nome do aluno',
    nome_aluno_4: 'Nome do aluno',
    data_nascimento_aluno_1: 'Data de nascimento',
    escola_atual_aluno_1: 'Escola atual',
    serie_1: 'Série de interesse',
    serie_2: 'Série de interesse',
    serie_3: 'Série de interesse',
    serie_4: 'Série de interesse',
    quantidade_alunos: 'Quantidade de alunos',
    resumo_alunos: 'Resumo dos alunos',
    responsavel_1_nome: 'Nome',
    responsavel_1_telefone: 'Telefone',
    responsavel_1_email: 'E-mail',
    responsavel_1_cpf: 'CPF',
    responsavel_1_parentesco: 'Parentesco',
    responsavel_2_nome: 'Nome',
    responsavel_2_telefone: 'Telefone',
    responsavel_2_email: 'E-mail',
    responsavel_2_cpf: 'CPF',
    responsavel_2_parentesco: 'Parentesco',
    necessidade_especial: 'Existe necessidade educacional especial?',
    necessidade_especial_obs: 'Se sim, qual?',
    origem: 'Como chegou até a gente',
    utm_source: 'Origem (UTM)',
    utm_medium: 'Mídia (UTM)',
    utm_campaign: 'Campanha (UTM)',
    utm_term: 'Termo (UTM)',
    utm_content: 'Conteúdo (UTM)',
    gclid: 'Gclid',
    url_pagina: 'URL da página do formulário',
    data_hora_lead: 'Data e hora do formulário',
    visita_horario: 'Data e hora da visita',
  };

  var CHAVES_RESPONSAVEL_1 = [
    'responsavel_1_nome',
    'responsavel_1_telefone',
    'responsavel_1_email',
    'responsavel_1_cpf',
    'responsavel_1_parentesco',
  ];
  var CHAVES_RESPONSAVEL_2 = [
    'responsavel_2_nome',
    'responsavel_2_telefone',
    'responsavel_2_email',
    'responsavel_2_cpf',
    'responsavel_2_parentesco',
  ];
  var CHAVES_NECESSIDADE = ['necessidade_especial', 'necessidade_especial_obs'];
  // Bloco de baixa enfase: dado de rastreio, quase nunca precisa ser tocado.
  var CHAVES_ORIGEM = [
    'origem',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'url_pagina',
    'data_hora_lead',
  ];
  // So existem para o primeiro filho: o formulario publico pergunta uma vez.
  var CHAVES_ALUNO_1 = ['data_nascimento_aluno_1', 'escola_atual_aluno_1'];
  var CHAVES_RESUMO_ALUNOS = ['quantidade_alunos', 'resumo_alunos'];
  var MAX_ALUNOS = 4;

  // Chaves de aluno na ordem da tela (nome e serie de cada um dos 4).
  var CHAVES_ALUNOS = [];
  for (var numeroAluno = 1; numeroAluno <= MAX_ALUNOS; numeroAluno++) {
    CHAVES_ALUNOS.push('nome_aluno_' + numeroAluno, 'serie_' + numeroAluno);
  }

  var params = new URLSearchParams(window.location.search);
  var idVisita = params.get('id');

  var mensagemCarregando = document.getElementById('mensagemCarregando');
  var mensagemErroTela = document.getElementById('mensagemErroTela');
  var textoErroCarregamento = document.getElementById('textoErroCarregamento');
  var btnTentarNovamente = document.getElementById('btnTentarNovamente');
  var conteudoCard = document.getElementById('conteudoCard');
  var horarioVisita = document.getElementById('horarioVisita');
  var campoVisita = document.getElementById('campoVisita');
  var listaRoteiro = document.getElementById('listaRoteiro');
  var camposAlunos = document.getElementById('camposAlunos');
  var btnAdicionarAluno = document.getElementById('btnAdicionarAluno');
  var camposResponsavel1 = document.getElementById('camposResponsavel1');
  var camposResponsavel2 = document.getElementById('camposResponsavel2');
  var camposNecessidade = document.getElementById('camposNecessidade');
  var camposOrigem = document.getElementById('camposOrigem');
  var blocoOutros = document.getElementById('blocoOutros');
  var camposOutros = document.getElementById('camposOutros');
  var btnSalvar = document.getElementById('btnSalvar');
  var btnRealizada = document.getElementById('btnRealizada');
  var mensagemErroSalvar = document.getElementById('mensagemErroSalvar');
  var mensagemSucesso = document.getElementById('mensagemSucesso');
  var linkVoltarAgenda = document.getElementById('linkVoltarAgenda');

  var salvando = false;
  var visitaFinalizada = false;
  var cardAtual = null;
  var faltantesAtual = [];
  var metaAtual = {};
  var MENSAGEM_ERRO_PADRAO = 'Não foi possível carregar esta visita.';

  // Controle renderizado de cada campo e o valor que veio do Pipefy, para a
  // tela saber o que mudou. Guardar as referencias aqui (em vez de varrer o DOM
  // com querySelectorAll) tambem deixa o calculo de alteracoes trivial.
  var controles = {};
  var valoresOriginais = {};
  var valoresLocais = {};

  // Quantos alunos aparecem: o maior entre os que tem dados, a quantidade
  // informada no card e 1. Sobe quando o Diego toca em "Adicionar aluno" (a
  // familia pode ter filho que o formulario publico nao cadastrou).
  var alunosVisiveis = 1;

  // O campo "visita" do Pipefy chega como "DD/MM/AAAA HH:MM", que o `new Date`
  // do navegador nao entende (nao e ISO): trata esse padrao primeiro e so
  // depois tenta o parse generico.
  function formatarDataHora(valorBruto) {
    if (valorBruto === null || valorBruto === undefined || valorBruto === '') return '';
    var texto = String(valorBruto).trim();

    var partes = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:,?\s+(\d{2}):(\d{2}))?/);
    if (partes) {
      var dataCurta = partes[1] + '/' + partes[2] + '/' + partes[3];
      return partes[4] ? dataCurta + ', ' + partes[4] + ':' + partes[5] : dataCurta;
    }

    var data = new Date(texto);
    if (isNaN(data.getTime())) return texto;
    var dia = String(data.getDate()).padStart(2, '0');
    var mes = String(data.getMonth() + 1).padStart(2, '0');
    var ano = data.getFullYear();
    var horas = String(data.getHours()).padStart(2, '0');
    var minutos = String(data.getMinutes()).padStart(2, '0');
    return dia + '/' + mes + '/' + ano + ', ' + horas + ':' + minutos;
  }

  // "17/09/2026 13:50" -> "2026-09-17T13:50", formato do input datetime-local.
  // O Pipefy aceita esse formato ao gravar (testado: 2026-09-17T15:45 volta
  // como 17/09/2026 15:45) e o input e o que da seletor nativo no tablet.
  function paraDatetimeLocal(valorBruto) {
    if (valorBruto === null || valorBruto === undefined || valorBruto === '') return '';
    var texto = String(valorBruto).trim();

    var brasileiro = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:,?\s+(\d{2}):(\d{2}))?/);
    if (brasileiro) {
      return (
        brasileiro[3] + '-' + brasileiro[2] + '-' + brasileiro[1] +
        'T' + (brasileiro[4] || '00') + ':' + (brasileiro[5] || '00')
      );
    }

    var iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3] + 'T' + iso[4] + ':' + iso[5];

    return '';
  }

  function rotulo(chave) {
    return LABELS[chave] || chave;
  }

  function estaVazio(valor) {
    return valor === null || valor === undefined || String(valor).trim() === '';
  }

  function ehCampoDeEscolha(tipo) {
    return tipo === 'radio_vertical' || tipo === 'radio_horizontal' || tipo === 'select' || tipo === 'checklist';
  }

  function ehCampoDeDataHora(tipo) {
    return tipo === 'due_date' || tipo === 'datetime' || tipo === 'date_time';
  }

  // Valor que o controle esta mostrando agora, ja normalizado para comparar
  // com o que veio do Pipefy (texto sem espaco nas pontas).
  function lerControle(controle) {
    if (!controle) return '';
    var valor = controle.value;
    if (valor === null || valor === undefined) return '';
    return String(valor).trim();
  }

  // O que deve aparecer no campo: o que o Diego ja digitou (valoresLocais,
  // quando a tela foi re-renderizada por causa de "Adicionar aluno") ou o que
  // veio do Pipefy.
  function valorAtual(chave, card) {
    if (Object.prototype.hasOwnProperty.call(valoresLocais, chave)) return valoresLocais[chave];
    return card[chave];
  }

  // Antes de re-renderizar so um pedaco da tela, guarda o que esta digitado
  // para nao perder nada e para nao marcar como salvo o que nao foi salvo.
  function guardarValoresLocais() {
    Object.keys(controles).forEach(function (chave) {
      valoresLocais[chave] = lerControle(controles[chave]);
    });
  }

  // Monta o controle certo para o TIPO do campo no Pipefy. Sem isso, um campo
  // de escolha receberia texto livre (o Pipefy recusa) e a data da visita
  // viraria um campo de texto solto.
  function criarControle(chave, info, valor) {
    var tipo = info.tipo;
    var controle;

    if (ehCampoDeEscolha(tipo)) {
      controle = document.createElement('select');

      var semValor = document.createElement('option');
      semValor.value = '';
      semValor.textContent = 'Não informado';
      controle.appendChild(semValor);

      (info.opcoes || []).forEach(function (opcao) {
        var op = document.createElement('option');
        op.value = opcao;
        op.textContent = opcao;
        controle.appendChild(op);
      });

      // Valor atual fora da lista de opcoes (opcao renomeada no Pipefy): entra
      // como opcao extra para nao ser apagado sem o Diego ver.
      var atual = estaVazio(valor) ? '' : String(valor).trim();
      if (atual !== '' && (info.opcoes || []).indexOf(atual) === -1) {
        var extra = document.createElement('option');
        extra.value = atual;
        extra.textContent = atual;
        controle.appendChild(extra);
      }

      controle.value = atual;
      return controle;
    }

    if (ehCampoDeDataHora(tipo)) {
      controle = document.createElement('input');
      controle.type = 'datetime-local';
      controle.value = paraDatetimeLocal(valor);
      return controle;
    }

    if (tipo === 'long_text') {
      controle = document.createElement('textarea');
      controle.rows = 3;
    } else {
      controle = document.createElement('input');
      if (tipo === 'phone') {
        controle.type = 'tel';
        controle.inputMode = 'tel';
      } else if (tipo === 'email') {
        controle.type = 'email';
        controle.inputMode = 'email';
      } else if (tipo === 'number') {
        // O Pipefy guarda esses campos como numero: teclado numerico ajuda e
        // evita mandar texto para um campo numerico.
        controle.type = 'number';
        controle.inputMode = 'numeric';
      } else {
        controle.type = 'text';
      }
    }

    controle.value = estaVazio(valor) ? '' : String(valor);
    return controle;
  }

  function limparAvisos() {
    mensagemSucesso.hidden = true;
    mensagemErroSalvar.textContent = '';
  }

  // Registra o controle na lista da tela. O valor "original" (o que veio do
  // Pipefy) so e gravado na primeira vez: uma re-renderizacao parcial (ex.:
  // "Adicionar aluno") nao pode marcar como salvo o que ainda nao foi salvo.
  function registrarCampo(chave, info, controle) {
    controle.id = 'campo_' + chave;
    controle.name = chave;
    controle.dataset.chave = chave;
    controle.className = 'campo-editavel-controle';
    controle.addEventListener('input', function () {
      limparAvisos();
      atualizarEstadoSalvar();
    });

    controles[chave] = controle;
    if (!Object.prototype.hasOwnProperty.call(valoresOriginais, chave)) {
      valoresOriginais[chave] = lerControle(controle);
    }
  }

  function renderizarCampo(container, chave, card, faltantes, meta) {
    var info = meta[chave];
    if (!info) return; // campo saiu do Pipefy: some da tela em vez de quebrar

    var wrap = document.createElement('div');
    wrap.className = 'campo-editavel';

    var label = document.createElement('label');
    label.setAttribute('for', 'campo_' + chave);
    label.textContent = rotulo(chave);
    if (faltantes.indexOf(chave) !== -1) {
      var badge = document.createElement('span');
      badge.className = 'badge-faltando';
      badge.textContent = 'Falta preencher';
      label.appendChild(badge);
    }

    var controle = criarControle(chave, info, valorAtual(chave, card));
    registrarCampo(chave, info, controle);

    wrap.appendChild(label);
    wrap.appendChild(controle);
    container.appendChild(wrap);
  }

  function renderizarCampos(container, chaves, card, faltantes, meta) {
    chaves.forEach(function (chave) {
      renderizarCampo(container, chave, card, faltantes, meta);
    });
  }

  function limpar(container) {
    container.innerHTML = '';
  }

  function renderizarAlunos(card, faltantes, meta) {
    limpar(camposAlunos);

    var quantidade = Number(card.quantidade_alunos) || 1;
    var exibidos = 0;

    for (var n = 1; n <= MAX_ALUNOS; n++) {
      var chaveNome = 'nome_aluno_' + n;
      var chaveSerie = 'serie_' + n;
      var temDados = !estaVazio(valorAtual(chaveNome, card)) || !estaVazio(valorAtual(chaveSerie, card));
      if (n > 1 && !temDados && n > alunosVisiveis && n > quantidade) continue;

      var titulo = document.createElement('div');
      titulo.className = 'titulo-aluno';
      titulo.textContent = 'Aluno ' + n;
      camposAlunos.appendChild(titulo);

      renderizarCampos(camposAlunos, [chaveNome, chaveSerie], card, faltantes, meta);
      // Data de nascimento e escola atual existem so para o primeiro filho.
      if (n === 1) renderizarCampos(camposAlunos, CHAVES_ALUNO_1, card, faltantes, meta);

      exibidos += 1;
    }

    renderizarCampos(camposAlunos, CHAVES_RESUMO_ALUNOS, card, faltantes, meta);
    btnAdicionarAluno.hidden = exibidos >= MAX_ALUNOS;
  }

  // Rede de seguranca: qualquer campo mapeado que nao caiba nos blocos acima
  // aparece aqui, em vez de ficar invisivel e nao poder ser editado.
  function renderizarOutros(card, faltantes, meta) {
    var conhecidas = CHAVES_ALUNOS
      .concat(CHAVES_ALUNO_1, CHAVES_RESUMO_ALUNOS, CHAVES_RESPONSAVEL_1, CHAVES_RESPONSAVEL_2)
      .concat(CHAVES_NECESSIDADE, CHAVES_ORIGEM, ['visita_horario']);

    var restantes = Object.keys(meta).filter(function (chave) {
      return conhecidas.indexOf(chave) === -1;
    });

    limpar(camposOutros);
    blocoOutros.hidden = restantes.length === 0;
    renderizarCampos(camposOutros, restantes, card, faltantes, meta);
  }

  function renderizarRoteiro(card) {
    limpar(listaRoteiro);
    var itens = window.montarRoteiro(card);
    itens.forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item.texto;
      listaRoteiro.appendChild(li);
    });
  }

  function renderizarCard(card, faltantes, campos) {
    cardAtual = card;
    faltantesAtual = faltantes || [];
    metaAtual = campos || {};
    controles = {};
    valoresOriginais = {};
    valoresLocais = {};

    if (Object.keys(metaAtual).length === 0) {
      // Sem os metadados do Pipefy nao da para montar o formulario de edicao.
      // Falha visivel em vez de deixar a tela sem campos (ver api/visitas/card.js).
      mensagemCarregando.hidden = true;
      conteudoCard.hidden = true;
      textoErroCarregamento.textContent = 'Não foi possível montar o formulário de edição. Avisar o responsável.';
      mensagemErroTela.hidden = false;
      return;
    }

    // Cabecalho: data e hora da visita editavel quando o campo existe na fase do
    // card. Fora da fase "7. AGENDOU VISITA" ele nao existe e sobra so o horario
    // formatado, para leitura.
    var temCampoVisita = !!metaAtual.visita_horario;
    campoVisita.hidden = !temCampoVisita;
    horarioVisita.hidden = temCampoVisita;
    limpar(campoVisita);
    if (temCampoVisita) {
      renderizarCampos(campoVisita, ['visita_horario'], card, faltantesAtual, metaAtual);
    } else {
      horarioVisita.textContent = formatarDataHora(card.visita_horario);
    }

    renderizarRoteiro(card);

    // Quantos alunos mostrar de largada: o maior entre os que ja tem dados e a
    // quantidade informada no proprio card.
    alunosVisiveis = 1;
    for (var n = 1; n <= MAX_ALUNOS; n++) {
      if (!estaVazio(card['nome_aluno_' + n]) || !estaVazio(card['serie_' + n])) alunosVisiveis = n;
    }
    var quantidade = Number(card.quantidade_alunos) || 1;
    if (quantidade > alunosVisiveis) alunosVisiveis = Math.min(quantidade, MAX_ALUNOS);

    limpar(camposResponsavel1);
    limpar(camposResponsavel2);
    limpar(camposNecessidade);
    limpar(camposOrigem);

    renderizarAlunos(card, faltantesAtual, metaAtual);
    renderizarCampos(camposResponsavel1, CHAVES_RESPONSAVEL_1, card, faltantesAtual, metaAtual);
    renderizarCampos(camposResponsavel2, CHAVES_RESPONSAVEL_2, card, faltantesAtual, metaAtual);
    renderizarCampos(camposNecessidade, CHAVES_NECESSIDADE, card, faltantesAtual, metaAtual);
    renderizarCampos(camposOrigem, CHAVES_ORIGEM, card, faltantesAtual, metaAtual);
    renderizarOutros(card, faltantesAtual, metaAtual);

    limparAvisos();
    atualizarEstadoSalvar();
    conteudoCard.hidden = false;
    mensagemCarregando.hidden = true;
  }

  // So os campos que mudaram em relacao ao que veio do Pipefy. Valor vazio
  // entra de proposito: e assim que o campo e limpo no Pipefy (testado).
  function coletarCamposAlterados() {
    var alterados = {};
    Object.keys(controles).forEach(function (chave) {
      var atual = lerControle(controles[chave]);
      if (atual === valoresOriginais[chave]) return;
      alterados[chave] = atual;
    });
    return alterados;
  }

  function atualizarEstadoSalvar() {
    var temAlteracao = Object.keys(coletarCamposAlterados()).length > 0;
    btnSalvar.disabled = salvando || visitaFinalizada || !temAlteracao;
    btnSalvar.textContent = temAlteracao ? 'Salvar alterações' : 'Nenhuma alteração para salvar';
  }

  function bloquearBotoes(bloqueado) {
    salvando = bloqueado;
    Object.keys(controles).forEach(function (chave) {
      controles[chave].disabled = bloqueado || visitaFinalizada;
    });
    btnAdicionarAluno.disabled = bloqueado || visitaFinalizada;
    btnRealizada.disabled = bloqueado || visitaFinalizada;
    btnRealizada.textContent = bloqueado ? 'Salvando...' : 'Marcar visita como realizada';
    if (bloqueado) {
      btnSalvar.disabled = true;
      btnSalvar.textContent = 'Salvando...';
      return;
    }
    atualizarEstadoSalvar();
  }

  function enviarAtualizacao(fields, moverParaFeitaVisita) {
    mensagemErroSalvar.textContent = '';
    mensagemSucesso.hidden = true;
    bloquearBotoes(true);

    var payload = { id: idVisita };
    if (fields && Object.keys(fields).length > 0) payload.fields = fields;
    if (moverParaFeitaVisita) payload.moverParaFeitaVisita = true;

    return fetchAutenticado('/api/visitas/atualizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (corpo) {
          if (!res.ok) {
            throw new Error(corpo.error || 'Não foi possível salvar. Tente novamente.');
          }
          return corpo;
        });
      })
      .then(function (corpo) {
        if (moverParaFeitaVisita) visitaFinalizada = true;
        return corpo;
      })
      .catch(function (erro) {
        if (erro && erro.message === 'nao_autenticado') return null;
        mensagemErroSalvar.textContent = erro.message || 'Não foi possível salvar. Tente novamente.';
        throw erro;
      })
      .finally(function () {
        bloquearBotoes(false);
      });
  }

  function carregarCard(opcoes) {
    var silencioso = !!(opcoes && opcoes.silencioso);

    if (!idVisita) {
      textoErroCarregamento.textContent = 'Visita não encontrada.';
      mensagemCarregando.hidden = true;
      mensagemErroTela.hidden = false;
      return Promise.resolve();
    }

    if (!silencioso) {
      mensagemCarregando.hidden = false;
      mensagemErroTela.hidden = true;
      conteudoCard.hidden = true;
    }

    return fetchAutenticado('/api/visitas/card?id=' + encodeURIComponent(idVisita))
      .then(function (res) {
        if (res.status === 404) throw new Error('nao_encontrado');
        if (!res.ok) {
          // Mostra o motivo enviado pela API (ex.: token do Pipefy invalido)
          // em vez do generico "nao foi possivel carregar esta visita".
          return window.mensagemErroResposta(res, MENSAGEM_ERRO_PADRAO).then(function (mensagem) {
            throw new Error(mensagem);
          });
        }
        return res.json();
      })
      .then(function (corpo) {
        renderizarCard(corpo.card, corpo.faltantes || [], corpo.campos || {});
      })
      .catch(function (erro) {
        if (erro && erro.message === 'nao_autenticado') return;
        mensagemCarregando.hidden = true;
        if (erro && erro.message === 'nao_encontrado') {
          textoErroCarregamento.textContent = 'Esta visita não foi encontrada.';
        } else {
          textoErroCarregamento.textContent = (erro && erro.message) || MENSAGEM_ERRO_PADRAO;
        }
        mensagemErroTela.hidden = false;
      });
  }

  btnTentarNovamente.addEventListener('click', function () {
    carregarCard();
  });

  btnAdicionarAluno.addEventListener('click', function () {
    if (alunosVisiveis >= MAX_ALUNOS) return;
    // Guarda o que ja foi digitado antes de redesenhar o bloco: o formulario
    // nao pode perder dado por causa de um toque em "Adicionar aluno".
    guardarValoresLocais();
    alunosVisiveis += 1;
    renderizarAlunos(cardAtual, faltantesAtual, metaAtual);
    atualizarEstadoSalvar();
  });

  btnSalvar.addEventListener('click', function () {
    var campos = coletarCamposAlterados();
    if (Object.keys(campos).length === 0) {
      atualizarEstadoSalvar();
      return;
    }

    enviarAtualizacao(campos, false)
      .then(function (resultado) {
        if (!resultado) return;
        // Recarrega em silencio para o roteiro e os "Falta preencher" refletirem
        // o que acabou de ser salvo, sem piscar a tela.
        return carregarCard({ silencioso: true }).then(function () {
          mensagemSucesso.textContent = 'Dados salvos.';
          mensagemSucesso.hidden = false;
        });
      })
      .catch(function () {});
  });

  btnRealizada.addEventListener('click', function () {
    var campos = coletarCamposAlterados();
    enviarAtualizacao(campos, true)
      .then(function (resultado) {
        if (!resultado) return;
        mensagemSucesso.textContent = 'Visita marcada como realizada.';
        mensagemSucesso.hidden = false;
        btnRealizada.hidden = true;
        btnSalvar.hidden = true;
        btnAdicionarAluno.hidden = true;
        linkVoltarAgenda.style.display = 'block';
      })
      .catch(function () {});
  });

  carregarCard();
})();
