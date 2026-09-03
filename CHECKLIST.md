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

## 2. Webhook do Make (Integromat)
- [x] Criar cenário no Make com módulo "Webhook"
- [x] Copiar a URL gerada
- [x] Substituir `WEBHOOK_URL` em **main.js** → `CONFIG.WEBHOOK_URL`
- [x] Conectar o Make ao Pipefy
- [x] Testar o envio com dados reais (lead de teste na Vercel → Make → Pipefy OK)
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

## 9. Teste final
- [ ] Abrir a página com `?gclid=TESTE123&utm_source=google&utm_medium=cpc&utm_campaign=matriculas`
- [ ] Verificar campos hidden preenchidos (DevTools → Elements)
- [ ] Submeter o formulário e confirmar recebimento no Make
- [ ] Confirmar evento `lead_form_submit` no dataLayer (DevTools → Console: `dataLayer`)
- [ ] Testar em mobile (360px) e desktop
- [ ] Rodar no PageSpeed Insights → meta: LCP < 2.5s, Performance > 90
