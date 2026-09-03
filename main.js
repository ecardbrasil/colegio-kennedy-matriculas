/* =============================================================
   COLÉGIO KENNEDY — main.js
   ============================================================= */

'use strict';

// ─── CONFIGURAÇÃO ────────────────────────────────────────────
const CONFIG = {
  // ⚠️  SUBSTITUIR pela URL real do webhook do Make
  WEBHOOK_URL: 'https://hook.us2.make.com/y8xbso3x3tz77mnn79whh9k7tk7vqhzb',
  WHATSAPP_NUMBER: '555133641142',
};

// Máximo de filhos por envio (mapeado 1:1 com os campos nome_aluno_1..N / serie_1..N no Pipefy)
const MAX_ALUNOS = 4;

// Opções de série reaproveitadas em cada bloco de aluno criado dinamicamente
const SERIE_OPTIONS_HTML = `
  <option value="" disabled selected>Selecione a etapa</option>

  <optgroup label="👶 Berçário">
    <option value="Berçário">Berçário</option>
  </optgroup>

  <optgroup label="🧒 Educação Infantil">
    <option value="1 ano de idade">1 ano de idade</option>
    <option value="2 anos de idade">2 anos de idade</option>
    <option value="3 anos de idade">3 anos de idade</option>
    <option value="4 anos de idade">4 anos de idade</option>
    <option value="5 anos de idade">5 anos de idade</option>
  </optgroup>

  <optgroup label="📗 Ensino Fundamental — Anos Iniciais (1º ao 5º)">
    <option value="1 ano do Fundamental">1º ano do Fundamental</option>
    <option value="2 ano do Fundamental">2º ano do Fundamental</option>
    <option value="3 ano do Fundamental">3º ano do Fundamental</option>
    <option value="4 ano do Fundamental">4º ano do Fundamental</option>
    <option value="5 ano do Fundamental">5º ano do Fundamental</option>
  </optgroup>

  <optgroup label="📘 Ensino Fundamental — Anos Finais (6º ao 9º)">
    <option value="6 ano do Fundamental">6º ano do Fundamental</option>
    <option value="7 ano do Fundamental">7º ano do Fundamental</option>
    <option value="8 ano do Fundamental">8º ano do Fundamental</option>
    <option value="9 ano do Fundamental">9º ano do Fundamental</option>
  </optgroup>

  <optgroup label="🎓 Ensino Médio">
    <option value="1 ano do Ensino Médio">1º ano do Ensino Médio</option>
    <option value="2 ano do Ensino Médio">2º ano do Ensino Médio</option>
    <option value="3 ano do Ensino Médio">3º ano do Ensino Médio</option>
  </optgroup>
`;

// ─── INICIALIZAÇÃO ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  captureUrlParams();
  setupPhoneMask();
  setupAlunos();
  setupForm();
  setupModal();
  animateCounters();
  document.getElementById('anoAtual').textContent = new Date().getFullYear();
});

// ─── CAPTURA DE GCLID E UTMs ──────────────────────────────────
function captureUrlParams() {
  const params = new URLSearchParams(window.location.search);

  const keys = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  keys.forEach((key) => {
    const value = params.get(key) || '';

    // Salva no sessionStorage para persistir entre redirecionamentos leves
    if (value) {
      sessionStorage.setItem(key, value);
    }

    // Preenche o campo hidden correspondente (sessionStorage como fallback)
    const stored = value || sessionStorage.getItem(key) || '';
    const field = document.getElementById(`field_${key}`);
    if (field) field.value = stored;
  });
}

// ─── MÁSCARA DE TELEFONE ──────────────────────────────────────
function setupPhoneMask() {
  const tel = document.getElementById('telefone');
  if (!tel) return;

  tel.addEventListener('input', () => {
    let v = tel.value.replace(/\D/g, '');

    // Remove o "55" (código do país) colado/digitado por engano antes do DDD,
    // ex: usuário copia do WhatsApp "+55 51 98444-8344" -> "55519844483 44"
    if (v.length > 11 && v.startsWith('55')) {
      v = v.slice(2);
    }

    v = v.slice(0, 11);
    if (v.length <= 10) {
      // (00) 0000-0000
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) =>
        c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : ''
      );
    } else {
      // (00) 00000-0000
      v = v.replace(/^(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) =>
        c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : ''
      );
    }
    tel.value = v;
  });
}

// ─── ALUNOS (SUPORTE A MÚLTIPLOS FILHOS) ──────────────────────
function setupAlunos() {
  const wrapper    = document.getElementById('alunosWrapper');
  const btnAdd     = document.getElementById('btnAddAluno');
  if (!wrapper) return;

  // Preenche o <select> de série do primeiro bloco (já existe no HTML)
  wrapper.querySelectorAll('select[id^="serie_"]').forEach((select) => {
    select.innerHTML = SERIE_OPTIONS_HTML;
  });

  btnAdd?.addEventListener('click', () => {
    const total = wrapper.querySelectorAll('.aluno-block').length;
    if (total >= MAX_ALUNOS) return;
    wrapper.insertAdjacentHTML('beforeend', criarBlocoAlunoHTML(total + 1));
    atualizarBlocosAlunos();
  });

  // Delegação para o botão "Remover" (blocos são criados dinamicamente)
  wrapper.addEventListener('click', (e) => {
    const btnRemove = e.target.closest('.btn-remove-aluno');
    if (!btnRemove) return;
    btnRemove.closest('.aluno-block')?.remove();
    atualizarBlocosAlunos();
  });
}

function criarBlocoAlunoHTML(index) {
  return `
    <div class="aluno-block" data-aluno-index="${index}">
      <div class="aluno-block-header">
        <span class="aluno-block-title">Aluno ${index}</span>
        <button type="button" class="btn-remove-aluno">Remover</button>
      </div>
      <div class="form-group">
        <label for="nome_aluno_${index}">Nome do aluno *</label>
        <input type="text" id="nome_aluno_${index}" name="nome_aluno_${index}" placeholder="Ex: João Silva" required />
        <span class="error-msg" id="err-nome_aluno_${index}"></span>
      </div>
      <div class="form-group">
        <label for="serie_${index}">Em qual turma ou etapa vai estudar? *</label>
        <select id="serie_${index}" name="serie_${index}" required>${SERIE_OPTIONS_HTML}</select>
        <span class="error-msg" id="err-serie_${index}"></span>
      </div>
    </div>
  `;
}

// Renumera os blocos (ids, labels, título) para manter sequência 1..N contígua
// e atualiza a visibilidade dos botões "Remover" / "+ Adicionar outro filho"
function atualizarBlocosAlunos() {
  const wrapper = document.getElementById('alunosWrapper');
  const btnAdd  = document.getElementById('btnAddAluno');
  const blocos  = [...wrapper.querySelectorAll('.aluno-block')];

  blocos.forEach((bloco, i) => {
    const index = i + 1;
    bloco.dataset.alunoIndex = String(index);
    bloco.querySelector('.aluno-block-title').textContent = `Aluno ${index}`;

    const nomeInput  = bloco.querySelector('input[id^="nome_aluno_"]');
    const nomeLabel  = bloco.querySelector('label[for^="nome_aluno_"]');
    const nomeErr     = bloco.querySelector('span[id^="err-nome_aluno_"]');
    nomeInput.id = nomeInput.name = `nome_aluno_${index}`;
    nomeLabel.htmlFor = `nome_aluno_${index}`;
    nomeErr.id = `err-nome_aluno_${index}`;

    const serieSelect = bloco.querySelector('select[id^="serie_"]');
    const serieLabel  = bloco.querySelector('label[for^="serie_"]');
    const serieErr    = bloco.querySelector('span[id^="err-serie_"]');
    serieSelect.id = serieSelect.name = `serie_${index}`;
    serieLabel.htmlFor = `serie_${index}`;
    serieErr.id = `err-serie_${index}`;

    const btnRemove = bloco.querySelector('.btn-remove-aluno');
    if (btnRemove) btnRemove.hidden = index === 1;
  });

  if (btnAdd) btnAdd.hidden = blocos.length >= MAX_ALUNOS;
}

// ─── FORMULÁRIO ───────────────────────────────────────────────
function setupForm() {
  const form      = document.getElementById('leadForm');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnRetry  = document.getElementById('btnRetry');

  if (!form) return;

  form.addEventListener('submit', handleSubmit);
  btnRetry?.addEventListener('click', () => {
    showView('form');
  });

  // Limpa erro individual ao digitar/selecionar (delegação, cobre blocos de aluno dinâmicos)
  form.addEventListener('input', (e) => {
    if (e.target.matches('input, select')) clearFieldError(e.target);
  });
  form.addEventListener('change', (e) => {
    if (e.target.matches('select')) clearFieldError(e.target);
  });
}

async function handleSubmit(e) {
  e.preventDefault();

  if (!validateForm()) return;

  setSubmitting(true);

  const payload = buildPayload();

  try {
    const res = await fetch(CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    onSuccess(payload);
  } catch (err) {
    console.error('[Kennedy] Erro no envio:', err);
    onError();
  } finally {
    setSubmitting(false);
  }
}

function getAlunos() {
  const blocos = [...document.querySelectorAll('#alunosWrapper .aluno-block')];
  return blocos.map((bloco) => ({
    nome:  bloco.querySelector('input[id^="nome_aluno_"]')?.value?.trim() ?? '',
    serie: bloco.querySelector('select[id^="serie_"]')?.value ?? '',
  }));
}

function buildPayload() {
  const get = (id) => document.getElementById(id)?.value?.trim() ?? '';
  const alunos = getAlunos();

  const payload = {
    nome:             get('nome'),
    telefone:         get('telefone'),
    email:            get('email'),
    quantidade_alunos: alunos.length,
    resumo_alunos:    alunos.map((a) => `${a.nome} — ${a.serie}`).join('; '),
    gclid:            get('field_gclid'),
    utm_source:       get('field_utm_source'),
    utm_medium:       get('field_utm_medium'),
    utm_campaign:     get('field_utm_campaign'),
    utm_term:         get('field_utm_term'),
    utm_content:      get('field_utm_content'),
    timestamp:        new Date().toISOString(),
    page_url:         window.location.href,
  };

  // Campos numerados nome_aluno_1..N / serie_1..N (mapeados 1:1 no Pipefy) +
  // nome_aluno/serie legados (aluno 1), mantidos para compatibilidade com campos já existentes
  for (let i = 1; i <= MAX_ALUNOS; i++) {
    const aluno = alunos[i - 1];
    payload[`nome_aluno_${i}`] = aluno?.nome ?? '';
    payload[`serie_${i}`]      = aluno?.serie ?? '';
  }
  payload.nome_aluno = payload.nome_aluno_1;
  payload.serie      = payload.serie_1;

  return payload;
}

function onSuccess(payload) {
  showView('success');

  // Dispara evento de conversão no dataLayer (Google Tag Manager)
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event:             'lead_form_submit',
    form_name:         'matriculas_kennedy',
    serie:             payload.serie,
    nome_aluno:        payload.nome_aluno,
    quantidade_alunos: payload.quantidade_alunos,
    gclid:             payload.gclid,
    utm_source:        payload.utm_source,
    utm_medium:        payload.utm_medium,
    utm_campaign:      payload.utm_campaign,
  });

  redirectToWhatsApp(payload);
}

function redirectToWhatsApp(payload) {
  const alunos = getAlunos();

  const infoAlunos =
    alunos.length <= 1
      ? `para ${payload.serie}`
      : `para meus filhos: ${alunos.map((a) => `${a.nome} (${a.serie})`).join(' e ')}`;

  const mensagem =
    `Olá, Diego, me chamo ${payload.nome}, vim através do site do colégio ` +
    `e gostaria de saber mais informações ${infoAlunos}.`;

  const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;

  setTimeout(() => {
    window.location.href = url;
  }, 1500);
}

function onError() {
  showView('error');
}

// ─── ESTADOS DA UI ─────────────────────────────────────────────
function showView(view) {
  const form    = document.getElementById('leadForm');
  const success = document.getElementById('formSuccess');
  const error   = document.getElementById('formErrorState');

  form.hidden    = view !== 'form';
  success.hidden = view !== 'success';
  error.hidden   = view !== 'error';
}

function setSubmitting(loading) {
  const btn     = document.getElementById('btnSubmit');
  const txtNorm = btn?.querySelector('.btn-text');
  const txtLoad = btn?.querySelector('.btn-loading');

  if (!btn) return;

  btn.disabled      = loading;
  txtNorm.hidden    = loading;
  txtLoad.hidden    = !loading;
}

// ─── VALIDAÇÃO ────────────────────────────────────────────────
function validateForm() {
  let valid = true;

  const nome = document.getElementById('nome');
  if (!nome.value.trim() || nome.value.trim().split(' ').length < 2) {
    setFieldError(nome, 'Informe seu nome completo');
    valid = false;
  }

  const tel = document.getElementById('telefone');
  const telRaw = tel.value.replace(/\D/g, '');
  if (!isValidPhone(telRaw)) {
    setFieldError(tel, 'Telefone inválido, verifique o DDD e o número');
    valid = false;
  }

  const email = document.getElementById('email');
  const emailValue = email.value.trim();
  if (emailValue && !isValidEmail(emailValue)) {
    setFieldError(email, 'E-mail inválido');
    valid = false;
  }

  document.querySelectorAll('#alunosWrapper .aluno-block').forEach((bloco) => {
    const nomeAluno = bloco.querySelector('input[id^="nome_aluno_"]');
    if (!nomeAluno.value.trim()) {
      setFieldError(nomeAluno, 'Informe o nome do aluno');
      valid = false;
    }

    const serie = bloco.querySelector('select[id^="serie_"]');
    if (!serie.value) {
      setFieldError(serie, 'Selecione uma série');
      valid = false;
    }
  });

  return valid;
}

function isValidPhone(telRaw) {
  if (telRaw.length < 10 || telRaw.length > 11) return false;

  // Celular (11 dígitos): 3º dígito é sempre 9, e o 4º nunca é 0, 1 ou 2.
  if (telRaw.length === 11) {
    const primeiroDigito = telRaw[2];
    const segundoDigito  = telRaw[3];
    if (primeiroDigito !== '9') return false;
    if (['0', '1', '2'].includes(segundoDigito)) return false;
  }

  return true;
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function setFieldError(el, msg) {
  el.classList.add('invalid');
  const errEl = document.getElementById(`err-${el.id}`);
  if (errEl) errEl.textContent = msg;
}

function clearFieldError(el) {
  el.classList.remove('invalid');
  const errEl = document.getElementById(`err-${el.id}`);
  if (errEl) errEl.textContent = '';
}

// ─── SCROLL SUAVE PARA FORMULÁRIO ─────────────────────────────
function scrollToForm(e) {
  e.preventDefault();
  document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Expor globalmente (chamado via onclick no HTML)
window.scrollToForm = scrollToForm;

// ─── ANIMAÇÃO DE CONTADORES ───────────────────────────────────
function animateCounters() {
  const counters = document.querySelectorAll('.numero-valor[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        runCounter(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

function runCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const duration = 1800; // ms
  const start    = performance.now();
  const suffix   = el.dataset.suffix ?? '';

  const tick = (now) => {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = easeOutQuart(progress);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

// ─── MODAL: POLÍTICA DE PRIVACIDADE ───────────────────────────
function setupModal() {
  const modal = document.getElementById('modalPolitica');
  const btnOpen = document.getElementById('btnPolitica');
  const btnOpenFooter = document.getElementById('btnPoliticaFooter');
  const btnClose = document.getElementById('btnFecharPolitica');
  if (!modal || (!btnOpen && !btnOpenFooter)) return;

  const abrir = () => { modal.hidden = false; };
  const fechar = () => { modal.hidden = true; };

  btnOpen?.addEventListener('click', abrir);
  btnOpenFooter?.addEventListener('click', abrir);
  btnClose?.addEventListener('click', fechar);
  modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) fechar(); });
}
