// card.js
// Carrega os dados de uma visita (card.html?id=...), renderiza o roteiro
// de conversa, os dados do card e o formulário de campos faltantes.
// Envia atualizações para POST /api/visitas/atualizar.

(function () {
  var LABELS = {
    serie_1: 'Série',
    serie_2: 'Série',
    serie_3: 'Série',
    serie_4: 'Série',
    responsavel_1_nome: 'Nome',
    responsavel_1_telefone: 'Telefone',
    responsavel_1_email: 'E-mail',
    responsavel_2_nome: 'Nome',
    responsavel_2_telefone: 'Telefone',
    responsavel_2_email: 'E-mail',
    origem: 'Origem',
    utm_campaign: 'Campanha',
    utm_source: 'Origem (UTM)',
    utm_medium: 'Mídia (UTM)',
    gclid: 'Gclid',
    necessidade_especial: 'Necessidade especial',
    necessidade_especial_obs: 'Observações',
  };

  var params = new URLSearchParams(window.location.search);
  var idVisita = params.get('id');

  var mensagemCarregando = document.getElementById('mensagemCarregando');
  var mensagemErroTela = document.getElementById('mensagemErroTela');
  var textoErroCarregamento = document.getElementById('textoErroCarregamento');
  var btnTentarNovamente = document.getElementById('btnTentarNovamente');
  var conteudoCard = document.getElementById('conteudoCard');
  var horarioVisita = document.getElementById('horarioVisita');
  var listaRoteiro = document.getElementById('listaRoteiro');
  var camposAlunos = document.getElementById('camposAlunos');
  var camposResponsavel1 = document.getElementById('camposResponsavel1');
  var camposResponsavel2 = document.getElementById('camposResponsavel2');
  var blocoNecessidade = document.getElementById('blocoNecessidade');
  var camposNecessidade = document.getElementById('camposNecessidade');
  var camposOrigem = document.getElementById('camposOrigem');
  var btnSalvar = document.getElementById('btnSalvar');
  var btnRealizada = document.getElementById('btnRealizada');
  var mensagemErroSalvar = document.getElementById('mensagemErroSalvar');
  var mensagemSucesso = document.getElementById('mensagemSucesso');
  var linkVoltarAgenda = document.getElementById('linkVoltarAgenda');

  var cardAtual = null;
  var faltantesAtual = [];
  var MENSAGEM_ERRO_PADRAO = 'Não foi possível carregar esta visita.';

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

  function escapeHtml(texto) {
    var div = document.createElement('div');
    div.textContent = texto == null ? '' : String(texto);
    return div.innerHTML;
  }

  function rotulo(chave) {
    return LABELS[chave] || chave;
  }

  // Renderiza um conjunto de campos dentro de um contêiner: campos em
  // `faltantes` viram um input editável com badge; os demais viram
  // uma linha de leitura simples.
  function renderizarCampos(container, card, faltantes, chaves) {
    container.innerHTML = '';
    chaves.forEach(function (chave) {
      if (faltantes.indexOf(chave) !== -1) {
        var wrap = document.createElement('div');
        wrap.className = 'campo-faltante';
        var label = document.createElement('label');
        label.setAttribute('for', 'campo_' + chave);
        label.innerHTML = escapeHtml(rotulo(chave)) + '<span class="badge-faltando">Falta preencher</span>';
        var input = document.createElement('input');
        input.type = 'text';
        input.id = 'campo_' + chave;
        input.name = chave;
        input.dataset.chave = chave;
        input.className = 'campo-faltante-input';
        wrap.appendChild(label);
        wrap.appendChild(input);
        container.appendChild(wrap);
      } else {
        var valor = card[chave];
        var linha = document.createElement('div');
        linha.className = 'linha-campo';
        linha.innerHTML =
          '<span class="rotulo">' + escapeHtml(rotulo(chave)) + '</span>' +
          '<span class="valor">' + escapeHtml(valor && String(valor).length > 0 ? valor : 'Não informado') + '</span>';
        container.appendChild(linha);
      }
    });
  }

  function renderizarAlunos(card, faltantes) {
    camposAlunos.innerHTML = '';
    var quantidade = Number(card.quantidade_alunos) || 1;
    for (var n = 1; n <= 4; n++) {
      var chaveNome = 'nome_aluno_' + n;
      var chaveSerie = 'serie_' + n;
      var temDados = (card[chaveNome] && card[chaveNome].length > 0) || n <= quantidade;
      if (!temDados) continue;

      var tituloAluno = document.createElement('div');
      tituloAluno.className = 'linha-campo';
      tituloAluno.innerHTML =
        '<span class="rotulo">Aluno ' + n + '</span>' +
        '<span class="valor">' + escapeHtml(card[chaveNome] && card[chaveNome].length > 0 ? card[chaveNome] : 'Não informado') + '</span>';
      camposAlunos.appendChild(tituloAluno);

      renderizarCampos(camposAlunos, card, faltantes, [chaveSerie].filter(function (c) {
        // só mostra a linha de série se houver dado ou se ela estiver faltando
        return (card[c] && card[c].length > 0) || faltantes.indexOf(c) !== -1;
      }));
    }
  }

  function renderizarRoteiro(card) {
    listaRoteiro.innerHTML = '';
    var itens = window.montarRoteiro(card);
    itens.forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item.texto;
      listaRoteiro.appendChild(li);
    });
  }

  function renderizarCard(card, faltantes) {
    cardAtual = card;
    faltantesAtual = faltantes || [];

    horarioVisita.textContent = formatarDataHora(card.visita_horario);

    renderizarRoteiro(card);
    renderizarAlunos(card, faltantesAtual);
    renderizarCampos(camposResponsavel1, card, faltantesAtual, [
      'responsavel_1_nome',
      'responsavel_1_telefone',
      'responsavel_1_email',
    ]);
    renderizarCampos(camposResponsavel2, card, faltantesAtual, [
      'responsavel_2_nome',
      'responsavel_2_telefone',
      'responsavel_2_email',
    ]);
    renderizarCampos(camposOrigem, card, faltantesAtual, [
      'origem',
      'utm_campaign',
      'utm_source',
      'utm_medium',
      'gclid',
    ]);

    var temNecessidade =
      card.necessidade_especial &&
      card.necessidade_especial.toLowerCase() !== 'não' &&
      card.necessidade_especial.toLowerCase() !== 'nao';
    if (temNecessidade) {
      blocoNecessidade.hidden = false;
      renderizarCampos(camposNecessidade, card, faltantesAtual, [
        'necessidade_especial',
        'necessidade_especial_obs',
      ]);
    } else {
      blocoNecessidade.hidden = true;
    }

    btnSalvar.hidden = faltantesAtual.length === 0;

    conteudoCard.hidden = false;
    mensagemCarregando.hidden = true;
  }

  function coletarCamposPreenchidos() {
    var campos = {};
    var inputs = document.querySelectorAll('.campo-faltante-input');
    inputs.forEach(function (input) {
      var valor = input.value.trim();
      if (valor.length > 0) {
        campos[input.dataset.chave] = valor;
      }
    });
    return campos;
  }

  function enviarAtualizacao(fields, moverParaFeitaVisita, botaoClicado, textoOriginal) {
    mensagemErroSalvar.textContent = '';
    botaoClicado.disabled = true;

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
      .catch(function (erro) {
        if (erro && erro.message === 'nao_autenticado') return null;
        mensagemErroSalvar.textContent = erro.message || 'Não foi possível salvar. Tente novamente.';
        throw erro;
      })
      .finally(function () {
        botaoClicado.disabled = false;
        botaoClicado.textContent = textoOriginal;
      });
  }

  btnSalvar.addEventListener('click', function () {
    var campos = coletarCamposPreenchidos();
    var textoOriginal = btnSalvar.textContent;
    btnSalvar.textContent = 'Salvando...';
    enviarAtualizacao(campos, false, btnSalvar, textoOriginal)
      .then(function (resultado) {
        if (!resultado) return;
        mensagemErroSalvar.textContent = '';
      })
      .catch(function () {});
  });

  btnRealizada.addEventListener('click', function () {
    var campos = coletarCamposPreenchidos();
    var textoOriginal = btnRealizada.textContent;
    btnRealizada.textContent = 'Salvando...';
    enviarAtualizacao(campos, true, btnRealizada, textoOriginal)
      .then(function (resultado) {
        if (!resultado) return;
        mensagemSucesso.hidden = false;
        btnRealizada.hidden = true;
        btnSalvar.hidden = true;
        linkVoltarAgenda.style.display = 'block';
      })
      .catch(function () {});
  });

  function carregarCard() {
    if (!idVisita) {
      textoErroCarregamento.textContent = 'Visita não encontrada.';
      mensagemCarregando.hidden = true;
      mensagemErroTela.hidden = false;
      return;
    }

    mensagemCarregando.hidden = false;
    mensagemErroTela.hidden = true;
    conteudoCard.hidden = true;

    fetchAutenticado('/api/visitas/card?id=' + encodeURIComponent(idVisita))
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
        renderizarCard(corpo.card, corpo.faltantes || []);
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

  btnTentarNovamente.addEventListener('click', carregarCard);

  carregarCard();
})();
