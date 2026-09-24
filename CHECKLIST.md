# ✅ Checklist — Antes de Publicar

## 1. Google Tag Manager
- [x] Criar conta em tagmanager.google.com (contêiner GTM-PKM2DPSS)
- [x] Substituir `GTM-XXXXXXX` por `GTM-PKM2DPSS` em **index.html** (2 ocorrências — script e noscript)
- [x] Criar ação de conversão "Enviar formulário de lead" no Google Ads
      (ID `AW-17633043754`, rótulo `4QvMCM_n1OwcEKrKi9hB`)
- [x] Configurar tag "Google Ads - Conversão Lead Matrículas" no GTM com acionador de evento
      personalizado `lead_form_submit`
- [x] Configurar tag "Vinculador de conversões do Google Ads" (acionador All Pages)
- [x] Testar no modo Preview do GTM/Tag Assistant — tag disparou ("Concluída") no evento `lead_form_submit`
- [x] Publicar o contêiner no GTM (Versão 2 — publicada em 02/09/2026 por vinicius@colegiokennedy.com)
- [x] Fazer merge do branch de desenvolvimento (`claude/landing-page-status-vznjg8`) para o branch de
      produção (`claude/kennedy-landing-page-je9uds`) que a Vercel publica — sem isso o GTM nunca
      chegaria ao site ao vivo

## 2. Webhook (Make → n8n, migrado em 24/09/2026)
- [x] Criar cenário no Make com módulo "Webhook" *(descontinuado, ver abaixo)*
- [x] Copiar a URL gerada
- [x] Substituir `WEBHOOK_URL` em **main.js** → `CONFIG.WEBHOOK_URL`
- [x] Conectar o Make ao Pipefy *(descontinuado, ver abaixo)*
- [x] Testar o envio com dados reais (lead de teste na Vercel → Make → Pipefy OK)
- [x] **Migração para n8n**: `WEBHOOK_URL` trocado para
      `https://n8n.colegiokennedy.top/webhook/formulario-ck-pipefy` (ver HISTORICO.md, seção "17")
- [ ] Configurar o workflow no n8n para aceitar o mesmo payload de `buildPayload()` (main.js) e
      mapear os mesmos campos no card do Pipefy que o Make mapeava
- [ ] Testar o envio end-to-end com dados reais (lead de teste na Vercel → n8n → Pipefy OK)
- [ ] Depois de validado, pausar/desativar o cenário antigo no Make
- [x] Criar campos no Pipefy (texto curto) para: GCLID, UTM Source, UTM Medium, UTM Campaign,
      UTM Term, UTM Content, Série de Interesse, URL da Página, Data/Hora do Lead
- [x] Mapear no Make (módulo Pipefy) cada campo novo com o correspondente do Webhook
      (`gclid`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `serie`,
      `page_url`, `timestamp`)
- [x] Testar com `?gclid=TESTE123&utm_source=google&utm_medium=cpc&utm_campaign=matriculas` e
      confirmar que os campos chegaram preenchidos no card do Pipefy

## 2.1 Suporte a múltiplos filhos (Pipefy + Make) — PENDENTE, fazer antes do deploy valer
O formulário agora envia até 4 alunos por card (1 card por família). É preciso configurar
manualmente no Make/Pipefy antes que os dados dos filhos 2, 3 e 4 apareçam corretamente:
- [ ] No Pipefy (Pipe "CK 2027", fase "1. Novo Contato"), criar os campos:
      `Nome do Aluno 2` / `Série de Interesse 2`, `Nome do Aluno 3` / `Série de Interesse 3`,
      `Nome do Aluno 4` / `Série de Interesse 4` (texto curto, mesmo padrão dos campos existentes)
- [ ] Criar `Quantidade de Alunos` como campo **numérico** (não texto curto — precisa somar em
      relatório)
- [ ] Criar `Resumo dos Alunos` como texto longo/parágrafo
- [ ] No Make, mapear no módulo Pipefy os novos campos do webhook: `nome_aluno_2`, `serie_2`,
      `nome_aluno_3`, `serie_3`, `nome_aluno_4`, `serie_4`, `quantidade_alunos`, `resumo_alunos`
- [ ] Salvar o cenário e **reabrir pra confirmar que o mapeamento persistiu** (já aconteceu de
      sumir antes — ver HISTORICO.md)
- [ ] Testar com um lead de teste com 2+ filhos e conferir no card do Pipefy: nomes, séries,
      `Quantidade de Alunos` e o resumo legível
- [ ] Configurar um relatório no Pipefy que **some** o campo `Quantidade de Alunos` — esse número
      é "total de matrículas", diferente da contagem de cards ("total de leads/famílias")

## 3. Identidade visual
- [ ] Substituir as cores em **style.css** → bloco `:root` (variáveis `--color-primary`, `--color-accent`, etc.)
- [ ] Adicionar logo em `assets/images/logo.webp` (WebP, máx. 200×80px)
- [ ] Ajustar o nome "Colégio Kennedy" nos textos, se necessário

## 4. Conteúdo
- [x] Atualizar headline do hero com copy aprovado ("58 Anos Formando Alunos Prontos Para o Futuro")
- [ ] Ajustar lista de séries conforme oferta real do colégio
- [ ] Revisar os 5 cards de diferenciais com informações reais
- [x] Atualizar os números (alunos, anos, aprovação, professores) — `data-target` em **index.html**
      (58 anos, 10+ espaços, turno 7h-19h já são dados reais aprovados)
- [x] Substituir os 3 depoimentos por depoimentos reais (com autorização por escrito) — Daniela/Aurora
      e Tielle/Antônio, com vídeo, já são reais e aprovados
- [ ] Preencher endereço completo, telefone, e-mail e CNPJ no footer
- [x] Definir ano das matrículas (2027) na headline
- [ ] Trocar avatares placeholder (iniciais) da prova social ("4,9 · +300 avaliações no Google")
      no form-card por fotos reais de avaliadores — **usuário vai enviar essas fotos**
- [ ] Usuário vai enviar as fotos reais dos depoimentos (Daniela/Aurora, Tielle/Antônio) para
      eventualmente ilustrar a seção de prova social com imagem, não só texto/vídeo

## 5. SEO / Meta
- [x] Ajustar `<meta name="description">` (já estava com copy real; atualizado novamente para
      incluir "58 anos" e ficar coerente com a nova headline)
- [x] Adicionar `<link rel="canonical">` com a URL definitiva: `https://www.colegiokennedy.top/`
- [x] Criar favicon e referenciar no `<head>` — usado `favicon colegio kennedy.webp` fornecido
      pelo usuário, copiado para `assets/images/favicon.webp`, com `<link rel="icon">` e
      `<link rel="apple-touch-icon">`
- [x] Adicionar Open Graph tags para compartilhamento social — `og:title`/`og:description`
      atualizados junto com a meta description
- [ ] **Confirmar**: página está com `<meta name="robots" content="noindex, nofollow">` — intencional
      para landing page só de tráfego pago, mas confirmar que não deve ser indexada organicamente

## 10. Rodada 2 de CRO/Copy (03/09/2026) — concluída
Ver detalhes completos em HISTORICO.md, seção "Rodada 2 de CRO/Copy — grupos paralelos".
- [x] Botão do CTA secundário alinhado com o texto do botão principal ("Quero garantir a vaga!")
- [x] Aviso de escassez de vagas sem número específico (política do colégio não permite número)
- [x] Selo discreto de tempo de resposta ("Tempo médio de resposta monitorado: 32 segundos"),
      sem nome de auditor terceirizado fictício
- [x] E-mail tornado opcional no formulário
- [x] Label "Em qual série vai estudar?" trocado por "Em qual turma ou etapa vai estudar?"
      (cobre melhor Berçário/Educação Infantil)
- [x] CTA secundário reforça objeção de preço ("Conheça nossas condições e bolsas disponíveis")
      e reforça prova social (4,9★ · +300 avaliações)
- [x] Vídeo de depoimento embedado na seção de prova social via lite-embed (thumbnail + play,
      sem custo de iframe no carregamento inicial)
- [x] Títulos dos 5 cards de diferenciais reescritos com foco em benefício, não recurso
- [x] Texto de privacidade do formulário vira link "Política de Privacidade" que abre modal
      in-page (não navega para fora) — texto do modal é placeholder até existir política real
- [x] CNPJ (`93.012.235/0001-84`, sem a palavra "CNPJ") e Instagram (`@colegiokennedypoa`, texto
      não clicável, não navega para fora) adicionados ao footer
- [x] CTA fixo (sticky) no rodapé da viewport, visível só em mobile
- [x] Badge "58 anos de excelência em educação" destacado visualmente entre os selos do hero

### Pendências registradas nesta rodada (não implementadas — aguardando input ou decisão futura)
- [ ] **FAQ** — seção respondendo objeções comuns (documentos necessários, como funciona a bolsa,
      transporte escolar, processo após o contato via WhatsApp). Ainda não implementada.
- [ ] **Notificações "fake" de leads recentes** (ex.: "João de Porto Alegre acabou de solicitar
      informações") para aumentar senso de urgência de preenchimento — ideia do usuário, ainda não
      desenhada nem implementada.
- [ ] **Mais fotos do colégio** — complementar a página com mais imagens reais do ambiente/espaços
      do colégio, além das fotos atuais. Usuário vai fornecer.
- [ ] **Certificações/selos de autoridade** — pesquisar quais certificações o colégio possui (ex.
      qualidade de ensino, segurança, parcerias) para adicionar como selo de autoridade na página.

## 11. Rodada 3 de CRO/Copy/UX (03/09/2026) — concluída
Ver detalhes completos em HISTORICO.md, seção "Rodada 3, ajustes de UI/UX e formulário em 2 etapas".
- [x] Fundo branco removido de trás da logomarca no cabeçalho e no rodapé (a logo já tinha
      transparência real no PNG; o retângulo branco era CSS em `.logo-wrap`/`.footer-logo-img`)
- [x] Ícone SVG removido do título "Solicite informações grátis" no form
- [x] Foto de alunos (`alunos-kennedy.webp`) movida do card do formulário para a seção de
      Diferenciais, ao lado do título "Por que escolher o Colégio Kennedy?"
- [x] Hero reescrito: ordem invertida para "Do Berçário ao Ensino Médio em Porto Alegre" primeiro,
      depois "Matrículas abertas para 2027", em duas linhas
- [x] Todos os travessões (— e –) removidos de todo texto visível da página; nova convenção
      adicionada ao CLAUDE.md proibindo travessões em qualquer texto futuro
- [x] Aviso de escassez trocado de texto com bolinha pulsante para barra de progresso visual
      animada (preenchimento 75%, sem mostrar o número, com shimmer sutil indicando atividade)
- [x] Títulos dos 5 cards de diferenciais convertidos de Title Case para sentence case e aumentados
- [x] Figcaptions dos cards de etapas (Educação Infantil, Ensino Fundamental, Ensino Médio) quebradas
      em duas linhas para alinhar com "Berçário"
- [x] 4º card adicionado à grid de números ("+300 avaliações positivas de famílias") para completar
      o grid 2x2 em mobile
- [x] Formulário dividido em 2 etapas visuais (dados do responsável → dados do(s) aluno(s)), sem
      alterar `buildPayload()` nem o fluxo de submit único para o Make/Pipefy
- [x] Página real de Política de Privacidade criada (`politica-privacidade.html`, conteúdo LGPD
      completo), substituindo o modal placeholder
- [x] Título "Por que escolher o Colégio Kennedy?" corrigido no mobile para quebrar como "Por que
      escolher o" / "Colégio Kennedy" (antes quebrava "Kennedy" sozinho)
- [x] CTA "Quero garantir a vaga!" trocado por "Garantir vaga para 2027" em todos os botões
      (sticky mobile, avançar etapa 1, submit final, CTA secundário)

### Pendências desta rodada
- [ ] **Avaliações reais do Google/Facebook** — usuário pediu para extrair nome, foto, texto e
      nota de avaliações do Google Maps e Facebook do colégio para adicionar à seção de
      depoimentos. Não foi possível: não há ferramenta de automação de navegador/computador
      disponível nesta sessão. Usuário precisa copiar manualmente (texto + nome + estrelas, e
      salvar as fotos em `assets/images/`) e enviar para serem incorporadas.
- [ ] **Redesenho da seção de depoimentos** — usuário pediu para tornar o card de aspas mais
      minimalista e adicionar mais depoimentos reais (removendo qualquer avaliação do Google que
      não seja de família real) assim que as avaliações acima forem coletadas. Ainda não feito,
      depende do item anterior.

## 12. Rodada 4 de UI/UX e formulário (03/09/2026) — concluída
Ver detalhes completos em HISTORICO.md, seção "Rodada 4".
- [x] Texto "Etapa 1 de 2" / "Etapa 2 de 2" removido do formulário; os dots de progresso agora só
      aparecem na etapa 2 (ficam ocultos na etapa 1)
- [x] Barra de "vagas em alta procura" centralizada; preenchimento (0→70%) só anima na primeira
      vez que o usuário vê a barra (`IntersectionObserver`, já existia, mantido)
- [x] Texto pequeno "Última atualização em: [data de hoje]" adicionado abaixo da barra
      (`setDataAtualizacao()` em main.js, formata a data atual em pt-BR)
- [x] Texto "Solicite informações grátis" removido do formulário
- [x] Label do campo trocado de "WhatsApp" para "WhatsApp/Telefone"
- [x] Texto dos botões de envio do formulário e do CTA secundário (próximo ao footer) trocado de
      "Garantir vaga para 2027" para "Tirar dúvidas no WhatsApp"; botões do formulário aumentados
      (`.btn-submit-lg`)
- [x] Seção "Por que escolher o Colégio Kennedy?" redesenhada: foto (`alunos-kennedy.webp`) agora é
      o fundo em tela cheia da seção, com overlay em gradiente escuro para manter o texto legível
- [x] Título da seção de etapas quebrado em duas linhas: "Do Berçário" / "ao Ensino Médio"
- [x] Descrição de cada etapa (Berçário, Educação Infantil, Ensino Fundamental, Ensino Médio)
      adicionada abaixo do título de cada card, usando os textos fornecidos pelo colégio
- [x] Cards de etapas agora são links (`<a href="#formulario">`) que levam direto ao formulário
- [x] Segundo vídeo de depoimento (Tielle/Antônio, `w6yD5ibj5vg`) adicionado como lite-embed ao
      lado do vídeo da Daniela — antes só o vídeo da Daniela tinha player embedado

## 13. Rodada 5: texto do CTA fixo mobile (03/09/2026) — concluída
- [x] Texto do botão fixo mobile (`.btn-sticky-cta`) trocado de "Garantir vaga para 2027" para
      "Resgatar meu Acesso Direto", com enquadramento de voucher/acesso exclusivo; âncora
      (`href="#formulario"`, `onclick="scrollToForm(event)"`) mantida sem alteração

## 6. Deploy no Vercel
```bash
# 1. Instale o CLI (uma vez só)
npm i -g vercel

# 2. Na pasta do projeto
vercel

# 3. Siga as perguntas:
#    - Set up and deploy? → Y
#    - Which scope? → sua conta
#    - Link to existing project? → N (primeira vez)
#    - Project name → colegio-kennedy-matriculas
#    - In which directory is your code? → ./
#    - Override settings? → N

# 4. Deploy de produção
vercel --prod
```

## 7. Domínio personalizado (Vercel)
- [x] Em vercel.com → projeto → Settings → Domains → adicionado `colegiokennedy.top` e `www.colegiokennedy.top`
- [x] Atualizado DNS na Hostgator (registro A do domínio raiz apontando pro IP da Vercel;
      `www` já era CNAME pro domínio raiz, seguiu automaticamente)
- [x] Confirmado "Valid Configuration" nos 3 domínios (raiz, www e o .vercel.app de fallback)
- [x] `colegiokennedy.top` redireciona (308) para `www.colegiokennedy.top` (produção)

## 8. Google Ads
- [x] Confirmado "Codificação automática: Sim" em Configurações da conta (equivalente a
      auto-tagging — anexa o `gclid` automaticamente em toda URL de destino dos anúncios)
- [ ] **FUTURO:** importar conversões offline usando o GCLID capturado no webhook, quando já
      houver leads reais convertidos em matrícula no Pipefy

## 14. Ferramenta interna /visitas (16/09/2026) — código pronto, configuração e testes pendentes
Ver detalhes completos em HISTORICO.md, seção "11. Ferramenta interna /visitas para o Diego".
- [x] Backend criado em `api/visitas/*` (login, logout, agenda, card, atualizar + `_lib/session.js`,
      `_lib/pipefy.js`, `_lib/campos.js`)
- [x] Frontend criado em `visitas/*` (login.html, index.html, card.html, visitas.css, agenda.js,
      card.js, roteiro.js, auth.js), design tablet-first
- [x] `vercel.json` atualizado com `Cache-Control: no-store` para `/api/visitas/*`
- [x] `.gitignore` atualizado com `.env*.local`
- [x] Configurar env vars no projeto da Vercel: `PIPEFY_API_TOKEN`, `PIPEFY_PIPE_ID` (`307287863`),
      `PIPEFY_FASE_AGENDOU_VISITA_ID` (`343928415`), `PIPEFY_FASE_FEZ_VISITA_ID` (`343928427`),
      `VISITAS_SENHA`, `SESSION_SECRET` — configuradas manualmente no dashboard da Vercel e redeploy
      feito (16/09/2026)
- [x] **Troubleshooting (16/09/2026)** — a agenda mostrava sempre "Nenhuma visita agendada no
      momento" com o card já na fase "7. AGENDOU VISITA". Causa: valores das env vars errados na
      Vercel. Corrigido gerando token novo no Pipefy, reconfigurando `PIPEFY_API_TOKEN` e
      `PIPEFY_FASE_AGENDOU_VISITA_ID` e refazendo o deploy. Detalhes em HISTORICO.md, seção "12"
- [x] Endurecer o backend para falha de configuração não virar "agenda vazia" silenciosa (token
      inválido/ausente, ID de fase inexistente): `_lib/pipefy.js` agora checa `res.ok` e o `error`
      (singular) do HTTP 401, e `agenda.js`/`card.js`/`atualizar.js` respondem 502 com motivo
- [x] Mostrar o motivo real na tela (via `mensagemErroResposta` em `visitas/auth.js`) em vez do
      genérico "Verifique a internet"
- [x] Agenda com botão **Atualizar** e recarga automática quando a aba volta ao foco
      (`visibilitychange`); antes ela buscava uma vez só ao abrir e ficava congelada
- [x] Agenda carregando um card real na fase "7. AGENDOU VISITA" (confirmado pelo usuário em
      16/09/2026)
- [x] Confirmar se o campo `visita` (fase "7. AGENDOU VISITA") grava data **e hora** ou só data —
      confirmado com o card real: grava data **e hora** (`17/09/2026 13:50`), não precisa trocar o
      tipo do campo no Pipefy
- [x] Validado localmente com scripts em `local/` (pasta gitignored, nada versionado): handlers reais
      do backend com req/res falsos (10 casos, incluindo token inválido) e JS do frontend em DOM
      simulado (17 + 11 asserções)
- [x] **Bug corrigido (17/09/2026)** — salvar pela tela da visita sempre respondia "Não foi possível
      salvar os dados. Tente novamente." sem gravar nada. Causa: a mutation `updateFieldsValues` pedia
      `updatedNode { id }`, e `updatedNode` é um union no schema do Pipefy, então o Pipefy recusava a
      mutation inteira na validação. Corrigido em `api/visitas/atualizar.js` (mutation agora pede
      `success` + `userErrors`) e `mensagemErroPipefy()` passou a mostrar o motivo real do Pipefy em
      vez de escondê-lo atrás do texto genérico. Detalhes em HISTORICO.md, seção "13"
- [x] Preenchimento do responsável 2 refletindo no Pipefy de verdade (validado no card de teste
      `1445994068`: `nome_do_respons_vel_2` e `telefone_respons_vel_2` gravados, `faltantes: []`)
- [x] **Tela da visita editável (17/09/2026)** — `card.html` agora mostra TODOS os dados do card
      como formulário editável (alunos 1 a 4, responsáveis 1 e 2 com CPF/parentesco, necessidade
      especial, origem/UTM, horário da visita), com tipo de controle vindo dos metadados do Pipefy
      (novo endpoint `GET /api/visitas/card`) e envio só dos campos alterados. Detalhes em
      HISTORICO.md, seção "14"
- [x] **Resumo de visitantes (16/09/2026)** — Bloco "Quem é" adicionado no topo da tela de visita
      logo após o horário, exibindo nomes do responsável 1, responsável 2 e todos os alunos
      cadastrados. Permite que Diego chame as pessoas pelo nome assim que chegar para a visita
      presencial. Detalhes em HISTORICO.md, seção "15"
- [ ] Testar login (senha certa/errada)
- [ ] Testar "marcar visita como realizada" movendo o card pra fase "9. FEZ VISITA" (`343928427`)
- [ ] Renovar `PIPEFY_API_TOKEN` (o atual passou a responder `invalid_token`) e revalidar ao vivo a
      nova query de metadados do card

- [ ] Testar em tablet (viewport ~768-1024px) — é o dispositivo real que o Diego vai usar
- [ ] QA do roteiro condicional (`visitas/roteiro.js`) com pelo menos 3 combinações de dados

## 9. Teste final
- [ ] Abrir a página com `?gclid=TESTE123&utm_source=google&utm_medium=cpc&utm_campaign=matriculas`
- [ ] Verificar campos hidden preenchidos (DevTools → Elements)
- [ ] Submeter o formulário e confirmar recebimento no Make
- [ ] Confirmar evento `lead_form_submit` no dataLayer (DevTools → Console: `dataLayer`)
- [ ] Testar em mobile (360px) e desktop
- [ ] Rodar no PageSpeed Insights → meta: LCP < 2.5s, Performance > 90
