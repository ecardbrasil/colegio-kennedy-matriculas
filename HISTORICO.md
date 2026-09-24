# 📋 Histórico do Projeto — Landing Page Matrículas Colégio Kennedy

> Documento de continuidade. Leia isto antes de retomar o trabalho — evita repetir passos já feitos.

## Visão geral do projeto

Landing page de captura de leads (matrículas) para o Colégio Kennedy, feita para rodar campanhas
de Google Ads. Stack: HTML/CSS/JS puro (`index.html`, `style.css`, `main.js`), hospedada na Vercel,
com o formulário enviando dados via webhook pro n8n (`https://n8n.colegiokennedy.top/webhook/formulario-ck-pipefy`),
que cria o card no Pipefy. Antes rodava via Make (Integromat); trocado em 24/09/2026 (ver seção "17").

**URL em produção**: https://www.colegiokennedy.top/
(domínio raiz `colegiokennedy.top` redireciona 308 pra `www`)

## Branches do repositório

- **`claude/kennedy-landing-page-je9uds`** — branch padrão do repo (HEAD), é o que a **Vercel publica
  em produção**. Sempre que algo for concluído, precisa ser mesclado (fast-forward) pra cá.
- **`claude/landing-page-status-vznjg8`** — branch de desenvolvimento desta sessão, onde os commits
  são feitos primeiro.
- Fluxo usado: commit em `vznjg8` → push → checkout `je9uds` → merge (fast-forward) → push → volta
  pra `vznjg8`. Os dois ficam sempre sincronizados no final de cada tarefa.

## O que já está concluído

### 1. Google Tag Manager — ✅ completo
- Contêiner criado: **GTM-PKM2DPSS**
- ID substituído no `index.html` (script + noscript)
- Conversão criada no Google Ads: categoria "Enviar formulário de lead"
  - **ID de conversão**: `AW-17633043754`
  - **Rótulo de conversão**: `4QvMCM_n1OwcEKrKi9hB`
  - Contagem: "Uma" (não "Todas")
  - Sem valor monetário atribuído (decisão consciente — ver seção "Decisões e observações" abaixo)
- Tags criadas no GTM:
  - **"Google Ads - Conversão Lead Matrículas"** (tipo: Acompanhamento de conversões do Google Ads,
    acionador: evento personalizado `lead_form_submit`)
  - **"Vinculador de conversões do Google Ads"** (acionador: All Pages)
- Testado no Tag Assistant / modo Preview: tag disparou "Concluída" no evento `lead_form_submit`
- **Publicado**: Versão 2 do contêiner GTM (02/09/2026, por vinicius@colegiokennedy.com)
- O evento `lead_form_submit` já é disparado pelo `main.js` (função `onSuccess`, dataLayer.push)
  sem precisar de nenhuma mudança de código — já estava lá desde o início do projeto.

### 2. Webhook Make → Pipefy — ✅ completo
- Cenário no Make com módulo Webhook, conectado ao Pipefy (Pipe: **CK 2027**)
- `CONFIG.WEBHOOK_URL` em `main.js` já aponta pra URL real do Make
- Campos criados no Pipefy (todos como texto curto, na fase "1. Novo Contato"):
  GCLID, UTM Source, UTM Medium, UTM Campaign, UTM Term, UTM Content, Série de Interesse,
  URL da Página, Data/Hora do Lead
  (Nome, Nome do Aluno, Telefone/WhatsApp, E-mail já existiam antes)
- Mapeamento completo confirmado no módulo Pipefy do Make
- **Testado e validado end-to-end**: formulário na Vercel → Make → card no Pipefy com todos os
  campos preenchidos corretamente (GCLID, UTMs, série, URL, timestamp)
- **Atenção**: já aconteceu do mapeamento no Make "sumir"/não salvar antes — sempre clicar em
  Salvar no cenário do Make antes de sair da tela, e conferir depois reabrindo

### 2.1 Suporte a múltiplos filhos no formulário — código pronto, config manual pendente
- Motivo: famílias com 2+ filhos matriculando ao mesmo tempo só conseguiam informar 1 aluno. A
  decisão (validada com o Vinicius) foi manter **1 card por família no Pipefy** (não 1 card por
  aluno), e manter a conversão do Google Ads/GTM disparando **1x por envio** independente da
  quantidade de filhos — só o payload interno mudou, não a lógica de conversão.
- `index.html`: bloco `nome_aluno`/`serie` virou uma seção repetível `#alunosWrapper`, com botão
  "+ Adicionar outro filho" (`#btnAddAluno`), limite de 4 blocos (`MAX_ALUNOS` em `main.js`).
- `main.js`: novas funções `setupAlunos()`, `criarBlocoAlunoHTML()`, `atualizarBlocosAlunos()`
  (cria/remove/renumera blocos), `getAlunos()` (lê os blocos do DOM). `validateForm()` agora valida
  cada bloco de aluno; `buildPayload()` monta `nome_aluno_1..4`/`serie_1..4` (mapeamento 1:1 com o
  Pipefy, campos vazios quando não usados) + `quantidade_alunos` (número) + `resumo_alunos` (texto
  legível tipo "João — 5º ano; Maria — 2 anos"). Mantém `nome_aluno`/`serie` (campos Pipefy já
  existentes) preenchidos com os dados do aluno 1, pra não quebrar nada que já dependa deles.
  `redirectToWhatsApp()` e a mensagem do WhatsApp citam todos os filhos quando há mais de 1.
- **Por que campos numerados fixos (1..4) e não um array JSON**: Pipefy não tem campo nativo de
  "grupo repetível" no plano usado, e o Make mapeia campo a campo (não itera array sem módulo
  Iterator extra). Campos numerados fixos mantêm o mapeamento no Make igual ao que já existe hoje
  (1:1, sem Iterator/Router) — menor risco dado que o mapeamento do Make já "sumiu" silenciosamente
  antes (ver seção "Problema encontrado e resolvido" abaixo).
- **PENDENTE (ver item 2.1 do CHECKLIST.md)**: criar os campos novos no Pipefy (`Nome do Aluno
  2/3/4`, `Série de Interesse 2/3/4`, `Quantidade de Alunos` como **numérico**, `Resumo dos Alunos`
  como texto longo) e mapear no Make. **Sem isso, os dados do 2º filho em diante são enviados no
  payload do webhook mas não aparecem no card do Pipefy** — o formulário no site já funciona, falta
  só o lado Make/Pipefy.
- Métrica de "matrículas" vs "leads": a ideia é que o Pipefy tenha um relatório somando o campo
  `Quantidade de Alunos` (= total de matrículas), separado da contagem de cards (= total de
  leads/famílias). Isso é config nativa de relatório no Pipefy, não precisa de código.

### 3. Domínio personalizado — ✅ completo
- Domínio: `colegiokennedy.top` (hospedado/DNS na **Hostgator**)
- Adicionado na Vercel: `colegiokennedy.top` e `www.colegiokennedy.top`, ambos "Valid Configuration"
- DNS ajustado na Hostgator (cPanel → Zone Editor):
  - Editado o registro **A existente** de `colegiokennedy.top.` (estava com IP antigo
    `69.6.249.212`, da hospedagem antiga) para o **IP da Vercel** (confirmar na tela de
    Settings → Domains da Vercel se precisar reconferir, era `76.76.21.21`)
  - **Não foi necessário mexer no CNAME de `www`** — ele já apontava `www → colegiokennedy.top`,
    então seguiu automaticamente o domínio raiz depois da edição do A
  - **Não foram tocados**: MX, registro A do `mail.`, CNAMEs de `ftp`/`cpanel`/`webmail` (e-mail
    da instituição roda por ali, não pode quebrar)
- `<link rel="canonical" href="https://www.colegiokennedy.top/" />` adicionado no `index.html`

### 4. Google Ads — auto-tagging — ✅ completo
- Confirmado em Configurações da conta → **"Codificação automática: Sim"** (é o nome em
  português pro "auto-tagging" — já vem ativado por padrão, não precisou mudar nada)
- Isso garante que o `gclid` é anexado automaticamente em toda URL de destino dos anúncios,
  e o `main.js` já captura esse parâmetro (`captureUrlParams()`)
- **Pendência futura** (não bloqueia nada agora): importar conversões offline no Google Ads
  usando o GCLID capturado, quando já houver leads reais convertidos em matrícula no Pipefy

### 5. SEO — parcialmente completo
- ✅ Meta description (já estava com copy real desde o início)
- ✅ Canonical adicionado (ver item 3)
- ⬜ Favicon ainda não criado/referenciado
- ⬜ Open Graph tags (opcional)
- **Observação**: a página tem `<meta name="robots" content="noindex, nofollow">` — bloqueia
  indexação orgânica. Isso é intencional pra landing page de tráfego pago (prática comum), mas
  vale confirmar com quem decide se é isso mesmo que se quer.

### 6. Teste final (item 9 do CHECKLIST.md) — parcialmente completo
- ✅ Testado com `?gclid=TESTE123&utm_source=google&utm_medium=cpc&utm_campaign=matriculas`
- ✅ Campos hidden confirmados preenchidos via DevTools
- ✅ Formulário enviado e chegou correto no Pipefy (depois de resolver um erro do Make, ver abaixo)
- ✅ Evento `lead_form_submit` disparando no dataLayer, confirmado no Tag Assistant
- ⬜ **Teste em mobile (360px) e desktop** — ainda não feito
- ⬜ **PageSpeed Insights** (meta: LCP < 2.5s, Performance > 90) — ainda não feito

## Problema encontrado e resolvido durante os testes

Ao testar o formulário pela primeira vez após adicionar os campos novos no Pipefy, o site mostrou
a tela de sucesso normalmente, mas **o card não apareceu no Pipefy**. Investigando o histórico de
execuções do Make (exportado como CSV), a execução automática (`type: auto`) daquele envio específico
aparecia com `statusLabel: error` — ou seja, o front-end funcionou (o `fetch` recebeu resposta HTTP
ok), mas o **cenário do Make quebrou internamente** ao tentar processar/mapear os campos novos.
Depois de reabrir o cenário no Make e confirmar/salvar o mapeamento de novo, um novo teste funcionou
perfeitamente e o card apareceu no Pipefy com todos os campos certos.

**Lição pra próxima vez que algo assim acontecer**: não basta ver a tela de sucesso no site — isso só
confirma que o servidor do Make respondeu HTTP 200, não que o cenário completou sem erro. Sempre
conferir também (a) o histórico de execuções do Make (aba History do cenário) e (b) se o card
realmente apareceu no Pipefy.

## O que ainda falta (pendências do CHECKLIST.md)

### Item 3 — Identidade visual (não iniciado)
- Substituir cores em `style.css` (bloco `:root`) pelas cores reais da marca
- Adicionar logo em `assets/images/logo.webp` (a pasta `assets/` nem existe ainda — hoje dá 404
  no console, junto com o favicon)
- Ajustar nome "Colégio Kennedy" nos textos se necessário

### Item 4 — Conteúdo real (não iniciado)
- Headline do hero, lista de séries oferecidas, 5 cards de diferenciais — conferir se refletem a
  oferta real do colégio
- Números animados (`data-target` no index.html: alunos, anos, aprovação, professores) — hoje são
  valores fictícios/placeholder
- **Os 3 depoimentos são fictícios** ("Ana Paula M.", "Carlos Roberto S.", "Fernanda L.") — precisam
  virar depoimentos reais com autorização por escrito
- Endereço completo, telefone, e-mail e CNPJ reais no footer
- Definir o ano da matrícula na headline (hoje está "2025" no `<title>` e no H1 — considerar se não
  deveria ser 2026, já que estamos em setembro de 2026)

### Item 5 — SEO (resto)
- Favicon
- Open Graph (opcional)

### Item 9 — Teste final (resto)
- Testar em mobile (360px) e desktop
- Rodar PageSpeed Insights

## Decisões e observações importantes tomadas ao longo do processo

1. **Valor de conversão no Google Ads**: decidimos **não atribuir valor monetário** à conversão de
   formulário. Uma matrícula vale ~R$10.000/ano pro colégio, mas isso é o valor de uma **matrícula
   confirmada**, não de um simples envio de formulário (nem todo lead vira matrícula). Atribuir
   R$10.000 por lead distorceria qualquer otimização futura baseada em valor (Target ROAS, Maximizar
   valor de conversão). Se um dia quiser usar valor, o certo é `10.000 × taxa de conversão
   lead→matrícula` (essa taxa ainda não foi levantada).
2. **Campo "valor padrão" na config de conversão**: setado como `0` (não `1`), coerente com a decisão
   acima de não usar valor.
3. **Ação primária vs secundária**: a conversão de formulário foi configurada como **ação primária**
   (usada para otimização de lances) — é a conversão mais importante do funil hoje.
4. Google Ads já tem outras fontes de conversão configuradas antes desse projeto: chamadas
   telefônicas e conversões off-line via **Zapier** — não mexemos nelas, ficaram intactas.
5. O domínio `colegiokennedy.top` já tinha e-mail corporativo configurado na Hostgator
   (`contato@colegiokennedy.top` etc.) — todo o cuidado no DNS foi pra não quebrar isso.

## Arquivos-chave do projeto

- `index.html` — estrutura da página, formulário, GTM snippet, meta tags
- `main.js` — captura de UTM/GCLID, máscara de telefone, envio do formulário (fetch pro Make),
  disparo do evento `lead_form_submit` no dataLayer
- `style.css` — estilos (cores ainda placeholder, pendente item 3)
- `CHECKLIST.md` — checklist oficial de "antes de publicar", atualizado a cada item concluído
- `HISTORICO.md` — este arquivo

### 7. CRO/Copy do hero e prova social — ✅ implementado (03/09/2026)
- Análise usando as skills `cro` e `copywriting` mostrou que a headline original ("Matrículas
  Abertas 2027 – Garanta a Vaga do Seu Filho!") liderava com processo administrativo em vez de
  benefício/prova social, e que a nota do Google (prova social forte) não aparecia perto do
  formulário, onde mais reduz fricção de decisão.
- Headline do hero trocada para "58 Anos Formando Alunos Prontos Para o Futuro" / subheadline
  "Matrículas abertas para 2027 — do Berçário ao Ensino Médio, em Porto Alegre." ([index.html](index.html),
  bloco `.hero-headline`/`.hero-sub`). `<title>` e tags Open Graph mantidos como estavam
  (continuam citando "Matrículas Abertas 2027" para SEO/compartilhamento).
- Adicionado bloco de prova social (`.social-proof-strip`) acima do título do formulário: nota
  "4,9 ★★★★★ · +300 avaliações no Google" com um stack de avatares circulares sobrepostos.
  **Os avatares são placeholders** (círculos coloridos com iniciais, via HTML/CSS inline — não há
  fotos reais de avaliadores em `assets/images/` ainda). Confirmado com o usuário que os números
  58 anos/10+ espaços/4,9★+300 avaliações são dados reais e aprovados pelo colégio (o CHECKLIST.md
  estava desatualizado nesse ponto — os depoimentos/badges do HTML já eram reais).
- Estilos novos em `style.css`: `.social-proof-strip`, `.avatar-stack`, `.avatar`,
  `.social-proof-text` (reaproveitam as cores de `:root` já existentes, nenhuma cor nova
  introduzida).
- **Pendente**: trocar os avatares placeholder por fotos reais de avaliadores quando o usuário
  fornecer (ver item 4 do CHECKLIST.md).
- Nenhuma mudança em `main.js` — cache-busting (`?v=`) não precisou de bump.

### 8. Rodada 2 de CRO/Copy — grupos paralelos — ✅ implementado (03/09/2026)
Segunda leva de melhorias de CRO/copy, desta vez com o usuário pedindo execução paralela: 5 grupos
de tarefas independentes, cada um implementado por um agente gerente (Sonnet 5, podendo delegar
sub-passos simples a agentes Haiku) trabalhando em uma **git worktree isolada própria** (evita
conflito de merge entre grupos editando os mesmos arquivos ao mesmo tempo, já que o projeto não
tem build step — é HTML/CSS/JS monolítico). Fluxo usado: commit do estado pendente da rodada 1 →
criação de 5 worktrees (`../ck-grupo-a` a `../ck-grupo-e`) a partir desse commit, cada uma numa
branch nova (`claude/grupo-a-confianca` … `claude/grupo-e-footer`) → 5 agentes em paralelo → merge
sequencial (A→B→C→D→E) na branch principal, feito manualmente por mim (orquestrador), resolvendo
os conflitos que surgiram → worktrees e branches auxiliares removidas após o merge.

**Grupo A — selo de confiança discreto** (`index.html`, `style.css`): adicionado `.response-badge`
entre o botão de envio e o texto de privacidade, com texto "Tempo médio de resposta monitorado: 32
segundos". Decisão importante: o usuário pediu inicialmente um selo estilo "auditoria de empresa
terceirizada", mas confirmamos que não existe essa auditoria real — o texto ficou genérico, sem
nome de auditor fictício (evita alegação verificável falsa), e discreto (`--color-muted`, sem
pill/fundo chamativo), como pedido explicitamente.

**Grupo B — redução de fricção do formulário** (`index.html`, `main.js`): e-mail tornado opcional
(`required` removido, label "E-mail (opcional)", `validateForm()` só valida formato se preenchido);
label "Em qual série vai estudar?" trocado por "Em qual turma ou etapa vai estudar?" em dois
lugares que precisam ficar idênticos — bloco estático do Aluno 1 em `index.html` e o template
`criarBlocoAlunoHTML()` em `main.js` (blocos 2-4, dinâmicos).

**Grupo C — copy de CTA, objeções e diferenciais** (`index.html`, `style.css`): botão do CTA
secundário alinhado com o botão principal ("Quero garantir a vaga!"); parágrafo do CTA secundário
menciona bolsas/condições sem revelar valores; reforço de prova social citando "300 famílias · 4,9★
no Google" no CTA secundário; vídeo de depoimento (`8DBYEh701Cs`) embedado na seção de prova social
via **lite-embed/facade** (thumbnail `hqdefault.jpg` + botão play SVG; iframe real só é criado no
clique, via `onclick="this.outerHTML=...`) — decisão deliberada para não pagar o custo de
performance/LCP de um `<iframe>` do YouTube carregado antecipadamente; títulos dos 5 cards de
diferenciais reescritos com foco em benefício (ex. "Ambientes Inovadores" → "Aprender Fazendo, Não
Só Decorando").

**Grupo D — escassez, CTA sticky e hierarquia visual** (`index.html`, `style.css`): aviso de
escassez **sem número específico de vagas** (`.hero-escassez`, com um indicador de pulso puramente
CSS via `@keyframes` — restrição explícita do usuário, contra política do colégio revelar número de
vagas restantes); CTA fixo (`sticky-cta`) no rodapé da viewport, visível só em mobile
(`@media max-width:768px`), reaproveitando `scrollToForm()` já existente (nenhum JS novo); badge
"58 anos de excelência em educação" destacado visualmente entre os 4 selos do hero (classe
`hero-badges-destaque`, cor de destaque + peso maior), reforçando a mesma mensagem da headline.

**Grupo E — footer, modal, meta e favicon** (`index.html`, `style.css`, `main.js`,
`assets/images/favicon.webp`): favicon real (fornecido pelo usuário, arquivo
`favicon colegio kennedy.webp`) substituindo o SVG inline gerado, com `apple-touch-icon` também;
`<title>`/meta description/Open Graph atualizados para incluir "58 anos" (coerência com a nova
headline); texto de privacidade do formulário virou um botão "Política de Privacidade" que abre um
**modal in-page** (`#modalPolitica`, `setupModal()` novo em `main.js`) — o lead não navega para
fora da landing page; conteúdo do modal é só um placeholder (política real de privacidade ainda não
existe/foi aprovada); CNPJ (`93.012.235/0001-84`, **sem a palavra "CNPJ"**, por pedido explícito do
usuário) e Instagram (`@colegiokennedypoa`, como `<span>` não clicável — não deve tirar o lead da
página) adicionados ao footer.

**Conflitos de merge resolvidos manualmente** (só no merge do Grupo E, os demais foram
fast-forward/auto-merge limpos): o parágrafo `.form-privacy` foi tocado tanto pelo Grupo A (que
inseriu o `.response-badge` logo acima) quanto pelo Grupo E (que reescreveu o próprio texto do
parágrafo para incluir o link do modal) — resolvido mantendo os dois: o badge do Grupo A ficou, e o
texto do Grupo E (com o link) foi usado. Aproveitei a resolução do conflito para também corrigir uma
inconsistência que ficaria se eu só pegasse o texto do Grupo E: o link "Política de Privacidade" já
existente no rodapé do footer (`<a href="/privacidade">`) ainda navegava para uma URL externa
inexistente — troquei por um segundo botão (`#btnPoliticaFooter`) que abre o mesmo modal, e ajustei
`setupModal()` em `main.js` para escutar os dois botões (`#btnPolitica` do formulário e
`#btnPoliticaFooter` do rodapé). O conflito em `style.css` era puramente aditivo (dois blocos novos
sem sobreposição) — resolvido removendo os marcadores e mantendo ambos.

**Cache-busting**: `main.js` foi alterado pelos Grupos B e E — `main.js?v=2` → `main.js?v=3` em
`index.html` (commit separado, após o merge de todos os grupos), conforme convenção do
[CLAUDE.md](CLAUDE.md).

**Pendências desta rodada** — ver seção "10. Rodada 2 de CRO/Copy" do `CHECKLIST.md` para a lista
completa (FAQ, texto real da política de privacidade, notificações fake de leads recentes, mais
fotos do colégio, busca de certificações/selos de autoridade, fotos reais para os avatares de
prova social e para os depoimentos, redução adicional de fricção do form dependente de automação
no Make, e alinhamento futuro entre form multi-step vs. botão WhatsApp direto).

### 9. Rodada 3, ajustes de UI/UX e formulário em 2 etapas, ✅ implementado (03/09/2026)
Terceira leva de melhorias, pedida pelo usuário como uma lista de 13 itens (visual, copy, formulário,
mobile, prova social), com execução paralela por 3 agentes gerentes (Sonnet 5/Opus 5) trabalhando
na MESMA working tree (não em worktrees isoladas como na Rodada 2), cada um com um escopo de
seções/classes CSS exclusivo e não sobreposto em `index.html`/`style.css`/`main.js`, para evitar
conflito de edição simultânea no mesmo arquivo. Dois dos três agentes caíram por sobrecarga
temporária da API (erro 529) nas duas primeiras tentativas e foram relançados com o mesmo escopo
(no modelo padrão, após a segunda queda no Opus) até concluir; nenhuma mudança parcial de uma
tentativa que falhou ficou no working tree (main.js só é tocado no fim de cada tarefa bem-sucedida).

**Agente 1, logo, hero e travessões** (`index.html`, `style.css`, `CLAUDE.md`): removido o fundo
branco atrás da logomarca no cabeçalho e no rodapé (`background`/`padding`/`border-radius` em
`.logo-wrap` e `.footer-logo-img`) — a logo (`assets/images/logo.png`) já tinha transparência real
(PNG RGBA), o fundo branco era só CSS; ícone SVG removido de `.form-title` (ficou só o texto
"Solicite informações grátis"); foto `alunos-kennedy.webp` movida de dentro do form-card
(`.form-photo-badge`, removida) para a seção de Diferenciais, num novo wrapper `.diferenciais-intro`
ao lado do título; `.hero-sub` reescrito em duas linhas com `<br />`, invertendo a ordem para
"Do Berçário ao Ensino Médio em Porto Alegre" primeiro e "Matrículas abertas para 2027..." depois;
travessões (— e –) removidos de praticamente todo o texto visível da página (meta tags, title,
alt texts, headline, endereço no footer). Nova convenção adicionada ao `CLAUDE.md`: nenhum texto
visível da página pode usar travessão.

**Agente 2, barra de vagas e cards** (`index.html`, `style.css`, `main.js`): `.hero-escassez`
redesenhado de texto com bolinha pulsante para uma barra de progresso visual
(`.hero-escassez-barra`/`.hero-escassez-barra-fill`), preenchendo de 0% a 75% com transição suave ao
entrar em viewport (`animateBarraEscassez()`, mesmo padrão de `IntersectionObserver` que
`animateCounters()` já usava) e um shimmer sutil contínuo depois de preenchida — o número 75% nunca
aparece como texto, só visualmente; títulos dos 5 cards de Diferenciais convertidos de Title Case
para sentence case e `font-size` aumentado; figcaptions dos cards de Etapas (Educação Infantil,
Ensino Fundamental, Ensino Médio) quebradas em duas linhas com `<br />` para alinhar visualmente com
"Berçário"; 4º card adicionado a `.numeros-grid` ("+300 avaliações positivas de famílias") pra
completar um grid 2×2 limpo em mobile (antes 3 cards deixavam um "sobrando" sozinho).

**Agente 3, formulário em 2 etapas, política de privacidade e CTA** (`index.html`, `style.css`,
`main.js`, `politica-privacidade.html` novo): formulário dividido visualmente em `#formStep1`
(nome, telefone, e-mail opcional) e `#formStep2` (aluno(s) + submit), ambos dentro do MESMO
`<form id="leadForm">` — decisão importante: `buildPayload()` continua gerando exatamente os mesmos
campos (`nome_aluno_1..4`/`serie_1..4`, legados, gclid/UTMs) e o POST pro Make continua sendo um
único submit final, então a integração com o Pipefy (pipe "CK 2027") não foi alterada, só a
apresentação. Validação de `validateForm()` foi dividida em `validateStep1()`/`validateStep2()`
(reaproveitando `isValidPhone`/`isValidEmail` já existentes) sem duplicar lógica;
`handleSubmit()` revalida a etapa 1 no envio final e volta pra ela se falhar, já que fica `hidden`
durante o preenchimento da etapa 2. Botão "Voltar" adicionado na etapa 2. Página real
`politica-privacidade.html` criada com conteúdo LGPD completo (controlador, dados coletados,
finalidade, base legal, compartilhamento, retenção, direitos do titular, cookies/GTM/gclid/UTM);
o modal `#modalPolitica` (que só tinha texto placeholder) foi removido, e o link "Política de
Privacidade" (form e footer) agora aponta direto pra essa página nova. Título "Por que escolher o
Colégio Kennedy?" corrigido no mobile com um `<br class="title-break">` (só visível `<768px`) pra
quebrar como "Por que escolher o" / "Colégio Kennedy" juntos, em vez de deixar "Kennedy" sozinho.
CTA "Quero garantir a vaga!" trocado por **"Garantir vaga para 2027"** de forma consistente em todos
os botões (sticky mobile, avançar etapa 1, submit final da etapa 2, CTA secundário) — decisão de
copy tomada pelo agente por delegação explícita do usuário.

**Cache-busting**: `main.js` foi alterado pelos Agentes 2 e 3, `main.js?v=3` → `v=4` → `v=5` em
`index.html` (cada agente verificou a versão atual antes de bumpar, evitando colisão).

**Limitação encontrada**: o usuário pediu para acessar o Google Chrome local dele (Google Maps e
Facebook) pra extrair avaliações reais (nome, foto, texto, estrelas) do colégio e usar como prova
social. Não existe ferramenta de automação de navegador/computador disponível nesta sessão/ambiente
— essa etapa não foi feita. Fica pendente o usuário copiar manualmente essas informações (e salvar
as fotos em `assets/images/`) para serem incorporadas à seção de depoimentos numa próxima rodada,
junto com o redesenho pedido do card de depoimentos (versão mais minimalista, com mais avaliações).

**Pendências desta rodada** — ver seção "11. Rodada 3" do `CHECKLIST.md`.

### 10. Rodada 4, ajustes de UI/UX e formulário — ✅ implementado (03/09/2026)
Lista de 11 itens pedidos diretamente pelo usuário, implementados em `index.html`, `style.css` e
`main.js` (cache-busting `v=5` → `v=6`).

**Formulário**: texto "Etapa 1 de 2"/"Etapa 2 de 2" removido (ficava redundante com os dots de
progresso); `#formProgress` agora começa `hidden` e só é exibido em `goToStep(2)` (`main.js`), então
os dots só aparecem na etapa 2, nunca na 1. Título "Solicite informações grátis" removido do
`.form-title` (o próprio `<p>` foi removido do HTML). Label do campo de telefone trocado de
"WhatsApp" para "WhatsApp/Telefone". Botões de avançar/enviar do formulário e o botão do CTA
secundário (antes do footer) trocaram de "Garantir vaga para 2027" para **"Tirar dúvidas no
WhatsApp"**, com os botões do formulário maiores (`.btn-submit-lg`, padding e `font-size` maiores).
O botão sticky mobile não foi alterado (não fazia parte do pedido).

**Barra de procura por vagas**: `.hero-escassez-barra` centralizada com `margin: 0 auto` (antes
alinhava à esquerda dentro da coluna flex); preenchimento continua indo de 0 a 70% (valor de
`data-fill` ajustado de 75 para 70) e a animação já era disparada só uma vez, na primeira vez que o
elemento entra na viewport (`animateBarraEscassez()` com `IntersectionObserver` + `unobserve` após o
primeiro trigger, padrão que já existia desde a Rodada 3) — nenhuma mudança de comportamento
necessária ali, só a correção de centralização. Adicionado texto pequeno "Última atualização em:
[data de hoje]" abaixo da barra (`setDataAtualizacao()`, novo em `main.js`, formata
`new Date().toLocaleDateString('pt-BR')` no `#dataAtualizacao`).

**Seção "Por que escolher o Colégio Kennedy?"**: a foto `alunos-kennedy.webp` (que estava pequena,
num card de 180px ao lado do texto) virou o **fundo em tela cheia** da seção inteira
(`.diferenciais-bg`, `position: absolute; inset: 0`, atrás do conteúdo via `z-index: -1` +
`isolation: isolate` no container), com um overlay em gradiente escuro (`.diferenciais-bg-overlay`,
tons do azul da marca) para manter o título e subtítulo (agora em branco) legíveis sobre a foto. Os
5 cards de diferenciais (fundo branco) continuam com bom contraste por cima do fundo escuro. CSS
morto de `.diferenciais-foto`/`.diferenciais-intro-texto` removido (não existem mais no HTML).

**Etapas de ensino**: título quebrado em duas linhas "Do Berçário" / "ao Ensino Médio" com `<br />`.
Cada card de etapa (Berçário, Educação Infantil, Ensino Fundamental, Ensino Médio) ganhou uma
descrição curta abaixo do título (`.etapa-item-desc`), usando os textos fornecidos pelo colégio no
arquivo `informações gerais colegio kennedy` (arquivo de texto puro, apesar de estar sem extensão
"parecendo" imagem): "Acolhimento, vínculo e estimulação sensorial." / "Brincar, explorar e
descobrir o mundo." / "Alfabetização sólida e curiosidade científica." / "Preparação para vestibular
e para a vida.". Cada `<figure>` virou um `<a href="#formulario" onclick="scrollToForm(event)">`
envolvendo a figura inteira, reaproveitando a função `scrollToForm()` já existente, para que clicar
em qualquer card leve direto ao formulário.

**Depoimentos em vídeo**: existiam 2 depoimentos em texto (Daniela/Aurora e Tielle/Antônio, cada um
já linkando pro respectivo Short do YouTube), mas só o vídeo da Daniela (`8DBYEh701Cs`) tinha um
player lite-embed abaixo. Adicionado um segundo lite-embed para o vídeo da Tielle (`w6yD5ibj5vg`),
lado a lado com o da Daniela em `.video-embed-grid` (grid responsivo, 1 coluna em telas estreitas).

**Verificação**: testado localmente servindo a pasta com `python -m http.server` e navegando via
Chrome headless (Chrome já estava instalado na máquina; não há Playwright/Puppeteer neste ambiente,
então a automação foi feita via Chrome DevTools Protocol bruto por um script Node temporário) —
confirmado visualmente: fundo em tela cheia da seção de diferenciais com bom contraste, cards de
etapas com descrição e links funcionando, barra centralizada com o texto de atualização, os dois
vídeos de depoimento lado a lado, e a etapa 2 do formulário mostrando os dots (etapa 1 sem texto
"Etapa X de 2" e sem dots).

## Rodada 5: texto do CTA fixo mobile (03/09/2026)

Texto do botão fixo mobile (`.btn-sticky-cta`, o CTA que fica grudado na tela em telas pequenas)
trocado de "Garantir vaga para 2027" para **"Resgatar meu Acesso Direto"**, seguindo um
enquadramento de voucher/acesso com desconto, a pedido explícito do usuário. O link do botão
(`href="#formulario"` + `onclick="scrollToForm(event)"`, âncora até o formulário) não foi alterado,
só o texto visível. Deploy feito de forma autônoma na Vercel logo em seguida, a pedido do usuário.

## 11. Ferramenta interna /visitas para o Diego (16/09/2026)

Nova funcionalidade, separada da landing page pública: uma tela protegida por senha em `/visitas`
para o Diego (visitação presencial), que mostra a agenda de visitas do dia, os dados do card do
Pipefy, destaca campos faltantes (o mais comum é o segundo responsável, quando pai e mãe aparecem
juntos mas só um foi cadastrado no formulário original) e permite preencher ali mesmo, além de um
roteiro de falas condicional baseado nos dados do card.

**Decisões principais**:
- Gravação no Pipefy é **direta via GraphQL** (não passa pelo Make) — é uma segunda integração,
  independente do webhook público, para não confundir os dois fluxos.
- Autenticação simples: senha única (`VISITAS_SENHA`), sessão em cookie assinado (HMAC, sem lib
  externa, sem JWT).
- Backend novo em `api/visitas/*` como Vercel Serverless Functions, zero dependências, sem
  `package.json` (mesmo padrão "sem build step" do resto do repo).
- Antes de implementar, consultei o pipe real do Pipefy via introspecção GraphQL (somente leitura)
  para não chutar nomes de campo. Resultado: **nada precisou ser criado no Pipefy** — os campos e
  fases necessários já existiam:
  - Pipe "CK 2027", id `307287863`.
  - Fase "7. AGENDOU VISITA" (id `343928415`) já tem o campo `visita` (data/hora da visita) — é o
    que alimenta a agenda.
  - Fase "9. FEZ VISITA" (id `343928427`) já existe como a etapa de "visita realizada" — marcar a
    visita como concluída move o card pra essa fase (`moveCardToPhase`), não grava um campo novo.
  - O formulário do pipe já tinha os campos do segundo responsável (`nome_do_respons_vel_2`,
    `telefone_respons_vel_2`, `email_resp_2`) só que vazios, porque o formulário público só
    captura um responsável.
- Mutations do Pipefy confirmadas por introspecção ao vivo do schema (não chutadas):
  `updateFieldsValues(input: { nodeId, values: [{ fieldId, value: [...] }] })` (note que `value` é
  sempre lista, mesmo pra campo de texto simples) e `moveCardToPhase(input: { card_id,
  destination_phase_id })` (em snake_case, diferente da primeira — inconsistência do próprio
  schema do Pipefy, não erro de digitação).
- Implementação dividida em dois agentes em paralelo (backend `api/visitas/*` e frontend
  `visitas/*`), contra um contrato de API fixado antes de escrever código, pra economizar
  tokens/tempo e reduzir risco de desalinhamento.
- Design pensado pra tablet (é o que o Diego usa durante a visita): 3 telas só (login, agenda,
  card), sem framework CSS/JS, sem fontes externas, payloads pequenos.

**Pendente antes de usar em produção** (ver CHECKLIST.md): configurar as env vars na Vercel
(`PIPEFY_API_TOKEN`, `PIPEFY_PIPE_ID`, `PIPEFY_FASE_AGENDOU_VISITA_ID`,
`PIPEFY_FASE_FEZ_VISITA_ID`, `VISITAS_SENHA`, `SESSION_SECRET`), confirmar se o campo `visita`
grava data e hora ou só data, e testar o fluxo completo com um card real/de teste.

**Atenção, nunca commitar**: o token de API do Pipefy usado durante a introspecção não foi salvo
em nenhum arquivo do repo, só usado em memória via variável de ambiente local na sessão do
terminal, por pedido explícito do usuário.

## 12. Correção: agenda vazia escondendo erro de configuração (16/09/2026)

Com a ferramenta já no ar, a agenda do `/visitas` passou a mostrar "Nenhuma visita agendada no
momento." mesmo com um card na fase "7. AGENDOU VISITA". Investigação e resultado:

**Causa raiz dupla**:
1. Os valores salvos na Vercel (`PIPEFY_API_TOKEN` e `PIPEFY_FASE_AGENDOU_VISITA_ID`) estavam
   errados. Correção: token novo gerado no Pipefy, as duas env vars reconfiguradas e deploy refeito
   (env var só passa a valer em deploy novo).
2. O código **escondia** esse tipo de falha. `api/visitas/_lib/pipefy.js` só verificava
   `json.errors` (plural), mas a API do Pipefy responde HTTP 401 com `{"error":"invalid_token",...}`
   (**singular**): o erro passava batido, `json.data` virava `undefined` e o `|| []` do `agenda.js`
   transformava falha de credencial em agenda vazia, com HTTP 200 e sem nenhum log. Foi isso que
   fez um problema de configuração parecer "não tem visita nenhuma".

**Como foi diagnosticado** (consultas reais, só leitura, direto na API do Pipefy):
- a fase `343928415` ("7. AGENDOU VISITA", pipe `307287863`) tinha 1 card com `visita =
  17/09/2026 13:50` — logo a query do código estava correta;
- ID de fase inválido/inexistente devolve `errors: [{ code: "PERMISSION_DENIED" }]` (viraria 502, não
  agenda vazia);
- fase válida e vazia devolve `200` com array vazio (este é o único caso legítimo de "agenda vazia");
- token inválido devolve `401 {"error":"invalid_token"}` — que, com o código antigo, virava `200 []`.
  Sintoma idêntico ao relatado, o que fechou o diagnóstico.

**Mudanças de código nesta rodada**:
- `_lib/pipefy.js`: `.trim()` no token, checagem de `res.ok` (401/403 → código
  `pipefy_nao_autorizado`), erro quando a resposta não tem `data`, códigos em `err.code` e o helper
  `mensagemErroPipefy()` que traduz para uma frase pt-BR segura para a tela (nunca cita o token).
- `agenda.js` / `card.js` / `atualizar.js`: 502 com o motivo real; fase nula deixou de virar `[]`;
  `.trim()` nos IDs de fase lidos de `process.env`; log da fase consultada e da quantidade de cards;
  `moveCardToPhase` agora confere se o card voltou na resposta antes de dizer que deu certo.
- Frontend: `visitas/auth.js` ganhou `mensagemErroResposta()`; agenda e tela do card mostram o motivo
  vindo do servidor em vez do genérico "Verifique a internet"; a agenda ganhou botão **Atualizar** e
  recarga silenciosa em `visibilitychange` (antes ela buscava uma vez só ao abrir e ficava congelada,
  o que também alimentou a confusão de "não apareceu"); `formatarDataHora()` passou a entender o
  formato "DD/MM/AAAA HH:MM" do Pipefy (`new Date` do navegador não entende) e exibe
  "DD/MM/AAAA, HH:MM"; `visitas.css` ganhou a regra `[hidden] { display: none !important; }` que
  faltava (mesmo padrão já usado no `style.css`).
- Cache-busting: `?v=2` → `?v=3` em `visitas/*.html`.

**Validação** (scripts na pasta `local/`, que é gitignored — nada versionado):
- `local/teste-visitas.js` executa os handlers reais (`agenda`, `card`) com req/res falsos: 10 casos,
  incluindo token inválido, token ausente, fase inexistente, ID de fase com espaços e fase vazia;
- `local/teste-agenda-dom.js` e `local/teste-card-dom.js` rodam o JS do frontend num DOM simulado
  (17 + 11 asserções): lista renderizada, estado vazio, mensagem de erro do servidor, botão
  Atualizar, recarga silenciosa, redirecionamento em 401 e horário formatado.

**Ainda pendente**: testar login (senha certa/errada), gravar responsável 2 refletindo no Pipefy,
"marcar visita como realizada" movendo o card para a fase `343928427` e os testes em tablet.

## 13. Correção: salvamento da visita sempre falhando (17/09/2026)

O Diego tentou salvar o dado do segundo responsável na tela da visita e a tela respondeu sempre
"Não foi possível salvar os dados. Tente novamente.", sem gravar nada no Pipefy. O sintoma era
idêntico para "Salvar dados preenchidos" e para "Marcar visita como realizada".

**Causa raiz (uma só)**: a mutation `updateFieldsValues` em `api/visitas/atualizar.js` pedia
`updatedNode { id }`. `updatedNode` é um **union** (`Card | TableRecord`) no schema do Pipefy, e
GraphQL não permite selecionar campo direto em union. Resultado: o Pipefy **recusava a mutation
inteira na validação**, sem executar nada, devolvendo

```
Selections can't be made directly on unions (see selections on UpdatedNode)
path: mutation.updateFieldsValues.updatedNode.id
```

Esse erro chegava como `pipefy_graphql`, não casava com nenhum caso conhecido de
`mensagemErroPipefy()` (que só tratava token/acesso negado) e caía no texto genérico
"Não foi possível salvar os dados. Tente novamente.". Ou seja: o erro era real, mas ficou invisível.

**Como foi diagnosticado**: repetindo a chamada real na API do Pipefy com o token do projeto, um
campo por vez, e lendo o `errors` cru do GraphQL. Em seguida, introspecção do schema para confirmar
os shapes: `UpdateFieldsValuesPayload = { success: Boolean!, updatedNode: UpdatedNode (UNION),
userErrors: [UserError!] }`, `UserError = { field: [String], message: String! }`,
`MoveCardToPhaseInput = { card_id: ID!, destination_phase_id: ID! }` (esse já estava correto).

**Mudanças de código nesta rodada**:
- `atualizar.js`: `updatedNode { id }` removido da mutation (o id do card já é conhecido) e trocado
  por `userErrors { field message }`. Com isso foi possível também **trocar o `success=false` mudo
  por um motivo legível**, via `descreverUserErrors()` + `criarErroRecusa()` (código `pipefy_recusa`).
  Sem mudança de comportamento na API: segue 200 `{ ok: true }` no sucesso e 502 com motivo no erro.
- `_lib/pipefy.js`: `mensagemErroPipefy()` passou a mostrar o texto original do Pipefy (resumido a
  160 caracteres, sem quebras de linha) quando o erro é `pipefy_graphql` fora dos casos de acesso
  negado, e também em `pipefy_http`. É exatamente o que teria evitado esse bug passar despercebido.
  Os casos de token inválido/ausente, resposta inesperada e acesso negado continuam com o texto
  amigável, e o token nunca aparece (nem no log nem na tela).

**Validação**:
- Antes da correção, um teste de leitura em `card` mostrou o card sem os campos do responsável 2.
  Depois, a mesma mutation corrigida (`success` + `userErrors`) gravou de verdade os dois campos
  (`nome_do_respons_vel_2 = "RESPONS 2"`, `telefone_respons_vel_2 = "51981246336"`) no card de
  teste `1445994068`, e `local/teste-visitas.js` passou a devolver `faltantes: []`.
- Novo `local/teste-atualizar.js` (pasta gitignored, nada versionado): executa o handler real
  `api/visitas/atualizar.js` com req/res falsos em 9 casos. Nenhum dado real é alterado: tudo usa o
  card inexistente `"0"`, justamente para provar que a query **passou na validação do schema e
  chegou a executar**. O caso 5 é a regressão do bug: se `updatedNode { id }` voltar, a mensagem
  passa a conter "unions" e o teste falha. O caso 6 faz a mesma checagem para `moveCardToPhase`.
- `local/teste-visitas.js`, `local/teste-agenda-dom.js` e `local/teste-card-dom.js` continuam
  passando (10 + 17 + 11 asserções), sem regressão.

**Importante para o deploy**: a correção é só de backend, então não houve bump de `?v=` nos HTML de
`visitas/` (nada de frontend mudou). Mas env var e código só valem após novo deploy, e o bug estava
em produção: até o deploy sair, nenhum salvamento pela tela funciona.

## 14. Tela da visita: todos os dados do card editáveis (17/09/2026)

Antes, `card.html` era uma tela de consulta (roteiro + resumo do responsável 1 e 2 + origem). O
Diego precisava abrir o Pipefy para corrigir qualquer outro dado do card (nome do aluno, série,
horário da visita, UTM etc.). Agora a tela da visita é o formulário completo do card:

**Backend**:
- `api/visitas/_lib/campos.js`: a tabela `CAMPOS` passou a cobrir TODOS os 33 campos do formulário
  do pipe (conferidos por introspecção) mais o campo `visita` da fase "7. AGENDOU VISITA". Também
  exporta `CAMPOS_POR_ALUNO`, `CAMPOS_ALUNO_1` e `REQUIRED_FIELDS`.
- `api/visitas/card.js` (NOVO endpoint `GET /api/visitas/card?id=...`): numa única ida ao Pipefy
  devolve os valores normalizados do card + `faltantes` + os **metadados** de cada campo (label,
  tipo, opcoes), cruzando o mapeamento interno com `pipe.start_form_fields` e
  `card.current_phase.fields` (a fase vence em caso de duplicidade; é de onde vem o campo `visita`,
  que é `due_date` e só existe na fase da agenda). Campo do mapeamento que sumiu do pipe fica de
  fora da resposta (e o backend loga o aviso) em vez de quebrar a tela.

**Frontend** (`visitas/card.html` + `card.js` reescrito, `visitas.css` + blocos de campo editável):
- Todo campo é editável. O tipo do controle NÃO é chutado no frontend: vem do Pipefy. `radio`/
  `select`/`checklist` viram `<select>` com as opções exatas (e "Não informado" como vazio; valor
  atual fora da lista entra como opção extra para não ser apagado sem quem edita ver); `due_date`/
  `datetime` viram `datetime-local` (formato testado gravando no Pipefy: `2026-09-17T15:45` volta
  como `17/09/2026 15:45`); `phone`/`email`/`number` viram inputs tipados; `long_text` vira
  textarea.
- Blocos: Aluno(s) (1 a 4, com "Adicionar aluno" que preserva o que já foi digitado), Responsável 1
  e 2 (com CPF e parentesco, que eram invisíveis antes), Necessidade educacional especial, Origem e
  campanha (baixa ênfase), Data e hora da visita no cabeçalho e um bloco de segurança "Outros dados
  do card" para qualquer campo mapeado que não caiba nos anteriores.
- Só os campos ALTERADOS são enviados (`POST /api/visitas/atualizar`, contrato inalterado), evitando
  reescrever UTM/GCLID só porque a tela foi aberta. Valor vazio é enviado de propósito: é assim que
  um campo é limpo no Pipefy (testado).
- Durante o salvamento os controles ficam desabilitados (evita editar durante a recarga silenciosa);
  em erro, o rascunho é preservado e dá para tentar de novo; "Marcar visita como realizada" envia
  alterações + movimento de fase na MESMA requisição.
- O selo "Falta preencher" continua nos campos obrigatórios vazios e o roteiro (`roteiro.js`) segue
  funcionando em cima dos mesmos dados.

**Versionamento de cache**: `card.html` agora referencia `visitas.css?v=5`, `roteiro.js?v=4` e
`card.js?v=5` (regra de bump em CLAUDE.md).

**Validação**: `local/teste-card-dom.js` reescrito (DOM simulado): 43 asserções cobrindo
carregamento, controle certo por tipo do Pipefy, selo de obrigatório, envio só do que mudou,
"Adicionar aluno" preservando rascunho, bloqueio durante envio, erro preservando rascunho, "marcar
como realizada" com movimento de fase e falhas visíveis (502, 404, sem metadados). Todos passaram,
sem regressão em `teste-visitas.js` (10) e `teste-agenda-dom.js` (17). O token usado nas validações
ao vivo anteriores passou a responder `invalid_token` no Pipefy; validação final da nova query de
metadados em produção ficou pendente de token novo.

## 15. Resumo de visitantes na tela de visita (16/09/2026)

Diego precisa chamar os responsáveis e alunos pelo nome assim que chega para a visita. Adicionado
um bloco "Quem é" no topo da tela de visita (logo após o horário), que exibe:
- Nome do Responsável 1
- Nome do Responsável 2
- Nomes de todos os alunos (1 a 4)

**Implementação**:
- `visitas/card.html`: novo bloco `#blocoResumo` com heading "Quem é" e container `#conteudoResumo`
  (renderizado pelo JS, não hardcodado)
- `visitas/card.js`: nova função `renderizarResumo(card)` que monta os nomes a partir dos dados do
  card; também adicionada função auxiliar `escapeHtml()` para sanitizar (contra XSS). A função é
  chamada em `renderizarCard()` logo após `renderizarRoteiro()`.
- `visitas/visitas.css`: nova classe `.resumo-visitantes` (fundo gradiente azul claro, borda
  esquerda, styling clean) e `.resumo-item` (texto legível em tablet). Se nenhum nome estiver
  preenchido, mostra "Nenhum nome cadastrado ainda."

**Cache-busting**: `card.html` referencia `card.js?v=6` (alterado durante o desenvolvimento).

**Ainda pendente**: testar login (senha certa/errada), "marcar visita como realizada"
movendo o card para a fase `343928427` e os testes em tablet.

## 16. Confirmação do ID da fase "Não veio" (16/09/2026)

`visitas/agenda.js` usa o botão "Não veio" (aba Visitas encerradas) pra mover o card pra fase
`343928419`, mas esse ID nunca tinha sido documentado aqui nem no CHECKLIST.md — só apareceu
hardcoded no código, sem registro de como foi confirmado (diferente de `343928415` e `343928427`,
que vieram de introspecção GraphQL registrada na seção 11). Usuário confirmou o ID certo:

- Fase "8. Ñ VEIO VISITA, REMARCAR", id `343928419`, pipe "CK 2027" (`307287863`).

Nenhuma mudança de código necessária, o ID já estava certo. Registrando aqui só pra não repetir a
dúvida/investigação da próxima vez.

## 17. Migração do webhook: Make → n8n (24/09/2026)

O usuário trocou a automação que recebe o lead e cria o card no Pipefy, saindo do Make
(Integromat) para um n8n próprio. Único ponto de código que precisava mudar: `CONFIG.WEBHOOK_URL`
em `main.js`, que era o único lugar do repo com a URL do Make hardcoded.

- `main.js`: `WEBHOOK_URL` trocado de `https://hook.us2.make.com/y8xbso3x3tz77mnn79whh9k7tk7vqhzb`
  para `https://n8n.colegiokennedy.top/webhook/formulario-ck-pipefy`.
- `index.html`: cache-busting `main.js?v=6` → `v=7` (regra do CLAUDE.md sempre que `main.js` muda).
- **Nada mais no código depende do Make** — o `fetch()` em `main.js` só faz um POST JSON genérico
  pro `CONFIG.WEBHOOK_URL`, sem nada específico da API do Make, então a troca de destino é
  suficiente do lado do site.
- **Pendente, fora do repo**: o cenário/workflow no n8n em `n8n.colegiokennedy.top` precisa aceitar
  o mesmo payload que o Make aceitava (todos os campos de `buildPayload()` em `main.js`: nome,
  telefone, email, `nome_aluno_1..4`/`serie_1..4`, `quantidade_alunos`, `resumo_alunos`, gclid,
  UTMs, `page_url`, `timestamp`) e mapear pros mesmos campos no card do Pipefy (pipe "CK 2027",
  `307287863`). Isso é configuração do workflow do n8n, não deste repo.
- **Teste end-to-end obrigatório antes de considerar migrado**: enviar um lead de teste pela
  landing page (produção ou preview) e confirmar que o card aparece certo no Pipefy — só ver a
  tela de sucesso no site não garante que o n8n processou (mesma lição da seção "Problema
  encontrado e resolvido" acima, sobre o Make).
- Depois de validar, considerar desativar/pausar o cenário antigo no Make para não pagar operações
  à toa (fora do escopo deste repo).

## Como retomar

1. Ler o `CHECKLIST.md` pra ver o estado atual item a item
2. Ler este `HISTORICO.md` pra contexto e decisões
3. Continuar a partir de "O que ainda falta" acima — sugestão de ordem: teste mobile/PageSpeed
   (rápido, fecha o item 9) → identidade visual (item 3) → conteúdo real (item 4, é o que mais
   depende de informação vinda do colégio) → SEO restante (item 5)
