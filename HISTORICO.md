# 📋 Histórico do Projeto — Landing Page Matrículas Colégio Kennedy

> Documento de continuidade. Leia isto antes de retomar o trabalho — evita repetir passos já feitos.

## Visão geral do projeto

Landing page de captura de leads (matrículas) para o Colégio Kennedy, feita para rodar campanhas
de Google Ads. Stack: HTML/CSS/JS puro (`index.html`, `style.css`, `main.js`), hospedada na Vercel,
com o formulário enviando dados via webhook pro Make (Integromat), que cria o card no Pipefy.

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

## Como retomar

1. Ler o `CHECKLIST.md` pra ver o estado atual item a item
2. Ler este `HISTORICO.md` pra contexto e decisões
3. Continuar a partir de "O que ainda falta" acima — sugestão de ordem: teste mobile/PageSpeed
   (rápido, fecha o item 9) → identidade visual (item 3) → conteúdo real (item 4, é o que mais
   depende de informação vinda do colégio) → SEO restante (item 5)
