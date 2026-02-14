import { eq } from 'drizzle-orm';
import { getDatabase } from '../connection.ts';
import {
  coursesTable,
  modulesTable,
  lessonsTable,
  sectionsTable,
  categoriesTable,
} from '@courses/infrastructure/persistence/drizzle/schema.ts';
import { usersTable } from '@auth/infrastructure/persistence/drizzle/schema.ts';
import { env } from '@shared/config/env.ts';
import { v7 as uuidv7 } from 'uuid';

// ---------------------------------------------------------------------------
// Course content data: 6 modules, 18 lessons, ~70+ sections
// ---------------------------------------------------------------------------
const MODULES_DATA = [
{
    title: 'Fundamentos',
    description: 'Entender o que é HTML e criar a primeira página.',
    order: 1,
    lessons: [
      {
        title: 'O que é HTML?',
        slug: 'o-que-e-html',
        description: 'Compreender o papel do HTML na construção de páginas web e sua evolução ao longo dos anos.',
        type: 'text' as const,
        isFree: true,
        order: 1,
        sections: [
          {
            title: 'Entender o papel do HTML na web',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# O papel do HTML na web

HTML significa **HyperText Markup Language** — Linguagem de Marcação de Hipertexto. É a linguagem fundamental que define a **estrutura** de toda página na internet.

## HTML não é uma linguagem de programação

É muito importante entender essa distinção desde o início. HTML é uma **linguagem de marcação**. Isso significa que ela serve para **organizar e dar significado** ao conteúdo, não para criar lógica ou comportamento.

## A analogia da casa

Uma forma simples de entender o papel de cada tecnologia web:

| Tecnologia | Papel | Analogia |
|-----------|-------|----------|
| **HTML** | Estrutura | A planta e as paredes da casa |
| **CSS** | Apresentação | A pintura, decoração e acabamento |
| **JavaScript** | Comportamento | A parte elétrica, hidráulica e automação |

Sem HTML, não existe página web. O CSS e o JavaScript dependem do HTML para funcionar.

## Como o HTML funciona?

O HTML utiliza **tags** (etiquetas) para marcar o conteúdo. Cada tag informa ao navegador o que aquele trecho de conteúdo representa:

\`\`\`html
<h1>Este é um título principal</h1>
<p>Este é um parágrafo de texto.</p>
<a href="https://exemplo.com">Este é um link</a>
\`\`\`

As tags geralmente vêm em pares: uma **tag de abertura** (\`<h1>\`) e uma **tag de fechamento** (\`</h1>\`). O conteúdo fica entre elas.

## O navegador interpreta o HTML

Quando você acessa um site, o navegador:

1. Faz o download do arquivo HTML do servidor
2. Lê (parseia) as tags do documento
3. Constrói uma árvore de elementos chamada **DOM** (Document Object Model)
4. Renderiza o conteúdo visualmente na tela

Tudo que você vê em uma página web — textos, imagens, vídeos, formulários — está descrito em HTML.

## Elementos e atributos

Cada tag HTML cria um **elemento**. Elementos podem ter **atributos** que fornecem informações adicionais:

\`\`\`html
<a href="https://exemplo.com" target="_blank">Clique aqui</a>
\`\`\`

Neste exemplo:
- \`a\` é a tag (âncora/link)
- \`href\` é um atributo que define o destino do link
- \`target="_blank"\` é um atributo que abre o link em nova aba
- "Clique aqui" é o conteúdo do elemento`,
            },
          },
          {
            title: 'Conhecer a história e evolução do HTML',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# A história e evolução do HTML

Entender como o HTML chegou até aqui ajuda a compreender por que ele funciona da forma que funciona hoje.

## O início: Tim Berners-Lee

Em **1991**, o cientista britânico **Tim Berners-Lee**, trabalhando no CERN (Organização Europeia para a Pesquisa Nuclear), criou o HTML como parte de seu projeto da **World Wide Web**. A primeira versão tinha apenas 18 tags.

O objetivo era simples: permitir que pesquisadores compartilhassem documentos científicos interligados por **hiperlinks**.

## Linha do tempo das versões

| Ano | Versão | Destaques |
|-----|--------|-----------|
| 1991 | HTML 1.0 | 18 tags básicas, apenas texto e links |
| 1995 | HTML 2.0 | Formulários, primeira especificação formal |
| 1997 | HTML 3.2 | Tabelas, applets, formatação visual |
| 1999 | HTML 4.01 | CSS separado, acessibilidade, internacionalização |
| 2000 | XHTML 1.0 | HTML com regras rígidas do XML |
| 2014 | **HTML5** | Semântica, multimídia, APIs modernas |

## W3C e WHATWG

Duas organizações moldaram o HTML:

- **W3C** (World Wide Web Consortium): Fundado por Tim Berners-Lee, criou os padrões oficiais do HTML até o HTML 4.01. Tentou seguir com o XHTML 2.0, que seria muito restritivo.
- **WHATWG** (Web Hypertext Application Technology Working Group): Formado em 2004 por desenvolvedores do Mozilla, Apple e Opera, que discordaram da direção do W3C. Começaram a desenvolver o que viria a ser o **HTML5**.

Em 2019, W3C e WHATWG chegaram a um acordo: a especificação do WHATWG (chamada **HTML Living Standard**) passou a ser a única versão oficial.

## Por que o HTML5 importa?

O HTML5 trouxe mudanças fundamentais:

### Tags semânticas
Antes, tudo era \`<div>\`. Agora temos tags com significado:

\`\`\`html
<header>Cabeçalho do site</header>
<nav>Menu de navegação</nav>
<main>Conteúdo principal</main>
<article>Um artigo</article>
<aside>Conteúdo lateral</aside>
<footer>Rodapé do site</footer>
\`\`\`

### Multimídia nativa
Antes era necessário Flash. Agora:

\`\`\`html
<video src="video.mp4" controls></video>
<audio src="musica.mp3" controls></audio>
\`\`\`

### APIs JavaScript
Canvas para desenho, Geolocalização, Web Storage, Web Workers e muito mais.

### Formulários avançados
Novos tipos de input como \`email\`, \`date\`, \`range\`, \`color\`, com validação nativa do navegador.

## HTML é um padrão vivo

Hoje o HTML não tem mais "versões" numeradas. A especificação é atualizada continuamente pelo WHATWG. Chamamos isso de **Living Standard** — padrão vivo. Novas funcionalidades são adicionadas gradualmente conforme os navegadores as implementam.`,
            },
          },
          {
            title: 'Quiz: Conceitos iniciais',
            contentType: 'quiz' as const,
            order: 3,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual é o papel principal do HTML em uma página web?',
                  options: [
                    'Definir a aparência visual da página',
                    'Definir a estrutura e o significado do conteúdo',
                    'Adicionar interatividade e animações',
                    'Conectar a página ao banco de dados',
                  ],
                  correctAnswer: 1,
                  explanation: 'O HTML é uma linguagem de marcação responsável por definir a estrutura e o significado semântico do conteúdo. A aparência é papel do CSS e a interatividade é papel do JavaScript.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'HTML é uma linguagem de programação.',
                  options: ['Verdadeiro', 'Falso'],
                  correctAnswer: 1,
                  explanation: 'Falso. HTML é uma linguagem de marcação (Markup Language), não uma linguagem de programação. Ela não possui estruturas de controle como loops ou condicionais.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Quem criou o HTML e em que ano?',
                  options: [
                    'Bill Gates, em 1995',
                    'Tim Berners-Lee, em 1991',
                    'Steve Jobs, em 2001',
                    'Brendan Eich, em 1995',
                  ],
                  correctAnswer: 1,
                  explanation: 'Tim Berners-Lee criou o HTML em 1991 enquanto trabalhava no CERN, como parte do projeto da World Wide Web.',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Qual organização mantém atualmente a especificação oficial do HTML?',
                  options: [
                    'W3C',
                    'WHATWG',
                    'Mozilla Foundation',
                    'Google',
                  ],
                  correctAnswer: 1,
                  explanation: 'Desde 2019, a especificação oficial do HTML (HTML Living Standard) é mantida exclusivamente pelo WHATWG.',
                },
                {
                  id: 'q5',
                  type: 'true_false',
                  question: 'O HTML5 introduziu tags semânticas como <header>, <nav> e <footer>.',
                  options: ['Verdadeiro', 'Falso'],
                  correctAnswer: 0,
                  explanation: 'Verdadeiro. O HTML5 trouxe diversas tags semânticas que dão significado à estrutura da página, como header, nav, main, article, aside e footer.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Estrutura básica de um documento',
        slug: 'estrutura-basica-documento',
        description: 'Aprender a criar o esqueleto de um documento HTML5 corretamente.',
        type: 'text' as const,
        isFree: true,
        order: 2,
        sections: [
          {
            title: 'Criar o esqueleto HTML5',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# O esqueleto de um documento HTML5

Todo documento HTML segue uma estrutura padrão. Vamos entender cada parte.

## A estrutura mínima

\`\`\`html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minha Página</title>
</head>
<body>
    <h1>Olá, mundo!</h1>
    <p>Esta é minha primeira página HTML.</p>
</body>
</html>
\`\`\`

Vamos analisar cada linha.

## \`<!DOCTYPE html>\`

Esta declaração **deve ser a primeira linha** do documento. Ela informa ao navegador que este é um documento HTML5.

- Não é uma tag HTML, é uma instrução para o navegador
- Sem ela, o navegador entra em **quirks mode** (modo de compatibilidade), que pode causar renderização inconsistente
- No HTML5, a declaração é simples: \`<!DOCTYPE html>\`
- Em versões anteriores era muito mais complexa

## \`<html lang="pt-BR">\`

A tag \`<html>\` é o **elemento raiz** que envolve todo o conteúdo da página.

O atributo \`lang\` define o idioma principal do documento:
- \`pt-BR\` — Português do Brasil
- \`en\` — Inglês
- \`es\` — Espanhol

Esse atributo é importante para:
- **Acessibilidade**: leitores de tela usam o idioma para pronunciar o conteúdo
- **SEO**: mecanismos de busca usam para indexar corretamente
- **Tradução automática**: navegadores usam para oferecer tradução

## \`<head>\` — O cabeçalho invisível

A tag \`<head>\` contém **metadados** — informações sobre o documento que não são exibidas diretamente na página.

## \`<meta charset="UTF-8">\`

Define a **codificação de caracteres** do documento. UTF-8 suporta praticamente todos os caracteres do mundo, incluindo acentos do português:

- Sem essa declaração, caracteres como **ç**, **ã**, **é** podem aparecer quebrados
- Sempre use UTF-8, é o padrão universal

## \`<body>\` — O corpo visível

A tag \`<body>\` contém todo o conteúdo **visível** da página: textos, imagens, links, vídeos, formulários, etc.

Tudo que o usuário vê e interage fica dentro do \`<body>\`.

## Regras importantes

1. Todo documento deve ter **exatamente um** \`<html>\`, um \`<head>\` e um \`<body>\`
2. \`<head>\` vem **antes** do \`<body>\`
3. O \`DOCTYPE\` vem **antes** de tudo
4. Tags devem ser **fechadas** na ordem inversa em que foram abertas (aninhamento correto)

### Aninhamento correto vs incorreto:

\`\`\`html
<!-- ✅ Correto -->
<p>Texto com <strong>negrito</strong> aqui.</p>

<!-- ❌ Incorreto -->
<p>Texto com <strong>negrito</p></strong>
\`\`\``,
            },
          },
          {
            title: 'Entender a tag head',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# A tag \`<head>\`: metadados do documento

A seção \`<head>\` é invisível para o usuário, mas essencial para o funcionamento correto da página. Vamos explorar seus elementos mais importantes.

## \`<title>\` — O título da página

\`\`\`html
<title>Meu Site - Página Inicial</title>
\`\`\`

O título aparece em três lugares:
- Na **aba do navegador**
- Nos **resultados de busca** do Google
- Nos **favoritos/bookmarks** quando o usuário salva a página

Boas práticas:
- Seja descritivo e conciso (50-60 caracteres)
- Inclua o nome do site
- Cada página deve ter um título único

## \`<meta>\` — Metadados variados

A tag \`<meta>\` é **auto-fechante** (não tem tag de fechamento) e define diferentes tipos de metadados.

### Charset (já vimos)

\`\`\`html
<meta charset="UTF-8">
\`\`\`

### Viewport — Essencial para dispositivos móveis

\`\`\`html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
\`\`\`

Essa meta tag é **obrigatória** para sites responsivos:
- \`width=device-width\`: a largura da página segue a largura do dispositivo
- \`initial-scale=1.0\`: o zoom inicial é 100%

Sem ela, sites aparecem minúsculos em celulares, como se fossem a versão desktop encolhida.

### Descrição para motores de busca

\`\`\`html
<meta name="description" content="Aprenda HTML do zero com exemplos práticos e exercícios interativos.">
\`\`\`

Essa descrição pode aparecer nos resultados de busca do Google abaixo do título.

### Autor

\`\`\`html
<meta name="author" content="João Silva">
\`\`\`

## \`<link>\` — Recursos externos

A tag \`<link>\` conecta o documento a recursos externos. O uso mais comum é para folhas de estilo CSS:

\`\`\`html
<link rel="stylesheet" href="estilos.css">
\`\`\`

Também é usada para o **favicon** (ícone da aba):

\`\`\`html
<link rel="icon" href="favicon.ico" type="image/x-icon">
\`\`\`

## Exemplo completo de \`<head>\`

\`\`\`html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Meu primeiro site em HTML5">
    <meta name="author" content="Maria Souza">
    <title>Meu Primeiro Site</title>
    <link rel="icon" href="favicon.ico">
    <link rel="stylesheet" href="estilos.css">
</head>
\`\`\`

## O que NÃO vai no \`<head>\`

O \`<head>\` **nunca** contém conteúdo visível. Nada de textos, imagens ou links para o usuário. Esses elementos pertencem ao \`<body>\`.

Se você colocar um \`<p>\` ou \`<h1>\` dentro do \`<head>\`, o navegador pode até exibi-los, mas estará **incorreto** e causará problemas de validação e acessibilidade.`,
            },
          },
          {
            title: 'Exercício: Criar sua primeira página',
            contentType: 'exercise' as const,
            order: 3,
            content: {
              language: 'html' as const,
              problem: `# Crie sua primeira página HTML5

## Objetivo
Criar um documento HTML5 completo com todos os elementos essenciais da estrutura básica.

## Requisitos

1. Declare o DOCTYPE corretamente
2. Defina o idioma como português do Brasil
3. Configure a codificação como UTF-8
4. Adicione a meta tag de viewport para responsividade
5. Defina o título como "Minha Primeira Página"
6. Adicione uma meta description com uma breve descrição
7. No body, adicione:
   - Um título principal (h1) com seu nome
   - Um parágrafo de apresentação
   - Um subtítulo (h2) com "Sobre mim"
   - Outro parágrafo com uma breve descrição sobre você`,
              starterCode: `<!DOCTYPE html>
<html>
<head>
    <!-- Configure o charset, viewport e título aqui -->
</head>
<body>
    <!-- Adicione seu conteúdo aqui -->
</body>
</html>`,
              hints: [
                'O atributo lang vai na tag <html>: <html lang="pt-BR">',
                'A meta charset deve ser a primeira tag dentro do <head>',
                'A meta viewport usa: content="width=device-width, initial-scale=1.0"',
                'Use <h1> para o título principal e <h2> para subtítulos',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Minha primeira página HTML5 criada durante o curso.">
    <title>Minha Primeira Página</title>
</head>
<body>
    <h1>Maria Silva</h1>
    <p>Olá! Bem-vindo à minha primeira página HTML. Estou aprendendo desenvolvimento web!</p>

    <h2>Sobre mim</h2>
    <p>Sou estudante de tecnologia e estou começando minha jornada no mundo do desenvolvimento web. Este é meu primeiro projeto em HTML5.</p>
</body>
</html>`,
            },
          },
          {
            title: 'Quiz: Estrutura do documento',
            contentType: 'quiz' as const,
            order: 4,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual deve ser a primeira linha de um documento HTML5?',
                  options: [
                    '<html lang="pt-BR">',
                    '<!DOCTYPE html>',
                    '<head>',
                    '<meta charset="UTF-8">',
                  ],
                  correctAnswer: 1,
                  explanation: 'A declaração <!DOCTYPE html> deve ser sempre a primeira linha do documento. Ela informa ao navegador que se trata de um documento HTML5.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'A tag <meta charset="UTF-8"> é necessária para exibir corretamente caracteres acentuados em português.',
                  options: ['Verdadeiro', 'Falso'],
                  correctAnswer: 0,
                  explanation: 'Verdadeiro. Sem a declaração de charset UTF-8, caracteres especiais como ç, ã, é podem aparecer quebrados no navegador.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Onde a tag <title> deve ser colocada?',
                  options: [
                    'Dentro do <body>',
                    'Dentro do <head>',
                    'Antes do <!DOCTYPE>',
                    'Dentro do <footer>',
                  ],
                  correctAnswer: 1,
                  explanation: 'A tag <title> é um metadado do documento e deve ficar dentro do <head>. Ela define o título que aparece na aba do navegador.',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Para que serve a meta tag viewport?',
                  options: [
                    'Definir o título da página',
                    'Conectar uma folha de estilos CSS',
                    'Garantir que a página funcione corretamente em dispositivos móveis',
                    'Definir o idioma do documento',
                  ],
                  correctAnswer: 2,
                  explanation: 'A meta viewport com content="width=device-width, initial-scale=1.0" faz com que a página se adapte à largura do dispositivo, sendo essencial para sites responsivos.',
                },
                {
                  id: 'q5',
                  type: 'true_false',
                  question: 'É possível ter mais de uma tag <body> em um documento HTML.',
                  options: ['Verdadeiro', 'Falso'],
                  correctAnswer: 1,
                  explanation: 'Falso. Um documento HTML deve ter exatamente um <html>, um <head> e um <body>. Múltiplos elementos desses causam erros de validação.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Ferramentas do desenvolvedor',
        slug: 'ferramentas-do-desenvolvedor',
        description: 'Configurar o ambiente de desenvolvimento e aprender a usar o DevTools do navegador.',
        type: 'text' as const,
        isFree: false,
        order: 3,
        sections: [
          {
            title: 'Configurar o editor de código',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Configurando o editor de código

Para escrever HTML de forma produtiva, precisamos de um bom editor de código. O mais popular e recomendado atualmente é o **Visual Studio Code** (VS Code).

## Por que o VS Code?

- **Gratuito** e de código aberto
- Leve e rápido
- Enorme ecossistema de **extensões**
- Excelente suporte a HTML, CSS e JavaScript
- **IntelliSense**: autocomplete inteligente
- Terminal integrado
- Disponível para Windows, macOS e Linux

## Instalação

1. Acesse [code.visualstudio.com](https://code.visualstudio.com)
2. Baixe a versão para seu sistema operacional
3. Instale seguindo o assistente padrão

## Extensões essenciais

Após instalar o VS Code, adicione estas extensões para melhorar sua produtividade com HTML:

### Live Server

A extensão mais importante para iniciantes. Ela cria um **servidor local** que atualiza a página automaticamente sempre que você salva o arquivo.

- Instale buscando "Live Server" por Ritwick Dey
- Para usar: clique com o botão direito no arquivo HTML e selecione **"Open with Live Server"**
- A página abre no navegador e atualiza sozinha a cada salvamento

### Emmet (já vem integrado)

O Emmet é um sistema de **abreviações** que acelera a escrita de HTML. Ele já vem integrado ao VS Code.

Exemplos de abreviações Emmet:

| Abreviação | Resultado |
|-----------|-----------|
| \`!\` + Tab | Esqueleto HTML5 completo |
| \`h1\` + Tab | \`<h1></h1>\` |
| \`p*3\` + Tab | Três tags \`<p>\` |
| \`ul>li*5\` + Tab | Lista com 5 itens |
| \`.container\` + Tab | \`<div class="container"></div>\` |

Experimente: em um arquivo \`.html\`, digite \`!\` e pressione **Tab**. O esqueleto completo será gerado automaticamente!

### Outras extensões úteis

- **Auto Rename Tag**: ao renomear a tag de abertura, a de fechamento é renomeada automaticamente
- **HTML CSS Support**: autocomplete de classes CSS dentro do HTML
- **Prettier**: formatador automático de código

## Configurações recomendadas

Abra as configurações do VS Code (Ctrl+, ou Cmd+,) e ajuste:

- **Auto Save**: \`afterDelay\` — salva automaticamente após um tempo
- **Tab Size**: \`4\` ou \`2\` — espaços por tabulação (escolha um e mantenha)
- **Word Wrap**: \`on\` — quebra linhas longas na tela
- **Format On Save**: \`true\` — formata o código ao salvar`,
            },
          },
          {
            title: 'Usar o DevTools do navegador',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# DevTools: as ferramentas de desenvolvedor do navegador

Todo navegador moderno possui **ferramentas de desenvolvedor** (DevTools) integradas. Elas são essenciais para inspecionar, depurar e entender como uma página web funciona.

## Como abrir o DevTools

Existem várias formas de abrir as ferramentas de desenvolvedor:

| Método | Atalho |
|--------|--------|
| Teclado (Windows/Linux) | \`F12\` ou \`Ctrl + Shift + I\` |
| Teclado (macOS) | \`Cmd + Option + I\` |
| Menu de contexto | Clique direito → **Inspecionar** |
| Menu do navegador | Menu → Mais ferramentas → Ferramentas do desenvolvedor |

A forma mais prática no dia a dia é **clicar com o botão direito** em qualquer elemento e selecionar **"Inspecionar"**.

## A aba Elements (Elementos)

Esta é a aba mais importante para quem está aprendendo HTML. Ela mostra:

### Árvore DOM
A estrutura HTML da página em formato de árvore. Você pode:
- **Expandir e recolher** elementos clicando nas setas
- Ver a **hierarquia** de tags (quem está dentro de quem)
- **Selecionar** um elemento para ver seus detalhes

### Inspeção visual
Ao passar o mouse sobre um elemento na árvore, ele é **destacado** na página, mostrando:
- A área do conteúdo (azul)
- O padding (verde)
- A borda (amarelo)
- A margem (laranja)

### Edição ao vivo
Você pode **editar o HTML diretamente** no DevTools:
- Dê um **duplo clique** no texto para editá-lo
- Clique com o botão direito em uma tag para:
  - Editar como HTML
  - Adicionar atributos
  - Deletar o elemento
  - Copiar o elemento

> **Importante**: as alterações feitas no DevTools são **temporárias**. Ao recarregar a página, tudo volta ao original. Isso é perfeito para experimentar sem medo!

## Seletor de elementos

O ícone de cursor no canto superior esquerdo do DevTools (ou \`Ctrl + Shift + C\`) ativa o **modo de seleção**. Com ele ativo, basta clicar em qualquer elemento da página para localizá-lo na árvore DOM.

## A aba Console

A aba Console mostra:
- **Erros** de HTML, CSS e JavaScript
- Mensagens de aviso
- Permite executar JavaScript diretamente

Para iniciantes em HTML, o Console é útil para identificar erros na página.

## Dica: modo responsivo

Pressione \`Ctrl + Shift + M\` (ou clique no ícone de dispositivos) para ativar o **modo responsivo**. Ele simula como sua página aparece em diferentes tamanhos de tela (celular, tablet, desktop).`,
            },
          },
          {
            title: 'Exercício: Inspecionar e editar HTML no navegador',
            contentType: 'exercise' as const,
            order: 3,
            content: {
              language: 'html' as const,
              problem: `# Inspecionar e editar HTML no navegador

## Objetivo
Praticar o uso do DevTools para inspecionar e modificar elementos HTML diretamente no navegador.

## Instruções

1. Abra a página HTML fornecida no código inicial usando o Live Server ou abrindo o arquivo diretamente no navegador
2. Abra o DevTools (F12 ou Ctrl+Shift+I)
3. Use o seletor de elementos para clicar no título da página
4. No painel Elements, altere o texto do \`<h1>\` para "Página Modificada"
5. Encontre a lista de itens e adicione um novo \`<li>\` com o texto "Item adicionado via DevTools"
6. Observe que ao recarregar (F5), as mudanças somem

## Resultado esperado
Após as modificações no DevTools, a página deve mostrar o título alterado e um novo item na lista. O código da solução mostra como a página original deve estar estruturada.`,
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Praticando DevTools</title>
</head>
<body>
    <h1>Minha Página Original</h1>
    <p>Use o DevTools para modificar esta página.</p>

    <h2>Minha Lista</h2>
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
    </ul>
</body>
</html>`,
              hints: [
                'Para abrir o DevTools, pressione F12 ou clique com o botão direito e selecione "Inspecionar"',
                'Para editar texto, dê um duplo clique sobre ele na aba Elements do DevTools',
                'Para adicionar um novo elemento, clique com o botão direito em um <li> existente e selecione "Edit as HTML"',
                'Você pode copiar um <li> existente e colar dentro do <ul> para adicionar um novo item',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Praticando DevTools</title>
</head>
<body>
    <h1>Página Modificada</h1>
    <p>Use o DevTools para modificar esta página.</p>

    <h2>Minha Lista</h2>
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
        <li>Item adicionado via DevTools</li>
    </ul>
</body>
</html>`,
            },
          },
        ],
      },
    ],
  },
  {
    title: 'Textos e Links',
    description: 'Marcar conteúdo textual e criar navegação com links.',
    order: 2,
    lessons: [
      {
        title: 'Títulos e parágrafos',
        slug: 'titulos-e-paragrafos',
        description: 'Aprender a usar títulos, parágrafos e elementos de separação para estruturar o conteúdo textual.',
        type: 'text' as const,
        isFree: false,
        order: 1,
        sections: [
          {
            title: 'Usar títulos h1 a h6',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Títulos em HTML: de h1 a h6

Os títulos são um dos elementos mais importantes do HTML. Eles criam a **hierarquia** do conteúdo e são essenciais para acessibilidade e SEO.

## Os seis níveis de título

O HTML oferece seis níveis de título, do mais importante (\`<h1>\`) ao menos importante (\`<h6>\`):

\`\`\`html
<h1>Título nível 1 — O mais importante</h1>
<h2>Título nível 2 — Subtítulo principal</h2>
<h3>Título nível 3 — Subseção</h3>
<h4>Título nível 4 — Sub-subseção</h4>
<h5>Título nível 5 — Raramente usado</h5>
<h6>Título nível 6 — Quase nunca necessário</h6>
\`\`\`

Visualmente, cada nível é menor que o anterior, mas o tamanho visual pode ser alterado com CSS. O importante é o **significado semântico**.

## Hierarquia correta

Pense nos títulos como o **índice de um livro**:

\`\`\`html
<h1>Receitas Brasileiras</h1>

    <h2>Pratos Principais</h2>
        <h3>Feijoada</h3>
        <h3>Moqueca</h3>

    <h2>Sobremesas</h2>
        <h3>Brigadeiro</h3>
        <h3>Pudim</h3>
\`\`\`

### Regras de hierarquia

1. **Use apenas um \`<h1>\` por página** — ele representa o assunto principal
2. **Não pule níveis** — não vá de \`<h1>\` direto para \`<h3>\`
3. **Mantenha a sequência lógica** — \`<h2>\` depois de \`<h1>\`, \`<h3>\` depois de \`<h2>\`

### Exemplo incorreto:

\`\`\`html
<!-- ❌ Errado: pula do h1 para h3 -->
<h1>Meu Site</h1>
<h3>Sobre mim</h3>

<!-- ❌ Errado: múltiplos h1 -->
<h1>Seção 1</h1>
<h1>Seção 2</h1>
\`\`\`

### Exemplo correto:

\`\`\`html
<!-- ✅ Correto -->
<h1>Meu Site</h1>
<h2>Sobre mim</h2>
<h2>Meus projetos</h2>
<h3>Projeto 1</h3>
<h3>Projeto 2</h3>
\`\`\`

## Por que a hierarquia importa?

### Acessibilidade
Leitores de tela permitem que usuários com deficiência visual **naveguem pelos títulos** da página. Uma hierarquia correta funciona como um índice falado.

### SEO (Search Engine Optimization)
Os mecanismos de busca como o Google usam os títulos para entender o conteúdo da página:
- O \`<h1>\` é o mais relevante para o ranking
- Títulos ajudam o Google a entender a estrutura do conteúdo
- Palavras-chave nos títulos têm mais peso

### Escaneabilidade
A maioria dos usuários **escaneia** a página antes de ler. Títulos bem organizados ajudam o leitor a encontrar rapidamente o que procura.

## Não use títulos para tamanho

Um erro comum é usar \`<h3>\` ou \`<h4>\` apenas porque o tamanho visual parece adequado. Isso é **incorreto**. Use CSS para ajustar o tamanho:

\`\`\`html
<!-- ❌ Errado: usando h4 pelo tamanho -->
<h4>Este texto é pequeno</h4>

<!-- ✅ Correto: usando CSS para ajustar -->
<h2 style="font-size: 16px;">Este texto tem o tamanho que eu quero</h2>
\`\`\``,
            },
          },
          {
            title: 'Formatar parágrafos e quebras',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Parágrafos e elementos de separação

Após os títulos, os parágrafos são os elementos mais usados para conteúdo textual em HTML.

## A tag \`<p>\` — Parágrafos

A tag \`<p>\` define um parágrafo de texto. O navegador automaticamente adiciona **espaçamento** antes e depois de cada parágrafo.

\`\`\`html
<p>Este é o primeiro parágrafo. Ele contém uma ideia completa sobre um assunto.</p>

<p>Este é o segundo parágrafo. Note que o navegador separa os parágrafos visualmente com espaço.</p>
\`\`\`

### Comportamento importante

O HTML **ignora espaços e quebras de linha extras** dentro de uma tag. Observe:

\`\`\`html
<p>Este      texto    tem
muitos      espaços
e quebras          de linha.</p>
\`\`\`

O navegador renderiza como: "Este texto tem muitos espaços e quebras de linha." — tudo em uma única linha, com apenas um espaço entre as palavras.

Isso é chamado de **colapso de espaços em branco** (whitespace collapsing).

## A tag \`<br>\` — Quebra de linha

Quando você precisa de uma quebra de linha **dentro** de um parágrafo (sem criar um novo parágrafo), use \`<br>\`:

\`\`\`html
<p>
    Rua das Flores, 123<br>
    Bairro Centro<br>
    São Paulo - SP<br>
    CEP: 01000-000
</p>
\`\`\`

A tag \`<br>\` é **auto-fechante** — não tem tag de fechamento.

### Quando usar \`<br>\`

- Endereços
- Poemas e letras de música
- Casos onde a quebra de linha faz parte do conteúdo

### Quando NÃO usar \`<br>\`

- Para criar espaçamento entre elementos — use CSS (\`margin\` e \`padding\`)
- Para separar parágrafos — use múltiplas tags \`<p>\`
- Múltiplos \`<br>\` seguidos para criar espaço é uma **prática ruim**

\`\`\`html
<!-- ❌ Errado: usando br para espaçamento -->
<p>Primeiro texto</p>
<br><br><br>
<p>Segundo texto</p>

<!-- ✅ Correto: usando CSS -->
<p style="margin-bottom: 40px;">Primeiro texto</p>
<p>Segundo texto</p>
\`\`\`

## A tag \`<hr>\` — Linha horizontal (separador temático)

A tag \`<hr>\` cria uma **linha horizontal** que representa uma separação temática no conteúdo:

\`\`\`html
<h2>Capítulo 1</h2>
<p>Conteúdo do primeiro capítulo...</p>

<hr>

<h2>Capítulo 2</h2>
<p>Conteúdo do segundo capítulo...</p>
\`\`\`

A tag \`<hr>\` também é **auto-fechante** e tem significado semântico: indica uma **mudança de assunto** ou uma **transição** no conteúdo.

## Entidades HTML para espaços especiais

Quando você precisa de espaços que o navegador não colapse, use entidades HTML:

| Entidade | Descrição | Uso |
|----------|-----------|-----|
| \`&nbsp;\` | Espaço não-quebrável | Impede quebra de linha entre palavras |
| \`&ensp;\` | Espaço médio | Espaçamento decorativo |
| \`&emsp;\` | Espaço largo | Indentação visual |

\`\`\`html
<p>Preço:&nbsp;R$&nbsp;49,90</p>
<!-- O preço não será separado por quebra de linha -->
\`\`\``,
            },
          },
          {
            title: 'Exercício: Estruturar um artigo',
            contentType: 'exercise' as const,
            order: 3,
            content: {
              language: 'html' as const,
              problem: `# Estruture um artigo com títulos e parágrafos

## Objetivo
Criar uma página HTML que simule um artigo de blog sobre tecnologia, usando corretamente títulos, parágrafos e separadores.

## Requisitos

1. Use a estrutura HTML5 completa (DOCTYPE, html, head, body)
2. O artigo deve ter:
   - Um \`<h1>\` como título principal do artigo
   - Pelo menos 3 seções com \`<h2>\`
   - Pelo menos uma subseção com \`<h3>\`
   - Pelo menos 5 parágrafos \`<p>\` distribuídos nas seções
   - Um \`<hr>\` separando o conteúdo principal de uma nota final
   - Um endereço usando \`<br>\` para quebras de linha
3. A hierarquia de títulos deve estar correta (sem pular níveis)`,
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Artigo</title>
</head>
<body>
    <!-- Estruture seu artigo aqui -->
</body>
</html>`,
              hints: [
                'Comece com um <h1> para o título do artigo, depois use <h2> para cada seção principal',
                'Use <h3> dentro de uma seção <h2> para criar subseções',
                'Coloque o <hr> antes da nota final ou informações de contato',
                'Use <br> apenas no endereço, não para criar espaçamento entre parágrafos',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>O Futuro da Inteligência Artificial</title>
</head>
<body>
    <h1>O Futuro da Inteligência Artificial</h1>

    <h2>O que é Inteligência Artificial?</h2>
    <p>Inteligência Artificial (IA) é um campo da ciência da computação dedicado a criar sistemas capazes de realizar tarefas que normalmente exigiriam inteligência humana.</p>
    <p>Essas tarefas incluem reconhecimento de fala, tomada de decisões, tradução de idiomas e percepção visual.</p>

    <h2>Aplicações no dia a dia</h2>
    <p>A IA já está presente em nossas vidas de diversas formas, desde assistentes virtuais como Alexa e Siri até sistemas de recomendação da Netflix e Spotify.</p>

    <h3>Saúde</h3>
    <p>Na área da saúde, algoritmos de IA auxiliam no diagnóstico precoce de doenças, análise de exames de imagem e desenvolvimento de novos medicamentos.</p>

    <h3>Educação</h3>
    <p>Plataformas de ensino utilizam IA para personalizar o aprendizado, identificando pontos fortes e fracos de cada estudante.</p>

    <h2>Desafios e preocupações</h2>
    <p>Apesar dos avanços, a IA traz desafios importantes como questões éticas, privacidade de dados e o impacto no mercado de trabalho.</p>

    <hr>

    <p>Artigo publicado por:</p>
    <p>
        Redação TechBlog<br>
        Rua da Tecnologia, 500<br>
        São Paulo - SP<br>
        CEP: 01310-100
    </p>
</body>
</html>`,
            },
          },
          {
            title: 'Quiz: Hierarquia de títulos',
            contentType: 'quiz' as const,
            order: 4,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Quantas tags <h1> devem existir por página, segundo as boas práticas?',
                  options: [
                    'Quantas forem necessárias',
                    'Exatamente uma',
                    'No máximo duas',
                    'Nenhuma, pois <h1> é obsoleto',
                  ],
                  correctAnswer: 1,
                  explanation: 'A boa prática recomenda usar exatamente um <h1> por página, representando o assunto principal. Isso ajuda na acessibilidade e no SEO.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'É correto usar um <h3> logo após um <h1>, sem um <h2> intermediário.',
                  options: ['Verdadeiro', 'Falso'],
                  correctAnswer: 1,
                  explanation: 'Falso. Pular níveis de título quebra a hierarquia do documento. Após um <h1>, deve vir um <h2>, depois <h3>, e assim por diante.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Qual tag cria uma linha horizontal que indica separação temática?',
                  options: ['<br>', '<hr>', '<line>', '<separator>'],
                  correctAnswer: 1,
                  explanation: 'A tag <hr> (horizontal rule) cria uma linha horizontal e indica uma separação temática no conteúdo. É auto-fechante.',
                },
                {
                  id: 'q4',
                  type: 'true_false',
                  question: 'Múltiplas tags <br> seguidas são a forma recomendada de criar espaçamento entre parágrafos.',
                  options: ['Verdadeiro', 'Falso'],
                  correctAnswer: 1,
                  explanation: 'Falso. Usar múltiplos <br> para espaçamento é uma prática ruim. O correto é usar tags <p> separadas e controlar o espaçamento com CSS (margin/padding).',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Formatação de texto',
        slug: 'formatacao-de-texto',
        description: 'Aprender a usar tags de ênfase, importância, citações e código para formatar texto semanticamente.',
        type: 'text' as const,
        isFree: false,
        order: 2,
        sections: [
          {
            title: 'Aplicar ênfase e importância',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Ênfase e importância no texto

O HTML oferece tags específicas para dar **significado** a trechos de texto. É fundamental entender a diferença entre formatação **semântica** e formatação **visual**.

## Semântica vs Visual

| Abordagem | Foco | Exemplo |
|-----------|------|---------|
| **Semântica** | Significado do conteúdo | \`<strong>\` = importância |
| **Visual** | Aparência na tela | \`<b>\` = negrito visual |

Sempre prefira a abordagem semântica, pois ela é melhor para acessibilidade e SEO.

## \`<strong>\` — Importância forte

A tag \`<strong>\` indica que o conteúdo tem **forte importância**. Por padrão, os navegadores exibem em **negrito**.

\`\`\`html
<p>Atenção: <strong>nunca compartilhe sua senha</strong> com outras pessoas.</p>
<p><strong>Prazo final: 15 de março de 2025.</strong></p>
\`\`\`

Leitores de tela dão **ênfase vocal** ao conteúdo dentro de \`<strong>\`.

## \`<em>\` — Ênfase

A tag \`<em>\` indica **ênfase** no texto, alterando o sentido da frase. Por padrão, é exibida em *itálico*.

\`\`\`html
<p>Eu <em>nunca</em> disse isso.</p>
<p>Eu nunca <em>disse</em> isso.</p>
\`\`\`

Note como a ênfase em palavras diferentes muda o significado da frase. Isso é semântica em ação!

## \`<b>\` e \`<i>\` — Formatação visual

Essas tags existem para formatação **puramente visual**, sem significado semântico adicional:

- \`<b>\`: texto em negrito sem importância especial
- \`<i>\`: texto em itálico sem ênfase (usado para termos técnicos, palavras em outro idioma, etc.)

\`\`\`html
<p>O nome científico do gato é <i>Felis catus</i>.</p>
<p>O <b>Visual Studio Code</b> é o editor mais popular.</p>
\`\`\`

## \`<mark>\` — Texto destacado

A tag \`<mark>\` destaca um trecho como se fosse marcado com marca-texto amarelo:

\`\`\`html
<p>Os resultados mostraram que <mark>a taxa de conversão aumentou 45%</mark> no último trimestre.</p>
\`\`\`

Usos comuns:
- Destacar termos de busca nos resultados
- Chamar atenção para informações importantes
- Marcar trechos relevantes em citações

## \`<small>\` — Texto secundário

A tag \`<small>\` indica conteúdo de **menor importância** ou texto acessório:

\`\`\`html
<p>Produto por R$ 99,90 <small>(frete não incluso)</small></p>
<p><small>© 2025 Minha Empresa. Todos os direitos reservados.</small></p>
\`\`\`

## Outras tags úteis

\`\`\`html
<p>O preço era <del>R$ 199,90</del> e agora é <ins>R$ 149,90</ins>.</p>
<p>A fórmula da água é H<sub>2</sub>O.</p>
<p>O resultado é 2<sup>10</sup> = 1024.</p>
\`\`\`

| Tag | Função | Resultado visual |
|-----|--------|-----------------|
| \`<del>\` | Texto removido/excluído | ~~Riscado~~ |
| \`<ins>\` | Texto inserido/adicionado | Sublinhado |
| \`<sub>\` | Subscrito | Texto abaixo da linha |
| \`<sup>\` | Sobrescrito | Texto acima da linha |`,
            },
          },
          {
            title: 'Usar citações e código',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Citações e código em HTML

O HTML possui tags específicas para marcar citações, referências e trechos de código — elementos muito comuns em conteúdo técnico e acadêmico.

## \`<blockquote>\` — Citação em bloco

Usada para citações longas que formam um bloco separado do texto:

\`\`\`html
<blockquote cite="https://www.w3.org/People/Berners-Lee/">
    <p>A web não foi projetada apenas para humanos se comunicarem. Ela foi projetada para que as máquinas também pudessem participar.</p>
</blockquote>
<p>— Tim Berners-Lee</p>
\`\`\`

O atributo \`cite\` é opcional e indica a URL da fonte original (não é exibido visualmente).

Os navegadores geralmente exibem o blockquote com uma **margem à esquerda** para diferenciá-lo do texto normal.

## \`<q>\` — Citação inline

Para citações curtas dentro de um parágrafo:

\`\`\`html
<p>Como disse Steve Jobs: <q>A simplicidade é a sofisticação máxima.</q></p>
\`\`\`

O navegador automaticamente adiciona **aspas** ao redor do conteúdo da tag \`<q>\`.

## \`<cite>\` — Referência a uma obra

A tag \`<cite>\` é usada para referenciar o **título** de uma obra (livro, filme, música, etc.):

\`\`\`html
<p>O livro <cite>O Senhor dos Anéis</cite> foi escrito por J.R.R. Tolkien.</p>
<p>O filme <cite>Matrix</cite> revolucionou o cinema de ficção científica.</p>
\`\`\`

Por padrão, o texto dentro de \`<cite>\` é exibido em itálico.

## \`<code>\` — Código inline

Para trechos curtos de código dentro de um parágrafo:

\`\`\`html
<p>Use a tag <code>&lt;img&gt;</code> para inserir imagens.</p>
<p>A função <code>console.log()</code> exibe mensagens no console.</p>
\`\`\`

Note que usamos \`&lt;\` e \`&gt;\` para exibir os caracteres \`<\` e \`>\` literalmente, pois senão o navegador os interpretaria como tags HTML.

## \`<pre>\` — Texto pré-formatado

A tag \`<pre>\` preserva **espaços e quebras de linha** exatamente como escritos no código-fonte:

\`\`\`html
<pre>
    Nome:    João Silva
    Idade:   25 anos
    Cidade:  São Paulo
</pre>
\`\`\`

O texto é exibido em fonte monoespaçada e mantém toda a formatação original.

## \`<pre>\` + \`<code>\` — Bloco de código

A combinação mais usada para exibir blocos de código:

\`\`\`html
<pre><code>&lt;!DOCTYPE html&gt;
&lt;html lang="pt-BR"&gt;
&lt;head&gt;
    &lt;title&gt;Exemplo&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;p&gt;Olá, mundo!&lt;/p&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>
\`\`\`

## \`<kbd>\` — Entrada de teclado

A tag \`<kbd>\` representa teclas ou combinações de teclado:

\`\`\`html
<p>Para salvar, pressione <kbd>Ctrl</kbd> + <kbd>S</kbd>.</p>
<p>Pressione <kbd>F12</kbd> para abrir o DevTools.</p>
\`\`\`

## \`<abbr>\` — Abreviações

\`\`\`html
<p>O <abbr title="HyperText Markup Language">HTML</abbr> é a linguagem da web.</p>
\`\`\`

O atributo \`title\` mostra o significado completo ao passar o mouse sobre a abreviação.`,
            },
          },
          {
            title: 'Exercício: Formatar uma receita',
            contentType: 'exercise' as const,
            order: 3,
            content: {
              language: 'html' as const,
              problem: `# Formate uma página de receita

## Objetivo
Criar uma página HTML de receita culinária usando diversas tags de formatação de texto.

## Requisitos

1. Estrutura HTML5 completa
2. Título da receita em \`<h1>\`
3. Use \`<strong>\` para destacar informações importantes (tempo de preparo, rendimento)
4. Use \`<em>\` para dar ênfase a dicas importantes
5. Use \`<mark>\` para destacar o ingrediente principal
6. Use \`<small>\` para notas e observações
7. Use \`<blockquote>\` para incluir uma citação sobre culinária
8. Use \`<del>\` e \`<ins>\` para mostrar uma correção na receita
9. Use \`<kbd>\` para indicar uma temperatura do forno
10. Use \`<abbr>\` pelo menos uma vez`,
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receita</title>
</head>
<body>
    <!-- Monte sua receita aqui -->
</body>
</html>`,
              hints: [
                'Organize a receita em seções: Informações, Ingredientes, Modo de Preparo, Dica do Chef',
                'Use <strong> para o tempo de preparo: <strong>Tempo: 40 minutos</strong>',
                'Use <mark> no ingrediente principal da receita',
                'Use <blockquote> para a citação de algum chef famoso',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receita de Bolo de Cenoura</title>
</head>
<body>
    <h1>Bolo de Cenoura com Cobertura de Chocolate</h1>

    <p><strong>Tempo de preparo: 50 minutos</strong></p>
    <p><strong>Rendimento: 12 porções</strong></p>
    <p><small>Receita adaptada da tradição familiar.</small></p>

    <h2>Ingredientes</h2>
    <p><mark>3 cenouras médias</mark> descascadas e picadas</p>
    <p>4 ovos</p>
    <p>1 xícara de óleo vegetal</p>
    <p>2 xícaras de açúcar</p>
    <p><del>3 xícaras</del> <ins>2 e meia xícaras</ins> de farinha de trigo</p>
    <p>1 colher de sopa de fermento em pó</p>

    <h2>Modo de Preparo</h2>
    <p>Bata no liquidificador as cenouras, os ovos e o óleo até ficar homogêneo.</p>
    <p>Em uma tigela, misture a farinha e o açúcar. Adicione a mistura do liquidificador e mexa bem.</p>
    <p>Por último, adicione o fermento e misture <em>delicadamente</em>, sem bater demais.</p>
    <p>Asse em forno preaquecido a <kbd>180°C</kbd> por aproximadamente 40 minutos.</p>

    <h2>Cobertura</h2>
    <p>Derreta 3 colheres de chocolate em pó com 1 colher de manteiga e 2 colheres de leite. Despeje sobre o bolo ainda quente.</p>

    <hr>

    <h2>Dica do Chef</h2>
    <blockquote>
        <p>Cozinhar é como amar: ou você se entrega de corpo e alma, ou desiste logo.</p>
    </blockquote>
    <p>— <cite>Harriet Van Horne</cite></p>

    <p><em>Dica: não abra o forno nos primeiros 30 minutos para o bolo não soltar!</em></p>

    <p><small>Informação nutricional aproximada por porção: 280 <abbr title="quilocalorias">kcal</abbr>.</small></p>
</body>
</html>`,
            },
          },
          {
            title: 'Quiz: Tags de formatação',
            contentType: 'quiz' as const,
            order: 4,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual é a diferença principal entre <strong> e <b>?',
                  options: [
                    'Não há diferença, são iguais',
                    '<strong> tem significado semântico de importância, <b> é apenas visual',
                    '<b> é mais moderno que <strong>',
                    '<strong> é para títulos, <b> é para parágrafos',
                  ],
                  correctAnswer: 1,
                  explanation: '<strong> indica que o conteúdo tem forte importância (semântico), enquanto <b> apenas aplica negrito visual sem significado adicional. Leitores de tela reconhecem a diferença.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'A tag <em> é usada apenas para deixar o texto em itálico.',
                  options: ['Verdadeiro', 'Falso'],
                  correctAnswer: 1,
                  explanation: 'Falso. A tag <em> tem significado semântico de ênfase — ela altera o sentido da frase. O itálico é apenas a representação visual padrão. Para itálico sem ênfase, use <i>.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Qual combinação de tags é mais adequada para exibir um bloco de código-fonte?',
                  options: [
                    '<p> + <code>',
                    '<pre> + <code>',
                    '<div> + <span>',
                    '<blockquote> + <code>',
                  ],
                  correctAnswer: 1,
                  explanation: 'A combinação <pre> + <code> é a mais adequada: <pre> preserva espaços e quebras de linha, e <code> indica que o conteúdo é código.',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Qual tag é usada para citações longas em bloco?',
                  options: ['<q>', '<cite>', '<blockquote>', '<quote>'],
                  correctAnswer: 2,
                  explanation: '<blockquote> é usada para citações em bloco (longas). <q> é para citações inline (curtas). <cite> é para títulos de obras. A tag <quote> não existe em HTML.',
                },
                {
                  id: 'q5',
                  type: 'true_false',
                  question: 'A tag <mark> é usada para destacar texto como se fosse um marca-texto.',
                  options: ['Verdadeiro', 'Falso'],
                  correctAnswer: 0,
                  explanation: 'Verdadeiro. A tag <mark> destaca visualmente o texto com fundo amarelo (por padrão), como se fosse marcado com marca-texto. É usada para destacar trechos relevantes.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Links e navegação',
        slug: 'links-e-navegacao',
        description: 'Dominar a criação de links para navegação entre páginas e dentro de uma mesma página.',
        type: 'text' as const,
        isFree: false,
        order: 3,
        sections: [
          {
            title: 'Criar links com a tag a',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Criando links com a tag \`<a>\`

Os links (hiperlinks) são a essência da web. São eles que conectam páginas e permitem a **navegação**. A tag \`<a>\` (âncora) é usada para criar links.

## Sintaxe básica

\`\`\`html
<a href="https://www.google.com">Ir para o Google</a>
\`\`\`

- \`<a>\`: tag de âncora
- \`href\`: atributo que define o **destino** do link (para onde o usuário vai)
- O texto entre as tags é o **conteúdo clicável**

## O atributo \`href\`

O \`href\` (Hypertext REFerence) aceita diferentes tipos de valores:

### Links absolutos
URL completa, incluindo o protocolo:

\`\`\`html
<a href="https://www.exemplo.com/pagina">Link absoluto</a>
\`\`\`

Usado para links **externos** (outros sites).

### Links relativos
Caminho relativo ao documento atual:

\`\`\`html
<!-- Arquivo na mesma pasta -->
<a href="sobre.html">Sobre nós</a>

<!-- Arquivo em uma subpasta -->
<a href="pages/contato.html">Contato</a>

<!-- Arquivo na pasta pai -->
<a href="../index.html">Voltar ao início</a>
\`\`\`

Usado para links **internos** (dentro do mesmo site).

### Diferença visual:

| Tipo | Exemplo | Quando usar |
|------|---------|-------------|
| Absoluto | \`https://site.com/pg\` | Links para outros sites |
| Relativo | \`pagina.html\` | Links dentro do seu site |

## O atributo \`target\`

Define **onde** o link será aberto:

\`\`\`html
<!-- Abre na mesma aba (padrão) -->
<a href="pagina.html">Mesma aba</a>

<!-- Abre em nova aba -->
<a href="https://google.com" target="_blank">Nova aba</a>
\`\`\`

| Valor | Comportamento |
|-------|---------------|
| \`_self\` | Mesma aba (padrão) |
| \`_blank\` | Nova aba/janela |

### Segurança com \`target="_blank"\`

Ao usar \`target="_blank"\`, adicione \`rel="noopener noreferrer"\` por segurança:

\`\`\`html
<a href="https://externo.com" target="_blank" rel="noopener noreferrer">
    Link externo seguro
</a>
\`\`\`

Isso impede que a página aberta tenha acesso à sua página original (evita um tipo de ataque chamado **tabnapping**).

## O atributo \`title\`

Adiciona uma **dica** (tooltip) que aparece ao passar o mouse:

\`\`\`html
<a href="https://developer.mozilla.org" title="Documentação para desenvolvedores web">
    MDN Web Docs
</a>
\`\`\`

## Links com imagens

Qualquer conteúdo pode ser clicável dentro de um \`<a>\`:

\`\`\`html
<a href="pagina.html">
    <img src="logo.png" alt="Logo do site">
</a>
\`\`\`

## Estados dos links

Os links possuem estados visuais padrão:

| Estado | Cor padrão | Descrição |
|--------|-----------|-----------|
| Normal | Azul | Link não visitado |
| Visitado | Roxo | Link já clicado |
| Hover | — | Mouse sobre o link |
| Ativo | Vermelho | Durante o clique |

Essas cores podem ser personalizadas com CSS.`,
            },
          },
          {
            title: 'Navegar dentro da página',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Navegação dentro da página com âncoras

Além de navegar entre páginas diferentes, é possível criar links que levam o usuário a **seções específicas** dentro da mesma página. Isso é feito com **âncoras**.

## Como funcionam as âncoras

O processo tem duas etapas:

1. **Criar um ponto de destino** usando o atributo \`id\` em qualquer elemento
2. **Criar o link** apontando para esse \`id\` com \`#\`

\`\`\`html
<!-- 1. O destino (pode ser qualquer elemento) -->
<h2 id="sobre">Sobre nós</h2>

<!-- 2. O link que aponta para o destino -->
<a href="#sobre">Ir para Sobre nós</a>
\`\`\`

Quando o usuário clica no link, a página rola automaticamente até o elemento com \`id="sobre"\`.

## Criando um menu de navegação interna

Um uso muito comum é criar um índice no topo da página:

\`\`\`html
<h1>Guia Completo de HTML</h1>

<!-- Menu de navegação -->
<nav>
    <p>Nesta página:</p>
    <a href="#introducao">Introdução</a> |
    <a href="#historia">História</a> |
    <a href="#tags">Tags básicas</a> |
    <a href="#conclusao">Conclusão</a>
</nav>

<!-- Conteúdo -->
<h2 id="introducao">Introdução</h2>
<p>O HTML é a linguagem fundamental da web...</p>

<h2 id="historia">História</h2>
<p>Criado em 1991 por Tim Berners-Lee...</p>

<h2 id="tags">Tags básicas</h2>
<p>As principais tags são...</p>

<h2 id="conclusao">Conclusão</h2>
<p>HTML é essencial para qualquer desenvolvedor...</p>
\`\`\`

## Regras para o atributo \`id\`

- Deve ser **único** na página (não pode haver dois elementos com o mesmo id)
- Não pode conter espaços
- Deve começar com uma letra
- Pode conter letras, números, hífens e underscores

\`\`\`html
<!-- ✅ IDs válidos -->
<div id="secao-1"></div>
<div id="menu_principal"></div>
<div id="contato"></div>

<!-- ❌ IDs inválidos -->
<div id="1secao"></div>       <!-- Começa com número -->
<div id="minha seção"></div>  <!-- Contém espaço -->
\`\`\`

## Link "Voltar ao topo"

Um padrão muito comum é adicionar um link para voltar ao início da página:

\`\`\`html
<!-- No topo da página -->
<h1 id="topo">Meu Site</h1>

<!-- Em qualquer lugar da página -->
<a href="#topo">↑ Voltar ao topo</a>
\`\`\`

## Scroll suave com CSS

Por padrão, a navegação por âncora é instantânea. Para um efeito de rolagem suave, adicione CSS:

\`\`\`html
<style>
    html {
        scroll-behavior: smooth;
    }
</style>
\`\`\`

Com essa única linha de CSS, todos os links de âncora terão uma animação suave de rolagem.

## Combinando âncoras com links externos

Você pode apontar para uma seção específica de **outra página**:

\`\`\`html
<!-- Vai para a seção "precos" da página produtos.html -->
<a href="produtos.html#precos">Ver preços</a>

<!-- Vai para a seção de um site externo -->
<a href="https://pt.wikipedia.org/wiki/HTML#História">História do HTML na Wikipedia</a>
\`\`\``,
            },
          },
          {
            title: 'Entender links especiais',
            contentType: 'text' as const,
            order: 3,
            content: {
              body: `# Links especiais em HTML

Além de links para páginas web, a tag \`<a>\` suporta diversos tipos de links especiais que acionam ações do sistema operacional ou do navegador.

## \`mailto:\` — Link de e-mail

Cria um link que abre o cliente de e-mail padrão do usuário:

\`\`\`html
<a href="mailto:contato@exemplo.com">Envie um e-mail</a>
\`\`\`

Você pode pré-preencher campos do e-mail:

\`\`\`html
<a href="mailto:contato@exemplo.com?subject=Dúvida&body=Olá, tenho uma dúvida...">
    Enviar e-mail com assunto
</a>
\`\`\`

Parâmetros disponíveis:
- \`subject\` — Assunto do e-mail
- \`body\` — Corpo da mensagem
- \`cc\` — Cópia
- \`bcc\` — Cópia oculta

\`\`\`html
<a href="mailto:contato@exemplo.com?cc=copia@exemplo.com&subject=Orçamento">
    Pedir orçamento
</a>
\`\`\`

## \`tel:\` — Link de telefone

Cria um link que inicia uma chamada telefônica (especialmente útil em dispositivos móveis):

\`\`\`html
<a href="tel:+5511999999999">Ligar: (11) 99999-9999</a>
\`\`\`

Boas práticas:
- Use o formato internacional com \`+\` e código do país
- Não use espaços, parênteses ou hífens dentro do \`href\`
- O texto visível pode ter a formatação que preferir

\`\`\`html
<!-- href sem formatação, texto com formatação -->
<a href="tel:+551130001234">(11) 3000-1234</a>
\`\`\`

## \`download\` — Link de download

O atributo \`download\` indica que o link deve baixar o arquivo em vez de abri-lo:

\`\`\`html
<!-- Baixa o arquivo com o nome original -->
<a href="documentos/manual.pdf" download>Baixar manual</a>

<!-- Baixa com um nome personalizado -->
<a href="documentos/manual-v2.pdf" download="manual-do-usuario.pdf">
    Baixar manual
</a>
\`\`\`

Sem o atributo \`download\`, o navegador tentaria **abrir** o PDF. Com \`download\`, ele inicia o **download** automaticamente.

### Limitações do download

- Funciona apenas para arquivos do **mesmo domínio** (mesma origem)
- Para links externos, o navegador pode ignorar o atributo
- O usuário sempre pode cancelar o download

## Links para WhatsApp

Embora não seja um padrão HTML, é muito utilizado no Brasil:

\`\`\`html
<a href="https://wa.me/5511999999999?text=Olá, gostaria de mais informações" target="_blank">
    Falar no WhatsApp
</a>
\`\`\`

## Links para Skype

\`\`\`html
<a href="skype:nome.usuario?chat">Conversar no Skype</a>
<a href="skype:nome.usuario?call">Ligar no Skype</a>
\`\`\`

## Resumo dos tipos de link

| Tipo | Prefixo no href | Ação |
|------|-----------------|------|
| Página web | \`https://\` ou relativo | Navega para a página |
| Âncora | \`#id\` | Rola até o elemento |
| E-mail | \`mailto:\` | Abre cliente de e-mail |
| Telefone | \`tel:\` | Inicia chamada |
| Download | atributo \`download\` | Baixa o arquivo |

## Acessibilidade em links

Sempre escreva textos de link **descritivos**:

\`\`\`html
<!-- ❌ Ruim para acessibilidade -->
<a href="produtos.html">Clique aqui</a>
<a href="manual.pdf">Saiba mais</a>

<!-- ✅ Bom para acessibilidade -->
<a href="produtos.html">Ver nossos produtos</a>
<a href="manual.pdf" download>Baixar o manual em PDF</a>
\`\`\`

Leitores de tela frequentemente listam todos os links da página. "Clique aqui" repetido não ajuda o usuário a entender o destino de cada link.`,
            },
          },
          {
            title: 'Exercício: Criar página com navegação interna',
            contentType: 'exercise' as const,
            order: 4,
            content: {
              language: 'html' as const,
              problem: `# Crie uma página com navegação interna e links externos

## Objetivo
Criar uma página de portfólio pessoal que utilize navegação por âncoras, links externos e links especiais.

## Requisitos

1. Estrutura HTML5 completa com \`scroll-behavior: smooth\` no CSS
2. Um menu de navegação no topo com links de âncora para as seções:
   - Sobre mim
   - Projetos
   - Contato
3. Seção "Sobre mim" com um parágrafo de apresentação
4. Seção "Projetos" com pelo menos 2 projetos, cada um com:
   - Um link externo (pode ser fictício) que abre em nova aba
5. Seção "Contato" com:
   - Um link \`mailto:\` para e-mail
   - Um link \`tel:\` para telefone
   - Um link para WhatsApp
6. Um link "Voltar ao topo" no final da página
7. Use a tag \`<nav>\` para o menu de navegação`,
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Portfólio</title>
    <style>
        html {
            scroll-behavior: smooth;
        }
    </style>
</head>
<body>
    <!-- Crie seu portfólio com navegação aqui -->
</body>
</html>`,
              hints: [
                'Adicione id="topo" no primeiro elemento da página para o link "Voltar ao topo"',
                'Use <nav> com links <a href="#secao"> para o menu de navegação',
                'Para links externos, adicione target="_blank" rel="noopener noreferrer"',
                'O link do WhatsApp usa o formato: https://wa.me/5511999999999',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Portfólio</title>
    <style>
        html {
            scroll-behavior: smooth;
        }
    </style>
</head>
<body>
    <h1 id="topo">Portfólio — Ana Costa</h1>

    <nav>
        <a href="#sobre">Sobre mim</a> |
        <a href="#projetos">Projetos</a> |
        <a href="#contato">Contato</a>
    </nav>

    <hr>

    <h2 id="sobre">Sobre mim</h2>
    <p>Olá! Meu nome é Ana Costa e sou desenvolvedora web em formação. Estou aprendendo HTML, CSS e JavaScript para criar sites modernos e acessíveis.</p>
    <p>Tenho paixão por tecnologia e design, e acredito que a web deve ser acessível para todos.</p>

    <h2 id="projetos">Projetos</h2>

    <h3>Landing Page — Café Aroma</h3>
    <p>Uma página institucional para uma cafeteria fictícia, com menu e informações de contato.</p>
    <p><a href="https://exemplo.com/cafe-aroma" target="_blank" rel="noopener noreferrer">Ver projeto online</a></p>

    <h3>Blog Pessoal</h3>
    <p>Um blog simples feito em HTML e CSS para compartilhar artigos sobre tecnologia.</p>
    <p><a href="https://exemplo.com/blog" target="_blank" rel="noopener noreferrer">Ver projeto online</a></p>

    <h2 id="contato">Contato</h2>
    <p>Entre em contato comigo:</p>
    <p><a href="mailto:ana.costa@exemplo.com?subject=Contato pelo portfólio">Enviar e-mail</a></p>
    <p><a href="tel:+5511988887777">Ligar: (11) 98888-7777</a></p>
    <p><a href="https://wa.me/5511988887777?text=Olá Ana, vi seu portfólio!" target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a></p>

    <hr>

    <p><a href="#topo">↑ Voltar ao topo</a></p>
</body>
</html>`,
            },
          },
          {
            title: 'Quiz: Links e navegação',
            contentType: 'quiz' as const,
            order: 5,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual atributo da tag <a> define o destino do link?',
                  options: ['src', 'href', 'link', 'target'],
                  correctAnswer: 1,
                  explanation: 'O atributo href (Hypertext REFerence) define o destino do link, ou seja, para onde o usuário será levado ao clicar.',
                },
                {
                  id: 'q2',
                  type: 'multiple_choice',
                  question: 'Para fazer um link abrir em uma nova aba, qual atributo e valor devem ser usados?',
                  options: [
                    'href="_new"',
                    'target="_blank"',
                    'open="new"',
                    'window="blank"',
                  ],
                  correctAnswer: 1,
                  explanation: 'O atributo target="_blank" faz o link abrir em uma nova aba ou janela do navegador.',
                },
                {
                  id: 'q3',
                  type: 'true_false',
                  question: 'Para criar uma âncora dentro da mesma página, usamos o atributo id no destino e href="#id" no link.',
                  options: ['Verdadeiro', 'Falso'],
                  correctAnswer: 0,
                  explanation: 'Verdadeiro. O elemento de destino recebe um atributo id (ex: id="secao") e o link aponta para ele com href="#secao". O # indica que é uma âncora interna.',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Qual é a forma correta de criar um link de e-mail?',
                  options: [
                    '<a href="email:contato@site.com">',
                    '<a href="mailto:contato@site.com">',
                    '<a href="mail:contato@site.com">',
                    '<email>contato@site.com</email>',
                  ],
                  correctAnswer: 1,
                  explanation: 'O prefixo correto para links de e-mail é mailto: seguido do endereço. Ex: <a href="mailto:contato@site.com">.',
                },
                {
                  id: 'q5',
                  type: 'true_false',
                  question: 'O atributo download na tag <a> faz o navegador baixar o arquivo em vez de abri-lo.',
                  options: ['Verdadeiro', 'Falso'],
                  correctAnswer: 0,
                  explanation: 'Verdadeiro. O atributo download indica ao navegador que o recurso deve ser baixado. Também permite definir um nome personalizado para o arquivo baixado.',
                },
              ],
            },
          },
        ],
      },
    ],
  },,
{
    title: 'Listas, Imagens e Mídia',
    description: 'Incorporar listas, imagens, áudio e vídeo.',
    order: 3,
    lessons: [
      {
        title: 'Listas',
        slug: 'listas',
        description: 'Criar e organizar conteúdo com listas HTML.',
        type: 'text' as const,
        isFree: false,
        order: 1,
        sections: [
          {
            title: 'Criar listas ordenadas e não-ordenadas',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Listas Ordenadas e Não-Ordenadas

As listas são elementos fundamentais do HTML usados para agrupar itens relacionados. Existem dois tipos principais: **listas não-ordenadas** e **listas ordenadas**.

## Lista Não-Ordenada (\`<ul>\`)

A tag \`<ul>\` (unordered list) cria uma lista com marcadores (bullets). Cada item é representado pela tag \`<li>\` (list item).

\`\`\`html
<ul>
  <li>Arroz</li>
  <li>Feijão</li>
  <li>Macarrão</li>
</ul>
\`\`\`

O resultado será uma lista com pontos antes de cada item. Use listas não-ordenadas quando **a ordem dos itens não importa**.

## Lista Ordenada (\`<ol>\`)

A tag \`<ol>\` (ordered list) cria uma lista numerada automaticamente.

\`\`\`html
<ol>
  <li>Pré-aqueça o forno a 180°C</li>
  <li>Misture os ingredientes secos</li>
  <li>Adicione os líquidos</li>
  <li>Asse por 40 minutos</li>
</ol>
\`\`\`

Os itens aparecerão numerados de 1 a 4. Use listas ordenadas quando **a sequência é importante**, como instruções passo a passo ou rankings.

## Atributos Úteis de \`<ol>\`

A lista ordenada possui atributos que controlam a numeração:

\`\`\`html
<!-- Começar do número 5 -->
<ol start="5">
  <li>Quinto item</li>
  <li>Sexto item</li>
</ol>

<!-- Ordem reversa -->
<ol reversed>
  <li>Terceiro lugar</li>
  <li>Segundo lugar</li>
  <li>Primeiro lugar</li>
</ol>

<!-- Tipo de numeração -->
<ol type="A">
  <li>Item A</li>
  <li>Item B</li>
</ol>
\`\`\`

Os valores possíveis para \`type\` são: \`1\` (números, padrão), \`A\` (letras maiúsculas), \`a\` (letras minúsculas), \`I\` (romanos maiúsculos) e \`i\` (romanos minúsculos).

## Quando Usar Cada Uma

| Situação | Tipo de Lista |
|----------|---------------|
| Lista de compras | \`<ul>\` |
| Receita (passo a passo) | \`<ol>\` |
| Menu de navegação | \`<ul>\` |
| Ranking de classificação | \`<ol>\` |
| Características de um produto | \`<ul>\` |

A escolha correta transmite significado semântico ao conteúdo, ajudando leitores de tela e mecanismos de busca a entenderem melhor a sua página.`,
            },
          },
          {
            title: 'Usar listas de definição e listas aninhadas',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Listas de Definição e Listas Aninhadas

Além das listas ordenadas e não-ordenadas, o HTML oferece **listas de definição** e a possibilidade de **aninhar listas** dentro de outras.

## Lista de Definição (\`<dl>\`)

A lista de definição é usada para pares de **termo** e **descrição**, como glossários, metadados ou perguntas frequentes.

\`\`\`html
<dl>
  <dt>HTML</dt>
  <dd>Linguagem de marcação para estruturar páginas web.</dd>

  <dt>CSS</dt>
  <dd>Linguagem de estilos para definir a aparência visual.</dd>

  <dt>JavaScript</dt>
  <dd>Linguagem de programação para interatividade.</dd>
</dl>
\`\`\`

- \`<dl>\` — definition list (a lista inteira)
- \`<dt>\` — definition term (o termo)
- \`<dd>\` — definition description (a descrição)

Um termo pode ter várias descrições, e uma descrição pode pertencer a vários termos:

\`\`\`html
<dl>
  <dt>Café</dt>
  <dt>Cafezinho</dt>
  <dd>Bebida quente feita a partir de grãos torrados.</dd>

  <dt>Chá</dt>
  <dd>Bebida feita por infusão de folhas.</dd>
  <dd>Também usado como gíria para "situação complicada".</dd>
</dl>
\`\`\`

## Listas Aninhadas

Você pode colocar uma lista dentro de um item \`<li>\` de outra lista. Isso é muito útil para criar hierarquias, menus ou categorias com subcategorias.

\`\`\`html
<ul>
  <li>Frutas
    <ul>
      <li>Maçã</li>
      <li>Banana</li>
      <li>Laranja</li>
    </ul>
  </li>
  <li>Verduras
    <ul>
      <li>Alface</li>
      <li>Couve</li>
    </ul>
  </li>
</ul>
\`\`\`

**Importante:** A lista interna deve ficar **dentro** do \`<li>\`, não fora dele. Este é um erro comum:

\`\`\`html
<!-- ❌ ERRADO: lista fora do li -->
<ul>
  <li>Frutas</li>
  <ul>
    <li>Maçã</li>
  </ul>
</ul>

<!-- ✅ CORRETO: lista dentro do li -->
<ul>
  <li>Frutas
    <ul>
      <li>Maçã</li>
    </ul>
  </li>
</ul>
\`\`\`

## Misturando Tipos de Lista

Também é possível aninhar listas de tipos diferentes:

\`\`\`html
<ol>
  <li>Preparar ingredientes
    <ul>
      <li>2 xícaras de farinha</li>
      <li>3 ovos</li>
      <li>1 xícara de leite</li>
    </ul>
  </li>
  <li>Misturar tudo em uma tigela</li>
  <li>Levar ao forno por 30 minutos</li>
</ol>
\`\`\`

Neste exemplo, a lista ordenada indica os passos, e a lista não-ordenada dentro do primeiro passo lista os ingredientes necessários.`,
            },
          },
          {
            title: 'Exercício: Criar menu de restaurante',
            contentType: 'exercise' as const,
            order: 3,
            content: {
              language: 'html' as const,
              problem: 'Crie a página de menu de um restaurante usando listas aninhadas. O menu deve ter pelo menos 3 categorias (ex: Entradas, Pratos Principais, Sobremesas) usando uma lista não-ordenada. Dentro de cada categoria, liste pelo menos 3 itens. Inclua também uma seção "Como Pedir" com instruções em lista ordenada e um glossário de termos culinários usando lista de definição.',
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Menu do Restaurante</title>
</head>
<body>
  <h1>Restaurante Sabor Brasileiro</h1>

  <h2>Nosso Menu</h2>
  <!-- Crie uma lista não-ordenada com categorias -->
  <!-- Dentro de cada categoria, aninhe outra lista com os itens -->

  <h2>Como Pedir</h2>
  <!-- Crie uma lista ordenada com os passos para fazer o pedido -->

  <h2>Glossário Culinário</h2>
  <!-- Crie uma lista de definição com termos culinários -->

</body>
</html>`,
              hints: [
                'Use <ul> para as categorias e outra <ul> aninhada dentro de cada <li> para os itens.',
                'Lembre-se de que a lista aninhada deve estar dentro do <li>, não depois dele.',
                'Para o glossário, use <dl>, <dt> e <dd>.',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Menu do Restaurante</title>
</head>
<body>
  <h1>Restaurante Sabor Brasileiro</h1>

  <h2>Nosso Menu</h2>
  <ul>
    <li>Entradas
      <ul>
        <li>Bolinho de bacalhau</li>
        <li>Coxinha de frango</li>
        <li>Bruschetta de tomate</li>
      </ul>
    </li>
    <li>Pratos Principais
      <ul>
        <li>Feijoada completa</li>
        <li>Moqueca de peixe</li>
        <li>Frango à parmegiana</li>
        <li>Risoto de cogumelos</li>
      </ul>
    </li>
    <li>Sobremesas
      <ul>
        <li>Pudim de leite</li>
        <li>Brigadeiro gourmet</li>
        <li>Açaí com granola</li>
      </ul>
    </li>
  </ul>

  <h2>Como Pedir</h2>
  <ol>
    <li>Escolha seus pratos no menu acima</li>
    <li>Chame o garçom ou use o tablet da mesa</li>
    <li>Informe o número da mesa</li>
    <li>Confirme o pedido</li>
    <li>Aguarde a entrega na mesa</li>
  </ol>

  <h2>Glossário Culinário</h2>
  <dl>
    <dt>Al dente</dt>
    <dd>Ponto de cozimento da massa em que ela fica firme ao morder.</dd>

    <dt>Gratinar</dt>
    <dd>Dourar a superfície de um prato no forno, geralmente com queijo.</dd>

    <dt>Saltear</dt>
    <dd>Cozinhar rapidamente em fogo alto com pouca gordura, mexendo sempre.</dd>

    <dt>Mise en place</dt>
    <dd>Preparação e organização de todos os ingredientes antes de começar a cozinhar.</dd>
  </dl>
</body>
</html>`,
            },
          },
          {
            title: 'Quiz: Listas',
            contentType: 'quiz' as const,
            order: 4,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual tag HTML cria uma lista não-ordenada?',
                  options: ['<ol>', '<ul>', '<dl>', '<li>'],
                  correctAnswer: 1,
                  explanation: 'A tag <ul> (unordered list) cria uma lista não-ordenada com marcadores. <ol> é para listas ordenadas, <dl> para listas de definição e <li> para itens de lista.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'Em uma lista de definição, a tag <dd> representa o termo a ser definido.',
                  correctAnswer: false,
                  explanation: 'A tag <dt> (definition term) representa o termo. A tag <dd> (definition description) representa a descrição ou definição do termo.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Qual é a forma correta de aninhar uma lista dentro de outra?',
                  options: [
                    '<ul><li>Item</li><ul><li>Sub</li></ul></ul>',
                    '<ul><li>Item<ul><li>Sub</li></ul></li></ul>',
                    '<ul><li>Item</li></ul><ul><li>Sub</li></ul>',
                    '<ul><ul><li>Sub</li></ul><li>Item</li></ul>',
                  ],
                  correctAnswer: 1,
                  explanation: 'A lista aninhada deve estar dentro do elemento <li>, antes do fechamento </li>. Colocá-la fora do <li> é HTML inválido.',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Qual atributo faz uma lista ordenada começar a contar a partir de um número específico?',
                  options: ['begin', 'start', 'from', 'value'],
                  correctAnswer: 1,
                  explanation: 'O atributo start="N" na tag <ol> define o número inicial da contagem. Por exemplo, <ol start="5"> começa a numeração em 5.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Imagens',
        slug: 'imagens',
        description: 'Inserir e otimizar imagens em páginas HTML.',
        type: 'text' as const,
        isFree: false,
        order: 2,
        sections: [
          {
            title: 'Inserir imagens com img',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Inserir Imagens com \`<img>\`

A tag \`<img>\` é usada para incorporar imagens em uma página HTML. Ela é um **elemento void** (auto-fechado), ou seja, não possui tag de fechamento.

## Sintaxe Básica

\`\`\`html
<img src="foto.jpg" alt="Descrição da foto">
\`\`\`

## Atributos Essenciais

### \`src\` (source)

Define o caminho da imagem. Pode ser relativo ou absoluto:

\`\`\`html
<!-- Caminho relativo -->
<img src="imagens/logo.png" alt="Logo da empresa">

<!-- Caminho absoluto (URL) -->
<img src="https://exemplo.com/foto.jpg" alt="Foto de exemplo">
\`\`\`

### \`alt\` (texto alternativo)

O atributo \`alt\` é **obrigatório** e serve para:
- Descrever a imagem para leitores de tela (acessibilidade)
- Aparecer quando a imagem não carrega
- Ajudar mecanismos de busca a entender o conteúdo

\`\`\`html
<!-- Bom: descreve o conteúdo da imagem -->
<img src="praia.jpg" alt="Praia de Copacabana ao pôr do sol com pessoas caminhando">

<!-- Ruim: texto genérico -->
<img src="praia.jpg" alt="imagem">

<!-- Imagem decorativa: alt vazio -->
<img src="enfeite.png" alt="">
\`\`\`

### \`width\` e \`height\`

Definir as dimensões ajuda o navegador a reservar espaço antes do carregamento, evitando **layout shift** (pulos de conteúdo):

\`\`\`html
<img src="foto.jpg" alt="Paisagem" width="800" height="600">
\`\`\`

Os valores são em pixels e **não** incluem a unidade. Mesmo que você use CSS para redimensionar, manter esses atributos é uma boa prática.

## Formatos de Imagem

| Formato | Extensão | Uso Ideal |
|---------|----------|-----------|
| JPEG | .jpg, .jpeg | Fotos, imagens com muitas cores |
| PNG | .png | Imagens com transparência, logos |
| WebP | .webp | Formato moderno, melhor compressão |
| SVG | .svg | Ícones, logos vetoriais, gráficos |
| GIF | .gif | Animações simples |
| AVIF | .avif | Formato mais recente, excelente compressão |

## Atributo \`loading\`

O carregamento tardio (lazy loading) melhora a performance ao carregar imagens apenas quando estão prestes a entrar na tela:

\`\`\`html
<!-- Carrega apenas quando próximo da viewport -->
<img src="foto.jpg" alt="Foto" loading="lazy">

<!-- Carrega imediatamente (padrão) -->
<img src="banner.jpg" alt="Banner" loading="eager">
\`\`\`

Use \`loading="lazy"\` para imagens que estão abaixo da dobra (fora da área visível inicial).`,
            },
          },
          {
            title: 'Usar figure e figcaption',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Usar \`<figure>\` e \`<figcaption>\`

Os elementos \`<figure>\` e \`<figcaption>\` adicionam **significado semântico** a conteúdos visuais, associando uma legenda a uma imagem (ou outro conteúdo).

## Sintaxe

\`\`\`html
<figure>
  <img src="grafico.png" alt="Gráfico de vendas do primeiro trimestre">
  <figcaption>Figura 1: Vendas do primeiro trimestre de 2024.</figcaption>
</figure>
\`\`\`

## O que é \`<figure>\`?

O elemento \`<figure>\` representa um conteúdo **autossuficiente** — algo que pode ser referenciado no texto principal, mas que faz sentido por si só. Não é apenas para imagens! Pode conter:

- Imagens
- Diagramas
- Blocos de código
- Citações
- Tabelas

\`\`\`html
<!-- Figura com bloco de código -->
<figure>
  <pre><code>&lt;p&gt;Olá, mundo!&lt;/p&gt;</code></pre>
  <figcaption>Exemplo de parágrafo em HTML.</figcaption>
</figure>

<!-- Figura com citação -->
<figure>
  <blockquote>
    A simplicidade é a sofisticação suprema.
  </blockquote>
  <figcaption>— Leonardo da Vinci</figcaption>
</figure>
\`\`\`

## O que é \`<figcaption>\`?

O \`<figcaption>\` é a legenda da figura. Deve ser o **primeiro ou último** filho de \`<figure>\`:

\`\`\`html
<!-- Legenda no início -->
<figure>
  <figcaption>Vista aérea de Brasília</figcaption>
  <img src="brasilia.jpg" alt="Vista aérea da Esplanada dos Ministérios em Brasília">
</figure>

<!-- Legenda no final (mais comum) -->
<figure>
  <img src="brasilia.jpg" alt="Vista aérea da Esplanada dos Ministérios em Brasília">
  <figcaption>Vista aérea de Brasília</figcaption>
</figure>
\`\`\`

## Quando Usar \`<figure>\` vs. Apenas \`<img>\`

Use **apenas \`<img>\`** quando a imagem é parte do fluxo do texto sem necessidade de legenda:

\`\`\`html
<p>Clique no ícone <img src="salvar.svg" alt="salvar"> para gravar o arquivo.</p>
\`\`\`

Use **\`<figure>\`** quando a imagem é um conteúdo referenciável com legenda:

\`\`\`html
<p>Como mostra a Figura 1, as vendas cresceram 30%.</p>
<figure>
  <img src="grafico.png" alt="Gráfico de barras mostrando crescimento de 30%">
  <figcaption>Figura 1: Crescimento de vendas no trimestre.</figcaption>
</figure>
\`\`\`

## Múltiplas Imagens em uma Figura

Uma \`<figure>\` pode conter várias imagens com uma única legenda:

\`\`\`html
<figure>
  <img src="antes.jpg" alt="Sala antes da reforma">
  <img src="depois.jpg" alt="Sala depois da reforma">
  <figcaption>Comparação: antes e depois da reforma da sala.</figcaption>
</figure>
\`\`\``,
            },
          },
          {
            title: 'Tornar imagens responsivas',
            contentType: 'text' as const,
            order: 3,
            content: {
              body: `# Tornar Imagens Responsivas

Imagens responsivas se adaptam a diferentes tamanhos de tela e resoluções, economizando banda e melhorando a experiência do usuário.

## O Elemento \`<picture>\`

O \`<picture>\` permite oferecer diferentes imagens conforme condições do dispositivo:

\`\`\`html
<picture>
  <source media="(min-width: 800px)" srcset="banner-grande.jpg">
  <source media="(min-width: 400px)" srcset="banner-medio.jpg">
  <img src="banner-pequeno.jpg" alt="Banner promocional">
</picture>
\`\`\`

O navegador escolhe a primeira \`<source>\` cuja condição é verdadeira. A tag \`<img>\` é o **fallback** obrigatório.

## Art Direction com \`<picture>\`

Art direction significa mostrar imagens com enquadramentos diferentes para cada tamanho de tela:

\`\`\`html
<picture>
  <!-- Desktop: imagem panorâmica -->
  <source media="(min-width: 1024px)" srcset="paisagem-wide.jpg">
  <!-- Tablet: imagem recortada -->
  <source media="(min-width: 600px)" srcset="paisagem-media.jpg">
  <!-- Mobile: imagem vertical focada no centro -->
  <img src="paisagem-vertical.jpg" alt="Paisagem montanhosa">
</picture>
\`\`\`

## O Atributo \`srcset\`

O \`srcset\` no \`<img>\` fornece versões da mesma imagem em resoluções diferentes:

\`\`\`html
<img
  src="foto-400.jpg"
  srcset="foto-400.jpg 400w,
          foto-800.jpg 800w,
          foto-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw,
         (max-width: 1000px) 50vw,
         33vw"
  alt="Foto de exemplo">
\`\`\`

### Como funciona:

- **\`srcset\`** lista as imagens disponíveis com suas larguras reais (em \`w\`)
- **\`sizes\`** diz ao navegador qual será o tamanho da imagem na tela
- O navegador escolhe automaticamente a melhor imagem

## Entendendo \`sizes\`

O atributo \`sizes\` usa media queries para indicar o tamanho que a imagem ocupará:

\`\`\`html
sizes="(max-width: 600px) 100vw,
       (max-width: 1000px) 50vw,
       33vw"
\`\`\`

Isso significa:
- Em telas até 600px → a imagem ocupa 100% da largura da viewport
- Em telas até 1000px → a imagem ocupa 50% da viewport
- Em telas maiores → a imagem ocupa 33% da viewport

## Formatos Modernos com \`<picture>\`

Use \`<picture>\` para oferecer formatos modernos com fallback:

\`\`\`html
<picture>
  <source srcset="foto.avif" type="image/avif">
  <source srcset="foto.webp" type="image/webp">
  <img src="foto.jpg" alt="Foto de paisagem">
</picture>
\`\`\`

O navegador usará AVIF se suportado, depois tentará WebP, e por último JPEG. Isso pode reduzir o tamanho do arquivo em até 50% sem perda visível de qualidade.

## Resumo das Técnicas

| Técnica | Quando Usar |
|---------|-------------|
| \`srcset\` + \`sizes\` | Mesma imagem em diferentes resoluções |
| \`<picture>\` + \`media\` | Imagens diferentes por tamanho de tela (art direction) |
| \`<picture>\` + \`type\` | Oferecer formatos modernos com fallback |`,
            },
          },
          {
            title: 'Exercício: Criar galeria de fotos',
            contentType: 'exercise' as const,
            order: 4,
            content: {
              language: 'html' as const,
              problem: 'Crie uma página de galeria de fotos com pelo menos 4 imagens. Cada imagem deve usar <figure> e <figcaption>. Pelo menos uma imagem deve usar o elemento <picture> para fornecer versões diferentes para desktop e mobile. Todas as imagens devem ter o atributo alt descritivo e usar loading="lazy" (exceto a primeira).',
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Galeria de Fotos</title>
</head>
<body>
  <h1>Galeria — Paisagens do Brasil</h1>

  <!-- Imagem 1: Use <picture> para art direction -->

  <!-- Imagem 2: Use <figure> com <figcaption> -->

  <!-- Imagem 3: Use <figure> com <figcaption> e loading="lazy" -->

  <!-- Imagem 4: Use <figure> com <figcaption> e loading="lazy" -->

</body>
</html>`,
              hints: [
                'A primeira imagem não precisa de loading="lazy" pois está visível ao carregar a página.',
                'No <picture>, coloque <source> antes do <img>. O <img> é obrigatório como fallback.',
                'O atributo alt deve descrever o conteúdo da imagem, não apenas dizer "imagem" ou "foto".',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Galeria de Fotos</title>
</head>
<body>
  <h1>Galeria — Paisagens do Brasil</h1>

  <figure>
    <picture>
      <source media="(min-width: 800px)" srcset="rio-panoramica.jpg">
      <source media="(min-width: 400px)" srcset="rio-media.jpg">
      <img src="rio-mobile.jpg" alt="Vista panorâmica do Rio de Janeiro com o Cristo Redentor e a Baía de Guanabara" width="800" height="500">
    </picture>
    <figcaption>Rio de Janeiro — Vista do Mirante Dona Marta.</figcaption>
  </figure>

  <figure>
    <img src="lencois.jpg" alt="Lagoas azuis entre dunas brancas nos Lençóis Maranhenses" width="800" height="500" loading="lazy">
    <figcaption>Lençóis Maranhenses — Lagoas formadas pela chuva entre as dunas.</figcaption>
  </figure>

  <figure>
    <img src="foz.jpg" alt="Cataratas do Iguaçu com arco-íris formado pela névoa das quedas d'água" width="800" height="500" loading="lazy">
    <figcaption>Foz do Iguaçu — Cataratas vistas do lado brasileiro.</figcaption>
  </figure>

  <figure>
    <img src="chapada.jpg" alt="Cachoeira da Fumaça na Chapada Diamantina com vegetação verde ao redor" width="800" height="500" loading="lazy">
    <figcaption>Chapada Diamantina — Cachoeira da Fumaça, uma das mais altas do Brasil.</figcaption>
  </figure>
</body>
</html>`,
            },
          },
          {
            title: 'Quiz: Imagens',
            contentType: 'quiz' as const,
            order: 5,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual atributo da tag <img> é obrigatório para acessibilidade?',
                  options: ['src', 'alt', 'title', 'width'],
                  correctAnswer: 1,
                  explanation: 'O atributo alt é obrigatório e fornece uma descrição textual da imagem para leitores de tela e quando a imagem não carrega.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'O elemento <picture> pode ser usado para oferecer formatos de imagem modernos como WebP com fallback para JPEG.',
                  correctAnswer: true,
                  explanation: 'Sim! Usando <source> com o atributo type, o navegador escolhe o formato que suporta. O <img> dentro de <picture> serve como fallback.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Para que serve o atributo loading="lazy" em uma imagem?',
                  options: [
                    'Carrega a imagem com baixa qualidade',
                    'Adia o carregamento até a imagem estar próxima da área visível',
                    'Impede a imagem de ser armazenada em cache',
                    'Reduz automaticamente o tamanho da imagem',
                  ],
                  correctAnswer: 1,
                  explanation: 'O loading="lazy" instrui o navegador a adiar o download da imagem até que ela esteja prestes a entrar na viewport, economizando banda.',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Qual é a função do atributo sizes no elemento <img>?',
                  options: [
                    'Define o tamanho do arquivo da imagem',
                    'Define a resolução da imagem',
                    'Informa ao navegador qual tamanho a imagem terá na tela',
                    'Define o tamanho máximo permitido para upload',
                  ],
                  correctAnswer: 2,
                  explanation: 'O atributo sizes indica ao navegador o tamanho que a imagem ocupará na tela em diferentes breakpoints, ajudando-o a escolher a imagem certa do srcset.',
                },
                {
                  id: 'q5',
                  type: 'true_false',
                  question: 'O elemento <figcaption> pode ser usado fora de um elemento <figure>.',
                  correctAnswer: false,
                  explanation: 'O <figcaption> só tem significado semântico quando usado dentro de <figure>. Fora dele, o navegador pode renderizar, mas não é HTML válido.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Áudio e Vídeo',
        slug: 'audio-e-video',
        description: 'Incorporar conteúdo multimídia com áudio, vídeo e iframe.',
        type: 'text' as const,
        isFree: false,
        order: 3,
        sections: [
          {
            title: 'Incorporar vídeo com video',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Incorporar Vídeo com \`<video>\`

O elemento \`<video>\` permite incorporar vídeos diretamente na página, sem depender de plugins externos.

## Sintaxe Básica

\`\`\`html
<video src="video.mp4" controls>
  Seu navegador não suporta o elemento de vídeo.
</video>
\`\`\`

O texto entre as tags é exibido apenas em navegadores que **não suportam** o elemento \`<video>\`.

## Atributos Principais

\`\`\`html
<video
  src="video.mp4"
  controls
  width="640"
  height="360"
  poster="thumbnail.jpg"
  preload="metadata"
>
  Seu navegador não suporta vídeo HTML5.
</video>
\`\`\`

| Atributo | Descrição |
|----------|-----------|
| \`controls\` | Exibe controles de reprodução (play, pause, volume) |
| \`autoplay\` | Inicia automaticamente (requer \`muted\` na maioria dos navegadores) |
| \`loop\` | Reinicia o vídeo ao terminar |
| \`muted\` | Inicia sem som |
| \`poster\` | Imagem de capa antes de reproduzir |
| \`preload\` | \`none\`, \`metadata\` ou \`auto\` — controla o pré-carregamento |
| \`width\` / \`height\` | Dimensões do player em pixels |

## Autoplay — Regras Importantes

A maioria dos navegadores bloqueia autoplay com áudio. Para funcionar:

\`\`\`html
<!-- Funciona: autoplay silencioso -->
<video src="intro.mp4" autoplay muted loop></video>

<!-- Geralmente bloqueado: autoplay com som -->
<video src="intro.mp4" autoplay controls></video>
\`\`\`

## Múltiplos Formatos (Fallback)

Nem todos os navegadores suportam os mesmos formatos. Use \`<source>\` para oferecer alternativas:

\`\`\`html
<video controls width="640" height="360">
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
  <source src="video.ogv" type="video/ogg">
  <p>Seu navegador não suporta vídeo HTML5.
    <a href="video.mp4">Baixe o vídeo</a>.
  </p>
</video>
\`\`\`

O navegador tentará cada \`<source>\` na ordem e usará o primeiro formato compatível.

## Formatos de Vídeo Comuns

| Formato | MIME Type | Suporte |
|---------|-----------|---------|
| MP4 (H.264) | video/mp4 | Universal |
| WebM (VP9) | video/webm | Chrome, Firefox, Edge |
| OGG (Theora) | video/ogg | Firefox, Chrome |

**Recomendação:** Sempre inclua MP4 como fallback, pois é o formato com suporte mais amplo.

## Legendas e Acessibilidade

Use \`<track>\` para adicionar legendas:

\`\`\`html
<video controls>
  <source src="aula.mp4" type="video/mp4">
  <track src="legendas-pt.vtt" kind="subtitles" srclang="pt-BR" label="Português" default>
  <track src="legendas-en.vtt" kind="subtitles" srclang="en" label="English">
</video>
\`\`\`

O formato das legendas é **WebVTT** (\`.vtt\`), um arquivo de texto simples com marcações de tempo.`,
            },
          },
          {
            title: 'Incorporar áudio com audio',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Incorporar Áudio com \`<audio>\`

O elemento \`<audio>\` permite reproduzir arquivos de áudio diretamente no navegador.

## Sintaxe Básica

\`\`\`html
<audio src="musica.mp3" controls>
  Seu navegador não suporta o elemento de áudio.
</audio>
\`\`\`

## Atributos

O \`<audio>\` compartilha muitos atributos com \`<video>\`:

\`\`\`html
<audio controls preload="metadata" loop>
  <source src="podcast.ogg" type="audio/ogg">
  <source src="podcast.mp3" type="audio/mpeg">
  Seu navegador não suporta áudio HTML5.
</audio>
\`\`\`

| Atributo | Descrição |
|----------|-----------|
| \`controls\` | Exibe os controles de reprodução |
| \`autoplay\` | Reproduz automaticamente (geralmente bloqueado) |
| \`loop\` | Repete ao terminar |
| \`muted\` | Inicia sem som |
| \`preload\` | \`none\`, \`metadata\` ou \`auto\` |

**Importante:** Sem o atributo \`controls\`, o player de áudio fica **invisível**. Sempre inclua \`controls\` a menos que esteja controlando a reprodução via JavaScript.

## Formatos de Áudio

| Formato | MIME Type | Suporte |
|---------|-----------|---------|
| MP3 | audio/mpeg | Universal |
| OGG Vorbis | audio/ogg | Firefox, Chrome |
| WAV | audio/wav | Todos (arquivos grandes) |
| AAC | audio/aac | Safari, Chrome, Edge |
| WebM Opus | audio/webm | Chrome, Firefox |

## Múltiplas Fontes

\`\`\`html
<audio controls>
  <source src="musica.webm" type="audio/webm">
  <source src="musica.ogg" type="audio/ogg">
  <source src="musica.mp3" type="audio/mpeg">
  <p>Seu navegador não suporta áudio.
    <a href="musica.mp3">Baixe o arquivo</a>.
  </p>
</audio>
\`\`\`

## Exemplo Prático: Podcast

\`\`\`html
<article>
  <h2>Episódio 10 — Introdução ao HTML</h2>
  <p>Neste episódio, falamos sobre os fundamentos do HTML.</p>
  <audio controls preload="metadata">
    <source src="ep10.mp3" type="audio/mpeg">
    Seu navegador não suporta áudio HTML5.
  </audio>
  <p><small>Duração: 25 minutos | Publicado em 15/01/2024</small></p>
</article>
\`\`\`

## Diferenças entre \`<audio>\` e \`<video>\`

- \`<audio>\` não possui os atributos \`width\`, \`height\` e \`poster\`
- \`<audio>\` não exibe conteúdo visual (apenas o player de controles)
- \`<video>\` pode reproduzir arquivos de áudio, mas exibirá uma área preta
- Ambos suportam \`<source>\` e \`<track>\``,
            },
          },
          {
            title: 'Usar iframe para conteúdo externo',
            contentType: 'text' as const,
            order: 3,
            content: {
              body: `# Usar \`<iframe>\` para Conteúdo Externo

O elemento \`<iframe>\` (inline frame) incorpora outra página HTML dentro da sua página. É usado principalmente para conteúdo de terceiros como vídeos do YouTube, mapas e widgets.

## Sintaxe Básica

\`\`\`html
<iframe
  src="https://www.example.com"
  width="600"
  height="400"
  title="Descrição do conteúdo"
></iframe>
\`\`\`

O atributo \`title\` é essencial para **acessibilidade**, descrevendo o conteúdo do iframe para leitores de tela.

## Incorporar Vídeos do YouTube

Para incorporar um vídeo do YouTube, use a URL de embed (não a URL normal):

\`\`\`html
<iframe
  width="560"
  height="315"
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  title="Título do vídeo no YouTube"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
></iframe>
\`\`\`

**Dica:** No YouTube, clique em "Compartilhar" → "Incorporar" para obter o código pronto.

## Incorporar Google Maps

\`\`\`html
<iframe
  src="https://www.google.com/maps/embed?pb=!1m18!..."
  width="600"
  height="450"
  style="border:0;"
  allowfullscreen=""
  loading="lazy"
  title="Mapa com localização do escritório"
></iframe>
\`\`\`

## Atributos Importantes

| Atributo | Descrição |
|----------|-----------|
| \`src\` | URL da página a ser incorporada |
| \`width\` / \`height\` | Dimensões do frame |
| \`title\` | Descrição para acessibilidade |
| \`loading\` | \`lazy\` para carregamento tardio |
| \`allowfullscreen\` | Permite tela cheia |
| \`sandbox\` | Restrições de segurança |
| \`allow\` | Permissões de funcionalidades |

## Segurança com \`sandbox\`

O atributo \`sandbox\` restringe o que o conteúdo do iframe pode fazer:

\`\`\`html
<!-- Iframe muito restrito -->
<iframe src="pagina.html" sandbox></iframe>

<!-- Permitir apenas scripts e formulários -->
<iframe src="pagina.html" sandbox="allow-scripts allow-forms"></iframe>
\`\`\`

Valores comuns do sandbox:

| Valor | Permissão |
|-------|-----------|
| \`allow-scripts\` | Executar JavaScript |
| \`allow-forms\` | Enviar formulários |
| \`allow-same-origin\` | Acessar cookies e storage do mesmo domínio |
| \`allow-popups\` | Abrir novas janelas |
| \`allow-top-navigation\` | Navegar a página pai |

## Cuidados ao Usar \`<iframe>\`

1. **Performance**: Cada iframe carrega uma página completa; use \`loading="lazy"\` quando possível
2. **Segurança**: Sempre use \`sandbox\` para conteúdos não confiáveis
3. **SEO**: O conteúdo dentro de iframes não é indexado como parte da sua página
4. **Responsividade**: Iframes não são responsivos por padrão; use CSS para isso

\`\`\`html
<!-- Iframe responsivo com CSS -->
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
  <iframe
    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
    title="Vídeo responsivo"
    allowfullscreen
  ></iframe>
</div>
\`\`\`

O truque do \`padding-bottom: 56.25%\` cria a proporção 16:9 (9 ÷ 16 = 0.5625).`,
            },
          },
          {
            title: 'Exercício: Criar página multimídia',
            contentType: 'exercise' as const,
            order: 4,
            content: {
              language: 'html' as const,
              problem: 'Crie uma página de portfólio multimídia que contenha: um vídeo local usando <video> com controles e pelo menos dois formatos (mp4 e webm), um player de áudio usando <audio> com controles, e um vídeo do YouTube incorporado com <iframe>. Cada mídia deve ter um título e descrição.',
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfólio Multimídia</title>
</head>
<body>
  <h1>Meu Portfólio Multimídia</h1>

  <section>
    <h2>Vídeo de Apresentação</h2>
    <!-- Adicione um elemento <video> com controls e múltiplos formatos -->
  </section>

  <section>
    <h2>Podcast sobre Tecnologia</h2>
    <!-- Adicione um elemento <audio> com controls -->
  </section>

  <section>
    <h2>Vídeo Recomendado</h2>
    <!-- Adicione um <iframe> com vídeo do YouTube -->
  </section>

</body>
</html>`,
              hints: [
                'Use <source> dentro de <video> e <audio> para oferecer múltiplos formatos.',
                'Para o iframe do YouTube, use a URL no formato https://www.youtube.com/embed/ID_DO_VIDEO.',
                'Adicione o atributo poster no <video> para mostrar uma imagem antes da reprodução.',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfólio Multimídia</title>
</head>
<body>
  <h1>Meu Portfólio Multimídia</h1>

  <section>
    <h2>Vídeo de Apresentação</h2>
    <p>Conheça um pouco sobre o meu trabalho neste vídeo de introdução.</p>
    <video controls width="640" height="360" poster="thumbnail.jpg" preload="metadata">
      <source src="apresentacao.webm" type="video/webm">
      <source src="apresentacao.mp4" type="video/mp4">
      <p>Seu navegador não suporta vídeo HTML5. <a href="apresentacao.mp4">Baixe o vídeo</a>.</p>
    </video>
  </section>

  <section>
    <h2>Podcast sobre Tecnologia</h2>
    <p>Ouça o episódio mais recente do nosso podcast sobre as novidades do mundo da tecnologia.</p>
    <audio controls preload="metadata">
      <source src="podcast.ogg" type="audio/ogg">
      <source src="podcast.mp3" type="audio/mpeg">
      Seu navegador não suporta áudio HTML5.
    </audio>
  </section>

  <section>
    <h2>Vídeo Recomendado</h2>
    <p>Um excelente vídeo sobre desenvolvimento web que recomendo assistir.</p>
    <iframe
      width="560"
      height="315"
      src="https://www.youtube.com/embed/dQw4w9WgXcQ"
      title="Vídeo recomendado sobre desenvolvimento web"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      loading="lazy"
    ></iframe>
  </section>
</body>
</html>`,
            },
          },
        ],
      },
    ],
  },
  {
    title: 'Tabelas e Formulários',
    description: 'Criar tabelas de dados e formulários interativos.',
    order: 4,
    lessons: [
      {
        title: 'Tabelas',
        slug: 'tabelas',
        description: 'Criar e estruturar tabelas de dados em HTML.',
        type: 'text' as const,
        isFree: false,
        order: 1,
        sections: [
          {
            title: 'Criar tabelas básicas',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Criar Tabelas Básicas

Tabelas HTML são usadas para exibir **dados tabulares** — informações organizadas em linhas e colunas.

## Estrutura Fundamental

\`\`\`html
<table>
  <tr>
    <th>Nome</th>
    <th>Idade</th>
    <th>Cidade</th>
  </tr>
  <tr>
    <td>Ana</td>
    <td>28</td>
    <td>São Paulo</td>
  </tr>
  <tr>
    <td>Carlos</td>
    <td>35</td>
    <td>Rio de Janeiro</td>
  </tr>
</table>
\`\`\`

## Elementos Básicos

| Tag | Nome | Função |
|-----|------|--------|
| \`<table>\` | Table | Container da tabela |
| \`<tr>\` | Table Row | Define uma linha |
| \`<th>\` | Table Header | Célula de cabeçalho (negrito e centralizada por padrão) |
| \`<td>\` | Table Data | Célula de dados |

## \`<th>\` vs. \`<td>\`

A tag \`<th>\` não é apenas visual — ela tem **significado semântico**. Leitores de tela associam as células de dados (\`<td>\`) aos seus cabeçalhos (\`<th>\`):

\`\`\`html
<table>
  <tr>
    <th>Produto</th>
    <th>Preço</th>
    <th>Estoque</th>
  </tr>
  <tr>
    <td>Camiseta</td>
    <td>R$ 49,90</td>
    <td>150</td>
  </tr>
  <tr>
    <td>Calça Jeans</td>
    <td>R$ 129,90</td>
    <td>80</td>
  </tr>
</table>
\`\`\`

## Atributo \`scope\` em \`<th>\`

Para melhorar a acessibilidade, use \`scope\` para indicar se o cabeçalho se aplica a uma coluna ou linha:

\`\`\`html
<table>
  <tr>
    <th scope="col">Mês</th>
    <th scope="col">Receita</th>
    <th scope="col">Despesa</th>
  </tr>
  <tr>
    <th scope="row">Janeiro</th>
    <td>R$ 5.000</td>
    <td>R$ 3.200</td>
  </tr>
  <tr>
    <th scope="row">Fevereiro</th>
    <td>R$ 6.500</td>
    <td>R$ 4.100</td>
  </tr>
</table>
\`\`\`

- \`scope="col"\` — o cabeçalho se aplica à **coluna** inteira
- \`scope="row"\` — o cabeçalho se aplica à **linha** inteira

## Quando Usar Tabelas

**Use tabelas para:**
- Dados financeiros (planilhas, relatórios)
- Comparações de produtos
- Horários e cronogramas
- Dados estatísticos

**NÃO use tabelas para:**
- Layout de página (use CSS Grid ou Flexbox)
- Posicionar elementos visuais
- Criar colunas de texto

Usar tabelas para layout era comum nos anos 2000, mas hoje é considerado uma **má prática** que prejudica acessibilidade, SEO e manutenção do código.`,
            },
          },
          {
            title: 'Estruturar tabelas com semântica',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Estruturar Tabelas com Semântica

Tabelas mais complexas precisam de elementos adicionais para organização e acessibilidade.

## Seções da Tabela

Uma tabela bem estruturada divide-se em três seções:

\`\`\`html
<table>
  <caption>Vendas por Trimestre — 2024</caption>
  <thead>
    <tr>
      <th scope="col">Trimestre</th>
      <th scope="col">Vendas</th>
      <th scope="col">Meta</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1º Trimestre</td>
      <td>R$ 150.000</td>
      <td>R$ 120.000</td>
    </tr>
    <tr>
      <td>2º Trimestre</td>
      <td>R$ 180.000</td>
      <td>R$ 150.000</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td>Total</td>
      <td>R$ 330.000</td>
      <td>R$ 270.000</td>
    </tr>
  </tfoot>
</table>
\`\`\`

| Elemento | Função |
|----------|--------|
| \`<caption>\` | Título/legenda da tabela (acessibilidade) |
| \`<thead>\` | Agrupa as linhas de cabeçalho |
| \`<tbody>\` | Agrupa as linhas de dados |
| \`<tfoot>\` | Agrupa as linhas de rodapé (totais, resumos) |

## O Elemento \`<caption>\`

O \`<caption>\` deve ser o **primeiro filho** de \`<table>\`. Ele funciona como um título que descreve o conteúdo da tabela:

\`\`\`html
<table>
  <caption>Quadro de medalhas — Olimpíadas 2024</caption>
  <!-- ... -->
</table>
\`\`\`

## Mesclando Células

### \`colspan\` — Mesclar colunas

\`\`\`html
<table>
  <tr>
    <th colspan="3">Horário de Aulas — Segunda-feira</th>
  </tr>
  <tr>
    <th>Horário</th>
    <th>Disciplina</th>
    <th>Professor</th>
  </tr>
  <tr>
    <td>08:00</td>
    <td>Matemática</td>
    <td>Prof. Silva</td>
  </tr>
</table>
\`\`\`

O \`colspan="3"\` faz a célula ocupar 3 colunas.

### \`rowspan\` — Mesclar linhas

\`\`\`html
<table>
  <tr>
    <th>Dia</th>
    <th>Horário</th>
    <th>Atividade</th>
  </tr>
  <tr>
    <td rowspan="2">Segunda</td>
    <td>08:00</td>
    <td>Reunião</td>
  </tr>
  <tr>
    <td>10:00</td>
    <td>Desenvolvimento</td>
  </tr>
</table>
\`\`\`

O \`rowspan="2"\` faz a célula "Segunda" ocupar 2 linhas. Note que a segunda \`<tr>\` tem apenas 2 \`<td>\`, pois a primeira coluna já está ocupada.

## Combinando \`colspan\` e \`rowspan\`

\`\`\`html
<table>
  <caption>Grade Curricular</caption>
  <thead>
    <tr>
      <th rowspan="2">Horário</th>
      <th colspan="2">Manhã</th>
      <th colspan="2">Tarde</th>
    </tr>
    <tr>
      <th>Segunda</th>
      <th>Terça</th>
      <th>Segunda</th>
      <th>Terça</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1º período</td>
      <td>HTML</td>
      <td>CSS</td>
      <td>JavaScript</td>
      <td>React</td>
    </tr>
  </tbody>
</table>
\`\`\`

Neste exemplo, "Horário" ocupa 2 linhas verticalmente, enquanto "Manhã" e "Tarde" ocupam 2 colunas cada.

## Boas Práticas

1. Sempre use \`<caption>\` para descrever o conteúdo da tabela
2. Sempre use \`<thead>\`, \`<tbody>\` e \`<tfoot>\` para estruturar
3. Use \`scope\` nos \`<th>\` para acessibilidade
4. Mantenha tabelas simples — tabelas muito complexas são difíceis de ler em dispositivos móveis`,
            },
          },
          {
            title: 'Exercício: Criar tabela de horários',
            contentType: 'exercise' as const,
            order: 3,
            content: {
              language: 'html' as const,
              problem: 'Crie uma tabela de horários de aulas semanal. A tabela deve ter: um <caption> descritivo, seções <thead> e <tbody>, cabeçalhos com scope, pelo menos uma célula com colspan (ex: "Intervalo" ocupando todas as colunas) e pelo menos uma com rowspan (ex: uma aula que dura dois períodos). Inclua pelo menos 5 dias e 4 horários.',
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Horário de Aulas</title>
</head>
<body>
  <h1>Meu Horário Escolar</h1>

  <table>
    <!-- Adicione caption -->
    <!-- Adicione thead com os dias da semana -->
    <!-- Adicione tbody com os horários e disciplinas -->
    <!-- Use colspan para o intervalo -->
    <!-- Use rowspan para uma aula de dois períodos -->
  </table>
</body>
</html>`,
              hints: [
                'O <caption> deve ser o primeiro elemento dentro de <table>.',
                'Ao usar rowspan="2" em uma célula, a próxima linha terá uma célula a menos naquela coluna.',
                'Para o intervalo, use <td colspan="6"> (ou o número total de colunas) para ocupar a linha toda.',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Horário de Aulas</title>
</head>
<body>
  <h1>Meu Horário Escolar</h1>

  <table>
    <caption>Horário de Aulas — 1º Semestre 2024</caption>
    <thead>
      <tr>
        <th scope="col">Horário</th>
        <th scope="col">Segunda</th>
        <th scope="col">Terça</th>
        <th scope="col">Quarta</th>
        <th scope="col">Quinta</th>
        <th scope="col">Sexta</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">08:00 - 08:50</th>
        <td>Matemática</td>
        <td>Português</td>
        <td rowspan="2">Laboratório de Ciências</td>
        <td>História</td>
        <td>Inglês</td>
      </tr>
      <tr>
        <th scope="row">08:50 - 09:40</th>
        <td>Matemática</td>
        <td>Geografia</td>
        <td>Educação Física</td>
        <td>Inglês</td>
      </tr>
      <tr>
        <th scope="row">09:40 - 10:00</th>
        <td colspan="5"><strong>Intervalo</strong></td>
      </tr>
      <tr>
        <th scope="row">10:00 - 10:50</th>
        <td>Português</td>
        <td>Matemática</td>
        <td>Artes</td>
        <td>Ciências</td>
        <td>Geografia</td>
      </tr>
      <tr>
        <th scope="row">10:50 - 11:40</th>
        <td>História</td>
        <td>Ciências</td>
        <td>Artes</td>
        <td>Português</td>
        <td>Educação Física</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`,
            },
          },
          {
            title: 'Quiz: Tabelas',
            contentType: 'quiz' as const,
            order: 4,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual elemento deve ser o primeiro filho de <table> para fornecer um título descritivo?',
                  options: ['<th>', '<title>', '<caption>', '<header>'],
                  correctAnswer: 2,
                  explanation: 'O <caption> é o elemento correto para dar um título à tabela. Deve ser o primeiro filho de <table> e é importante para acessibilidade.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'É uma boa prática usar tabelas HTML para criar o layout geral de uma página web.',
                  correctAnswer: false,
                  explanation: 'Usar tabelas para layout é uma prática obsoleta e prejudicial. Tabelas devem ser usadas apenas para dados tabulares. Para layout, use CSS Grid ou Flexbox.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'O atributo colspan="3" em uma célula <td> faz o quê?',
                  options: [
                    'Cria 3 células iguais',
                    'Faz a célula ocupar 3 colunas',
                    'Faz a célula ocupar 3 linhas',
                    'Define o espaçamento de 3 pixels',
                  ],
                  correctAnswer: 1,
                  explanation: 'O colspan="3" faz uma célula se estender por 3 colunas horizontalmente. Para ocupar múltiplas linhas, use rowspan.',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Qual é a ordem correta dos elementos semânticos dentro de <table>?',
                  options: [
                    '<thead>, <tfoot>, <tbody>',
                    '<tbody>, <thead>, <tfoot>',
                    '<caption>, <thead>, <tbody>, <tfoot>',
                    '<thead>, <tbody>, <caption>, <tfoot>',
                  ],
                  correctAnswer: 2,
                  explanation: 'A ordem correta é: <caption> (primeiro filho), <thead> (cabeçalho), <tbody> (corpo dos dados) e <tfoot> (rodapé). O <caption> sempre vem primeiro.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Formulários: Campos de Entrada',
        slug: 'formularios-campos-de-entrada',
        description: 'Criar formulários com diversos tipos de campos de entrada.',
        type: 'text' as const,
        isFree: false,
        order: 2,
        sections: [
          {
            title: 'Criar formulários com form',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Criar Formulários com \`<form>\`

Formulários permitem que usuários enviem dados para o servidor. São a base de cadastros, logins, pesquisas e qualquer interação com entrada de dados.

## Estrutura Básica

\`\`\`html
<form action="/cadastro" method="post">
  <label for="nome">Nome:</label>
  <input type="text" id="nome" name="nome">

  <label for="email">E-mail:</label>
  <input type="email" id="email" name="email">

  <label for="senha">Senha:</label>
  <input type="password" id="senha" name="senha">

  <button type="submit">Cadastrar</button>
</form>
\`\`\`

## Atributos do \`<form>\`

| Atributo | Descrição |
|----------|-----------|
| \`action\` | URL para onde os dados serão enviados |
| \`method\` | Método HTTP: \`get\` (dados na URL) ou \`post\` (dados no corpo) |
| \`enctype\` | Codificação dos dados (importante para upload de arquivos) |
| \`autocomplete\` | \`on\` ou \`off\` — habilita/desabilita autocompletar do navegador |

### Valores de \`enctype\`

\`\`\`html
<!-- Padrão: dados como pares chave=valor -->
<form enctype="application/x-www-form-urlencoded">

<!-- Para upload de arquivos -->
<form enctype="multipart/form-data">

<!-- Texto puro (raramente usado) -->
<form enctype="text/plain">
\`\`\`

## O Elemento \`<label>\`

O \`<label>\` associa um texto descritivo a um campo de formulário. Existem duas formas de fazer isso:

\`\`\`html
<!-- Forma 1: usando for e id (recomendada) -->
<label for="usuario">Usuário:</label>
<input type="text" id="usuario" name="usuario">

<!-- Forma 2: envolvendo o input -->
<label>
  Usuário:
  <input type="text" name="usuario">
</label>
\`\`\`

**Por que usar \`<label>\`?**
- Acessibilidade: leitores de tela leem o label ao focar no campo
- Usabilidade: clicar no label foca o campo associado
- É **obrigatório** para boas práticas

## Tipos Básicos de \`<input>\`

\`\`\`html
<!-- Texto simples -->
<input type="text" name="nome" placeholder="Seu nome">

<!-- E-mail (valida formato) -->
<input type="email" name="email" placeholder="seu@email.com">

<!-- Senha (oculta caracteres) -->
<input type="password" name="senha" placeholder="Sua senha">
\`\`\`

## O Atributo \`name\`

O atributo \`name\` é essencial — ele define a **chave** usada ao enviar os dados:

\`\`\`html
<input type="text" name="nome_completo" value="Maria">
<!-- Envia: nome_completo=Maria -->
\`\`\`

Sem o atributo \`name\`, o campo **não é enviado** com o formulário.

## Atributos Comuns de \`<input>\`

| Atributo | Descrição |
|----------|-----------|
| \`name\` | Nome do campo (chave no envio) |
| \`value\` | Valor inicial do campo |
| \`placeholder\` | Texto de dica (desaparece ao digitar) |
| \`required\` | Campo obrigatório |
| \`disabled\` | Campo desabilitado (não enviado) |
| \`readonly\` | Campo somente leitura (enviado) |
| \`autofocus\` | Foca automaticamente ao carregar |

## Exemplo Completo: Formulário de Login

\`\`\`html
<form action="/login" method="post">
  <label for="email">E-mail:</label>
  <input type="email" id="email" name="email" required autofocus placeholder="seu@email.com">

  <label for="senha">Senha:</label>
  <input type="password" id="senha" name="senha" required placeholder="Mínimo 8 caracteres">

  <button type="submit">Entrar</button>
</form>
\`\`\``,
            },
          },
          {
            title: 'Usar tipos de input HTML5',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Usar Tipos de Input HTML5

O HTML5 introduziu vários novos tipos de \`<input>\` que oferecem validação nativa e interfaces adaptadas para cada tipo de dado.

## Tipos Numéricos

\`\`\`html
<!-- Número com setas de incremento -->
<label for="qtd">Quantidade:</label>
<input type="number" id="qtd" name="quantidade" min="1" max="100" step="1" value="1">

<!-- Controle deslizante (slider) -->
<label for="volume">Volume:</label>
<input type="range" id="volume" name="volume" min="0" max="100" step="5" value="50">
\`\`\`

O tipo \`number\` exibe setas para aumentar/diminuir o valor. O tipo \`range\` exibe um controle deslizante.

## Tipos de Data e Hora

\`\`\`html
<!-- Data (calendário) -->
<label for="nascimento">Data de Nascimento:</label>
<input type="date" id="nascimento" name="nascimento" min="1900-01-01" max="2024-12-31">

<!-- Hora -->
<label for="horario">Horário:</label>
<input type="time" id="horario" name="horario">

<!-- Data e hora -->
<label for="agendamento">Agendamento:</label>
<input type="datetime-local" id="agendamento" name="agendamento">

<!-- Mês -->
<label for="mes">Mês:</label>
<input type="month" id="mes" name="mes">

<!-- Semana -->
<label for="semana">Semana:</label>
<input type="week" id="semana" name="semana">
\`\`\`

## Outros Tipos Úteis

\`\`\`html
<!-- Seletor de cor -->
<label for="cor">Cor favorita:</label>
<input type="color" id="cor" name="cor" value="#3498db">

<!-- URL -->
<label for="site">Seu site:</label>
<input type="url" id="site" name="site" placeholder="https://exemplo.com">

<!-- Telefone -->
<label for="tel">Telefone:</label>
<input type="tel" id="tel" name="telefone" placeholder="(11) 99999-9999">

<!-- Busca (com botão de limpar) -->
<label for="busca">Pesquisar:</label>
<input type="search" id="busca" name="busca" placeholder="Digite sua busca...">

<!-- Upload de arquivo -->
<label for="foto">Foto de perfil:</label>
<input type="file" id="foto" name="foto" accept="image/*">

<!-- Upload de múltiplos arquivos -->
<label for="docs">Documentos:</label>
<input type="file" id="docs" name="documentos" multiple accept=".pdf,.doc,.docx">

<!-- Campo oculto (não visível) -->
<input type="hidden" name="token" value="abc123">
\`\`\`

## Checkbox e Radio

\`\`\`html
<!-- Checkbox: múltiplas opções -->
<fieldset>
  <legend>Interesses:</legend>
  <label>
    <input type="checkbox" name="interesse" value="html"> HTML
  </label>
  <label>
    <input type="checkbox" name="interesse" value="css"> CSS
  </label>
  <label>
    <input type="checkbox" name="interesse" value="js" checked> JavaScript
  </label>
</fieldset>

<!-- Radio: uma opção -->
<fieldset>
  <legend>Nível:</legend>
  <label>
    <input type="radio" name="nivel" value="iniciante"> Iniciante
  </label>
  <label>
    <input type="radio" name="nivel" value="intermediario"> Intermediário
  </label>
  <label>
    <input type="radio" name="nivel" value="avancado"> Avançado
  </label>
</fieldset>
\`\`\`

**Regra importante:** Inputs \`radio\` com o mesmo \`name\` formam um grupo — apenas um pode ser selecionado.

## Atributo \`accept\` no Input File

O \`accept\` filtra os tipos de arquivo no seletor:

\`\`\`html
<!-- Apenas imagens -->
<input type="file" accept="image/*">

<!-- Apenas PDF -->
<input type="file" accept=".pdf">

<!-- Imagens e PDFs -->
<input type="file" accept="image/*,.pdf">
\`\`\`

## Tabela Resumo

| Tipo | Interface | Validação Nativa |
|------|-----------|-----------------|
| \`number\` | Setas +/- | Valor numérico, min/max |
| \`range\` | Slider | Valor numérico, min/max |
| \`date\` | Calendário | Data válida |
| \`color\` | Seletor de cor | Formato hexadecimal |
| \`url\` | Teclado com .com | Formato de URL |
| \`tel\` | Teclado numérico (mobile) | Nenhuma |
| \`email\` | Teclado com @ | Formato de e-mail |
| \`search\` | Botão limpar | Nenhuma |`,
            },
          },
          {
            title: 'Usar textarea, select e datalist',
            contentType: 'text' as const,
            order: 3,
            content: {
              body: `# Usar \`<textarea>\`, \`<select>\` e \`<datalist>\`

Além do \`<input>\`, o HTML oferece outros elementos para entrada de dados mais complexa.

## \`<textarea>\` — Texto Multilinha

O \`<textarea>\` permite que o usuário digite textos longos com múltiplas linhas:

\`\`\`html
<label for="mensagem">Mensagem:</label>
<textarea id="mensagem" name="mensagem" rows="5" cols="40" placeholder="Digite sua mensagem aqui..."></textarea>
\`\`\`

| Atributo | Descrição |
|----------|-----------|
| \`rows\` | Número de linhas visíveis |
| \`cols\` | Número de colunas visíveis |
| \`placeholder\` | Texto de dica |
| \`maxlength\` | Máximo de caracteres |
| \`minlength\` | Mínimo de caracteres |
| \`wrap\` | \`soft\` (padrão) ou \`hard\` |

**Importante:** O valor inicial do \`<textarea>\` vai **entre as tags**, não no atributo \`value\`:

\`\`\`html
<!-- Correto -->
<textarea name="bio">Texto inicial aqui</textarea>

<!-- Errado — textarea não usa value -->
<textarea name="bio" value="Texto inicial"></textarea>
\`\`\`

## \`<select>\` — Lista de Opções

O \`<select>\` cria um menu dropdown com opções predefinidas:

\`\`\`html
<label for="estado">Estado:</label>
<select id="estado" name="estado">
  <option value="">Selecione...</option>
  <option value="SP">São Paulo</option>
  <option value="RJ">Rio de Janeiro</option>
  <option value="MG">Minas Gerais</option>
  <option value="BA">Bahia</option>
</select>
\`\`\`

### Opção Pré-selecionada

\`\`\`html
<select name="idioma">
  <option value="pt" selected>Português</option>
  <option value="en">English</option>
  <option value="es">Español</option>
</select>
\`\`\`

### Seleção Múltipla

\`\`\`html
<label for="habilidades">Habilidades (segure Ctrl para selecionar várias):</label>
<select id="habilidades" name="habilidades" multiple size="5">
  <option value="html">HTML</option>
  <option value="css">CSS</option>
  <option value="js">JavaScript</option>
  <option value="react">React</option>
  <option value="node">Node.js</option>
</select>
\`\`\`

### Agrupando Opções com \`<optgroup>\`

\`\`\`html
<select name="carro">
  <optgroup label="Nacionais">
    <option value="gol">VW Gol</option>
    <option value="onix">Chevrolet Onix</option>
    <option value="hb20">Hyundai HB20</option>
  </optgroup>
  <optgroup label="Importados">
    <option value="corolla">Toyota Corolla</option>
    <option value="civic">Honda Civic</option>
  </optgroup>
</select>
\`\`\`

O \`<optgroup>\` cria cabeçalhos visuais dentro do dropdown que não podem ser selecionados.

## \`<datalist>\` — Sugestões de Autocompletar

O \`<datalist>\` fornece sugestões ao digitar, combinando a liberdade de um input de texto com opções predefinidas:

\`\`\`html
<label for="linguagem">Linguagem de Programação:</label>
<input type="text" id="linguagem" name="linguagem" list="linguagens">
<datalist id="linguagens">
  <option value="JavaScript">
  <option value="Python">
  <option value="Java">
  <option value="C#">
  <option value="PHP">
  <option value="TypeScript">
  <option value="Go">
  <option value="Rust">
</datalist>
\`\`\`

O \`id\` do \`<datalist>\` deve corresponder ao atributo \`list\` do \`<input>\`. O usuário pode escolher uma sugestão **ou digitar um valor diferente**.

## Diferença entre \`<select>\` e \`<datalist>\`

| Característica | \`<select>\` | \`<datalist>\` |
|---------------|------------|--------------|
| Valor livre | Não | Sim |
| Interface | Dropdown | Autocompletar |
| Obriga escolher opção | Sim | Não |
| Uso ideal | Lista fechada | Sugestões |`,
            },
          },
          {
            title: 'Exercício: Criar formulário de cadastro',
            contentType: 'exercise' as const,
            order: 4,
            content: {
              language: 'html' as const,
              problem: 'Crie um formulário de cadastro completo com os seguintes campos: nome completo (text), e-mail (email), senha (password), data de nascimento (date), gênero (radio buttons: Masculino, Feminino, Prefiro não informar), interesses (checkboxes: pelo menos 4 opções), estado (select com optgroup para regiões), e uma breve biografia (textarea). Todos os campos devem ter labels associados e o atributo name.',
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cadastro</title>
</head>
<body>
  <h1>Criar Conta</h1>

  <form action="/cadastro" method="post">
    <!-- Nome completo -->

    <!-- E-mail -->

    <!-- Senha -->

    <!-- Data de nascimento -->

    <!-- Gênero (radio) -->

    <!-- Interesses (checkbox) -->

    <!-- Estado (select com optgroup) -->

    <!-- Biografia (textarea) -->

    <button type="submit">Cadastrar</button>
  </form>
</body>
</html>`,
              hints: [
                'Lembre-se de usar o atributo for no <label> correspondendo ao id do input.',
                'Todos os radio buttons de gênero devem ter o mesmo name para formar um grupo.',
                'Use <optgroup label="Região"> para agrupar estados por região no <select>.',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cadastro</title>
</head>
<body>
  <h1>Criar Conta</h1>

  <form action="/cadastro" method="post">
    <label for="nome">Nome completo:</label>
    <input type="text" id="nome" name="nome" required>

    <label for="email">E-mail:</label>
    <input type="email" id="email" name="email" required>

    <label for="senha">Senha:</label>
    <input type="password" id="senha" name="senha" required>

    <label for="nascimento">Data de nascimento:</label>
    <input type="date" id="nascimento" name="nascimento" required>

    <fieldset>
      <legend>Gênero:</legend>
      <label>
        <input type="radio" name="genero" value="masculino"> Masculino
      </label>
      <label>
        <input type="radio" name="genero" value="feminino"> Feminino
      </label>
      <label>
        <input type="radio" name="genero" value="nao-informar"> Prefiro não informar
      </label>
    </fieldset>

    <fieldset>
      <legend>Interesses:</legend>
      <label>
        <input type="checkbox" name="interesse" value="tecnologia"> Tecnologia
      </label>
      <label>
        <input type="checkbox" name="interesse" value="esportes"> Esportes
      </label>
      <label>
        <input type="checkbox" name="interesse" value="musica"> Música
      </label>
      <label>
        <input type="checkbox" name="interesse" value="viagens"> Viagens
      </label>
    </fieldset>

    <label for="estado">Estado:</label>
    <select id="estado" name="estado">
      <option value="">Selecione...</option>
      <optgroup label="Sudeste">
        <option value="SP">São Paulo</option>
        <option value="RJ">Rio de Janeiro</option>
        <option value="MG">Minas Gerais</option>
        <option value="ES">Espírito Santo</option>
      </optgroup>
      <optgroup label="Sul">
        <option value="PR">Paraná</option>
        <option value="SC">Santa Catarina</option>
        <option value="RS">Rio Grande do Sul</option>
      </optgroup>
      <optgroup label="Nordeste">
        <option value="BA">Bahia</option>
        <option value="PE">Pernambuco</option>
        <option value="CE">Ceará</option>
      </optgroup>
    </select>

    <label for="bio">Biografia:</label>
    <textarea id="bio" name="biografia" rows="4" cols="50" placeholder="Conte um pouco sobre você..."></textarea>

    <button type="submit">Cadastrar</button>
  </form>
</body>
</html>`,
            },
          },
          {
            title: 'Quiz: Campos de formulário',
            contentType: 'quiz' as const,
            order: 5,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual atributo de <form> deve ser definido como "multipart/form-data" para permitir upload de arquivos?',
                  options: ['method', 'action', 'enctype', 'type'],
                  correctAnswer: 2,
                  explanation: 'O atributo enctype="multipart/form-data" é necessário para enviar arquivos via formulário. Sem ele, apenas o nome do arquivo é enviado.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'Inputs do tipo radio com o mesmo atributo name permitem selecionar apenas uma opção do grupo.',
                  correctAnswer: true,
                  explanation: 'Correto! Radio buttons com o mesmo name formam um grupo exclusivo — ao selecionar um, os demais são automaticamente desmarcados.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Qual é a diferença entre <select> e <datalist>?',
                  options: [
                    'Não há diferença, são sinônimos',
                    '<select> permite valor livre, <datalist> não',
                    '<datalist> permite valor livre, <select> não',
                    '<datalist> é usado apenas com <textarea>',
                  ],
                  correctAnswer: 2,
                  explanation: 'O <datalist> oferece sugestões, mas o usuário pode digitar qualquer valor. O <select> obriga o usuário a escolher uma das opções disponíveis.',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Onde deve ser colocado o valor inicial de um <textarea>?',
                  options: [
                    'No atributo value',
                    'No atributo placeholder',
                    'Entre as tags de abertura e fechamento',
                    'No atributo content',
                  ],
                  correctAnswer: 2,
                  explanation: 'Diferente do <input>, o <textarea> não usa o atributo value. O texto inicial é colocado entre <textarea> e </textarea>.',
                },
                {
                  id: 'q5',
                  type: 'true_false',
                  question: 'Um campo <input> sem o atributo name não será incluído nos dados enviados pelo formulário.',
                  correctAnswer: true,
                  explanation: 'Correto! O atributo name define a chave com que o valor será enviado. Sem ele, o navegador simplesmente ignora o campo no envio.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Formulários: Validação e Agrupamento',
        slug: 'formularios-validacao-e-agrupamento',
        description: 'Validar campos e organizar formulários com agrupamento semântico.',
        type: 'text' as const,
        isFree: false,
        order: 3,
        sections: [
          {
            title: 'Validar campos com atributos HTML',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Validar Campos com Atributos HTML

O HTML5 oferece validação nativa de formulários através de atributos, sem necessidade de JavaScript.

## Atributo \`required\`

Torna o campo obrigatório. O formulário não é enviado se o campo estiver vazio:

\`\`\`html
<label for="nome">Nome:</label>
<input type="text" id="nome" name="nome" required>
\`\`\`

O navegador exibirá uma mensagem de erro automática ao tentar enviar com o campo vazio.

## Atributos de Comprimento

\`\`\`html
<!-- Mínimo e máximo de caracteres -->
<label for="usuario">Usuário (3-20 caracteres):</label>
<input type="text" id="usuario" name="usuario" minlength="3" maxlength="20" required>

<!-- O maxlength impede fisicamente de digitar mais -->
<!-- O minlength só valida no envio -->
\`\`\`

| Atributo | Descrição |
|----------|-----------|
| \`minlength\` | Mínimo de caracteres (valida no envio) |
| \`maxlength\` | Máximo de caracteres (impede digitação) |

## Atributos Numéricos: \`min\`, \`max\` e \`step\`

\`\`\`html
<!-- Idade entre 18 e 120 -->
<label for="idade">Idade:</label>
<input type="number" id="idade" name="idade" min="18" max="120" required>

<!-- Preço com incremento de 0.01 -->
<label for="preco">Preço:</label>
<input type="number" id="preco" name="preco" min="0" step="0.01">

<!-- Data mínima e máxima -->
<label for="data">Data do evento:</label>
<input type="date" id="data" name="data" min="2024-01-01" max="2024-12-31">
\`\`\`

## Atributo \`pattern\` (Expressão Regular)

O \`pattern\` valida o valor contra uma expressão regular:

\`\`\`html
<!-- CPF: 000.000.000-00 -->
<label for="cpf">CPF:</label>
<input type="text" id="cpf" name="cpf"
  pattern="\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}"
  title="Formato: 000.000.000-00"
  placeholder="000.000.000-00"
  required>

<!-- Telefone: (00) 00000-0000 -->
<label for="tel">Telefone:</label>
<input type="tel" id="tel" name="telefone"
  pattern="\\(\\d{2}\\) \\d{5}-\\d{4}"
  title="Formato: (00) 00000-0000"
  placeholder="(11) 99999-9999">

<!-- Apenas letras e espaços -->
<label for="nome">Nome:</label>
<input type="text" id="nome" name="nome"
  pattern="[A-Za-zÀ-ú\\s]+"
  title="Apenas letras e espaços">
\`\`\`

**Dica:** O atributo \`title\` é exibido como parte da mensagem de erro quando a validação falha.

## Atributo \`placeholder\`

O \`placeholder\` exibe um texto de dica dentro do campo quando ele está vazio:

\`\`\`html
<input type="email" placeholder="seu@email.com" name="email">
\`\`\`

**Importante:** O \`placeholder\` **NÃO substitui** o \`<label>\`. Ele desaparece ao digitar e não é lido por todos os leitores de tela. Sempre use \`<label>\` junto.

## Pseudo-classes CSS de Validação

O navegador aplica pseudo-classes CSS aos campos conforme o estado de validação:

\`\`\`html
<style>
  /* Campo válido */
  input:valid {
    border-color: green;
  }

  /* Campo inválido */
  input:invalid {
    border-color: red;
  }

  /* Campo obrigatório */
  input:required {
    border-left: 3px solid blue;
  }
</style>
\`\`\`

## Desativando Validação

Para desativar a validação nativa do formulário inteiro:

\`\`\`html
<form novalidate>
  <!-- Campos não serão validados pelo navegador -->
</form>
\`\`\`

Ou para um botão específico:

\`\`\`html
<button type="submit" formnovalidate>Salvar rascunho</button>
\`\`\``,
            },
          },
          {
            title: 'Agrupar campos com fieldset e legend',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Agrupar Campos com \`<fieldset>\` e \`<legend>\`

Os elementos \`<fieldset>\` e \`<legend>\` organizam formulários em grupos lógicos, melhorando a usabilidade e acessibilidade.

## Sintaxe

\`\`\`html
<fieldset>
  <legend>Dados Pessoais</legend>

  <label for="nome">Nome:</label>
  <input type="text" id="nome" name="nome" required>

  <label for="email">E-mail:</label>
  <input type="email" id="email" name="email" required>
</fieldset>
\`\`\`

O \`<fieldset>\` desenha uma borda ao redor do grupo e o \`<legend>\` aparece sobre essa borda como título.

## Por que Usar?

1. **Organização visual**: Separa o formulário em seções claras
2. **Acessibilidade**: Leitores de tela anunciam o \`<legend>\` ao entrar no grupo
3. **Semântica**: Indica que os campos estão relacionados

## Exemplo: Formulário de Pedido

\`\`\`html
<form action="/pedido" method="post">
  <fieldset>
    <legend>Informações Pessoais</legend>
    <label for="nome">Nome completo:</label>
    <input type="text" id="nome" name="nome" required>

    <label for="email">E-mail:</label>
    <input type="email" id="email" name="email" required>

    <label for="tel">Telefone:</label>
    <input type="tel" id="tel" name="telefone">
  </fieldset>

  <fieldset>
    <legend>Endereço de Entrega</legend>
    <label for="rua">Rua:</label>
    <input type="text" id="rua" name="rua" required>

    <label for="cidade">Cidade:</label>
    <input type="text" id="cidade" name="cidade" required>

    <label for="cep">CEP:</label>
    <input type="text" id="cep" name="cep" pattern="\\d{5}-\\d{3}" required>
  </fieldset>

  <fieldset>
    <legend>Pagamento</legend>
    <label>
      <input type="radio" name="pagamento" value="cartao" required> Cartão de Crédito
    </label>
    <label>
      <input type="radio" name="pagamento" value="boleto"> Boleto
    </label>
    <label>
      <input type="radio" name="pagamento" value="pix"> PIX
    </label>
  </fieldset>

  <button type="submit">Finalizar Pedido</button>
</form>
\`\`\`

## Desabilitando um Grupo Inteiro

O atributo \`disabled\` no \`<fieldset>\` desabilita **todos** os campos dentro dele:

\`\`\`html
<fieldset disabled>
  <legend>Endereço (mesmo do cadastro)</legend>
  <label for="rua2">Rua:</label>
  <input type="text" id="rua2" name="rua" value="Rua das Flores, 123">

  <label for="cidade2">Cidade:</label>
  <input type="text" id="cidade2" name="cidade" value="São Paulo">
</fieldset>
\`\`\`

## O Elemento \`<output>\`

O \`<output>\` exibe o resultado de um cálculo ou ação do usuário:

\`\`\`html
<form oninput="resultado.value = parseInt(a.value) + parseInt(b.value)">
  <label for="a">Valor A:</label>
  <input type="number" id="a" name="a" value="0">

  <label for="b">Valor B:</label>
  <input type="number" id="b" name="b" value="0">

  <p>Soma: <output name="resultado" for="a b">0</output></p>
</form>
\`\`\`

O atributo \`for\` do \`<output>\` lista os IDs dos campos que contribuem para o resultado (separados por espaço).

## Fieldsets Aninhados

Você pode aninhar fieldsets para criar hierarquias:

\`\`\`html
<fieldset>
  <legend>Configurações de Conta</legend>

  <fieldset>
    <legend>Notificações por E-mail</legend>
    <label>
      <input type="checkbox" name="notif" value="novidades"> Novidades
    </label>
    <label>
      <input type="checkbox" name="notif" value="promocoes"> Promoções
    </label>
  </fieldset>

  <fieldset>
    <legend>Privacidade</legend>
    <label>
      <input type="checkbox" name="perfil_publico"> Perfil público
    </label>
  </fieldset>
</fieldset>
\`\`\``,
            },
          },
          {
            title: 'Usar botões corretamente',
            contentType: 'text' as const,
            order: 3,
            content: {
              body: `# Usar Botões Corretamente

Existem diferentes formas de criar botões em formulários HTML. Entender cada uma é essencial para evitar comportamentos inesperados.

## O Elemento \`<button>\`

A tag \`<button>\` é a forma mais flexível de criar botões:

\`\`\`html
<!-- Envia o formulário (padrão) -->
<button type="submit">Enviar Formulário</button>

<!-- Reseta todos os campos -->
<button type="reset">Limpar Campos</button>

<!-- Não faz nada (para JavaScript) -->
<button type="button">Clique Aqui</button>
\`\`\`

### Tipos de \`<button>\`

| Tipo | Comportamento |
|------|---------------|
| \`submit\` | Envia o formulário (padrão se não especificado) |
| \`reset\` | Restaura todos os campos ao valor inicial |
| \`button\` | Nenhuma ação — usado com JavaScript |

**Atenção:** Se você não especificar o \`type\`, o botão será \`submit\` por padrão. Isso pode causar envios acidentais do formulário!

\`\`\`html
<!-- CUIDADO: este botão envia o formulário! -->
<button>Calcular</button>

<!-- Correto: botão sem ação de envio -->
<button type="button">Calcular</button>
\`\`\`

## \`<button>\` vs. \`<input type="submit">\`

\`\`\`html
<!-- Input submit: texto apenas -->
<input type="submit" value="Enviar">

<!-- Button submit: conteúdo HTML rico -->
<button type="submit">
  <strong>Enviar</strong> formulário
</button>
\`\`\`

O \`<button>\` é preferível porque:
- Aceita conteúdo HTML (imagens, ícones, texto formatado)
- É mais fácil de estilizar com CSS
- Separa o conteúdo visual do valor enviado

## \`<input>\` como Botão

\`\`\`html
<!-- Envia o formulário -->
<input type="submit" value="Cadastrar">

<!-- Reseta o formulário -->
<input type="reset" value="Limpar">

<!-- Botão genérico (sem ação) -->
<input type="button" value="Calcular">

<!-- Botão com imagem -->
<input type="image" src="botao-enviar.png" alt="Enviar" width="100" height="40">
\`\`\`

## Atributos Úteis de Botão

\`\`\`html
<!-- Desabilitar botão -->
<button type="submit" disabled>Enviando...</button>

<!-- Enviar para URL diferente da action do form -->
<button type="submit" formaction="/rascunho">Salvar Rascunho</button>

<!-- Enviar com método diferente -->
<button type="submit" formmethod="get">Buscar</button>

<!-- Pular validação -->
<button type="submit" formnovalidate>Salvar sem validar</button>
\`\`\`

## Exemplo Prático: Formulário com Múltiplos Botões

\`\`\`html
<form action="/publicar" method="post">
  <label for="titulo">Título:</label>
  <input type="text" id="titulo" name="titulo" required>

  <label for="conteudo">Conteúdo:</label>
  <textarea id="conteudo" name="conteudo" rows="10" required></textarea>

  <!-- Botão principal: publica (valida) -->
  <button type="submit">Publicar</button>

  <!-- Botão secundário: salva rascunho (sem validar) -->
  <button type="submit" formaction="/rascunho" formnovalidate>
    Salvar Rascunho
  </button>

  <!-- Botão de limpar -->
  <button type="reset">Limpar Tudo</button>
</form>
\`\`\`

Neste exemplo, "Publicar" envia para \`/publicar\` com validação, enquanto "Salvar Rascunho" envia para \`/rascunho\` sem validação.

## Boas Práticas

1. Sempre especifique \`type\` no \`<button>\` para evitar envios acidentais
2. Prefira \`<button>\` em vez de \`<input type="submit">\` pela flexibilidade
3. Use textos descritivos nos botões ("Criar Conta" em vez de "Enviar")
4. Desabilite o botão após o clique para evitar duplo envio
5. Ofereça feedback visual (mudança de texto, loading)`,
            },
          },
          {
            title: 'Exercício: Formulário com validação',
            contentType: 'exercise' as const,
            order: 4,
            content: {
              language: 'html' as const,
              problem: 'Crie um formulário de contato completo com validação nativa HTML. O formulário deve ter: fieldset "Dados Pessoais" com nome (obrigatório, mínimo 3 caracteres), e-mail (obrigatório), telefone (com pattern para formato brasileiro); fieldset "Sua Mensagem" com assunto (select com opções) e mensagem (textarea, obrigatório, mínimo 20 caracteres). Inclua um botão de enviar e um de limpar.',
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Formulário de Contato</title>
</head>
<body>
  <h1>Fale Conosco</h1>

  <form action="/contato" method="post">
    <!-- Fieldset: Dados Pessoais -->
    <!-- Nome (required, minlength) -->
    <!-- E-mail (required) -->
    <!-- Telefone (pattern para formato brasileiro) -->

    <!-- Fieldset: Sua Mensagem -->
    <!-- Assunto (select) -->
    <!-- Mensagem (textarea, required, minlength) -->

    <!-- Botões: enviar e limpar -->
  </form>
</body>
</html>`,
              hints: [
                'Use pattern="\\(\\d{2}\\) \\d{4,5}-\\d{4}" para validar telefone brasileiro.',
                'O atributo title exibe uma dica quando a validação do pattern falha.',
                'Use minlength="20" no textarea para exigir mensagens com pelo menos 20 caracteres.',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Formulário de Contato</title>
</head>
<body>
  <h1>Fale Conosco</h1>

  <form action="/contato" method="post">
    <fieldset>
      <legend>Dados Pessoais</legend>

      <label for="nome">Nome completo:</label>
      <input type="text" id="nome" name="nome" required minlength="3" placeholder="Seu nome completo">

      <label for="email">E-mail:</label>
      <input type="email" id="email" name="email" required placeholder="seu@email.com">

      <label for="telefone">Telefone:</label>
      <input type="tel" id="telefone" name="telefone"
        pattern="\\(\\d{2}\\) \\d{4,5}-\\d{4}"
        title="Formato: (00) 00000-0000 ou (00) 0000-0000"
        placeholder="(11) 99999-9999">
    </fieldset>

    <fieldset>
      <legend>Sua Mensagem</legend>

      <label for="assunto">Assunto:</label>
      <select id="assunto" name="assunto" required>
        <option value="">Selecione um assunto...</option>
        <option value="duvida">Dúvida</option>
        <option value="sugestao">Sugestão</option>
        <option value="reclamacao">Reclamação</option>
        <option value="elogio">Elogio</option>
        <option value="outro">Outro</option>
      </select>

      <label for="mensagem">Mensagem:</label>
      <textarea id="mensagem" name="mensagem" rows="6" cols="50" required minlength="20" placeholder="Escreva sua mensagem (mínimo 20 caracteres)..."></textarea>
    </fieldset>

    <button type="submit">Enviar Mensagem</button>
    <button type="reset">Limpar Formulário</button>
  </form>
</body>
</html>`,
            },
          },
          {
            title: 'Quiz: Validação e formulários',
            contentType: 'quiz' as const,
            order: 5,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual atributo HTML torna um campo de formulário obrigatório?',
                  options: ['mandatory', 'required', 'validate', 'necessary'],
                  correctAnswer: 1,
                  explanation: 'O atributo required impede o envio do formulário se o campo estiver vazio, exibindo uma mensagem de erro nativa do navegador.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'O atributo maxlength impede fisicamente o usuário de digitar mais caracteres do que o permitido.',
                  correctAnswer: true,
                  explanation: 'Correto! O maxlength impede a digitação além do limite. Já o minlength apenas valida no momento do envio, sem impedir a digitação.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Qual é o tipo padrão de um <button> dentro de um formulário se o atributo type não for especificado?',
                  options: ['button', 'submit', 'reset', 'action'],
                  correctAnswer: 1,
                  explanation: 'O tipo padrão de <button> é "submit". Isso significa que clicar em um botão sem type definido enviará o formulário, o que pode causar comportamentos inesperados.',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Qual elemento HTML é usado para criar um título visível para um grupo de campos (<fieldset>)?',
                  options: ['<title>', '<caption>', '<label>', '<legend>'],
                  correctAnswer: 3,
                  explanation: 'O <legend> é o elemento correto para dar título a um <fieldset>. Deve ser o primeiro filho do <fieldset> e aparece sobre a borda do grupo.',
                },
                {
                  id: 'q5',
                  type: 'true_false',
                  question: 'O atributo pattern aceita expressões regulares para validar o formato do valor de um campo.',
                  correctAnswer: true,
                  explanation: 'Correto! O pattern usa expressões regulares (regex) para validar o valor. É útil para formatos específicos como CPF, telefone ou códigos postais.',
                },
              ],
            },
          },
        ],
      },
    ],
  },,
{
    title: 'HTML Semântico e Acessibilidade',
    description: 'Estruturar páginas com semântica e boas práticas de acessibilidade.',
    order: 5,
    lessons: [
      {
        title: 'Tags semânticas de layout',
        slug: 'tags-semanticas-de-layout',
        description: 'Aprender a usar as tags semânticas do HTML5 para estruturar páginas de forma significativa.',
        type: 'text' as const,
        isFree: false,
        order: 1,
        sections: [
          {
            title: 'Usar header, nav e footer',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Header, Nav e Footer

## O que são tags semânticas?

Tags semânticas são elementos HTML que **descrevem o significado** do conteúdo que envolvem, não apenas sua aparência. Antes do HTML5, usávamos \`<div>\` para tudo. Agora temos elementos específicos que comunicam a função de cada bloco.

## O elemento \`<header>\`

O \`<header>\` representa o **cabeçalho** de uma seção ou da página inteira. Geralmente contém o logotipo, título do site e navegação principal.

\`\`\`html
<header>
  <h1>Meu Blog</h1>
  <p>Artigos sobre tecnologia e programação</p>
</header>
\`\`\`

**Regras importantes:**
- Uma página pode ter **vários** \`<header>\` (um para a página, outros dentro de \`<article>\`, \`<section>\`, etc.)
- Não pode ser aninhado dentro de outro \`<header>\`, \`<footer>\` ou \`<address>\`
- Não é obrigatório, mas é uma boa prática usá-lo

## O elemento \`<nav>\`

O \`<nav>\` identifica um bloco de **navegação principal**. Use-o para menus de navegação, não para qualquer grupo de links.

\`\`\`html
<nav>
  <ul>
    <li><a href="/">Início</a></li>
    <li><a href="/sobre">Sobre</a></li>
    <li><a href="/contato">Contato</a></li>
  </ul>
</nav>
\`\`\`

**Quando usar \`<nav>\`:**
- Menu principal do site
- Navegação de seção (sumário de artigo)
- Breadcrumbs (trilha de navegação)

**Quando NÃO usar:**
- Links no rodapé (a menos que seja uma navegação completa)
- Links soltos dentro de um parágrafo

## O elemento \`<footer>\`

O \`<footer>\` representa o **rodapé** de uma seção ou página. Contém informações como autor, copyright, links relacionados.

\`\`\`html
<footer>
  <p>&copy; 2025 Meu Blog. Todos os direitos reservados.</p>
  <nav>
    <a href="/privacidade">Política de Privacidade</a>
    <a href="/termos">Termos de Uso</a>
  </nav>
</footer>
\`\`\`

## Exemplo completo: header + nav + footer

\`\`\`html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Exemplo Semântico</title>
</head>
<body>
  <header>
    <h1>TechBlog</h1>
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/artigos">Artigos</a></li>
        <li><a href="/sobre">Sobre</a></li>
      </ul>
    </nav>
  </header>

  <!-- conteúdo principal virá aqui -->

  <footer>
    <p>&copy; 2025 TechBlog</p>
  </footer>
</body>
</html>
\`\`\`

## Benefícios para leitores de tela

Os leitores de tela usam essas tags para criar um **mapa da página**. Um usuário pode pular diretamente para o \`<nav>\` ou \`<footer>\` sem precisar ouvir todo o conteúdo. Isso melhora enormemente a experiência de pessoas com deficiência visual.`,
            },
          },
          {
            title: 'Usar main, section e article',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Main, Section e Article

## O elemento \`<main>\`

O \`<main>\` representa o **conteúdo principal** da página — aquele conteúdo que é único e não se repete em outras páginas (diferente do header, nav e footer que costumam ser iguais em todas).

\`\`\`html
<body>
  <header>...</header>
  <main>
    <h2>Últimos Artigos</h2>
    <!-- conteúdo único desta página -->
  </main>
  <footer>...</footer>
</body>
\`\`\`

**Regras do \`<main>\`:**
- Deve haver **apenas um** \`<main>\` visível por página
- Não pode estar dentro de \`<article>\`, \`<aside>\`, \`<footer>\`, \`<header>\` ou \`<nav>\`
- Ajuda leitores de tela a pular direto para o conteúdo relevante

## O elemento \`<section>\`

O \`<section>\` agrupa conteúdo **tematicamente relacionado**, geralmente com um título (\`<h2>\`, \`<h3>\`, etc.).

\`\`\`html
<main>
  <section>
    <h2>Artigos Recentes</h2>
    <p>Confira os últimos artigos publicados.</p>
    <!-- lista de artigos -->
  </section>

  <section>
    <h2>Categorias</h2>
    <p>Navegue por categoria de conteúdo.</p>
    <!-- lista de categorias -->
  </section>
</main>
\`\`\`

**Quando usar \`<section>\`:**
- Capítulos de um documento
- Abas de conteúdo
- Seções temáticas de uma página (Sobre, Serviços, Contato)

## O elemento \`<article>\`

O \`<article>\` representa um conteúdo **independente e autocontido** — algo que faria sentido sozinho, fora do contexto da página.

\`\`\`html
<article>
  <header>
    <h2>Como aprender HTML em 2025</h2>
    <time datetime="2025-03-15">15 de março de 2025</time>
  </header>
  <p>Aprender HTML continua sendo o primeiro passo...</p>
  <footer>
    <p>Escrito por Maria Silva</p>
  </footer>
</article>
\`\`\`

**Exemplos de \`<article>\`:**
- Post de blog
- Comentário de usuário
- Notícia
- Card de produto
- Widget independente

## Diferença entre \`<section>\` e \`<article>\`

| Critério | \`<section>\` | \`<article>\` |
|----------|-------------|-------------|
| Independente? | Não, faz parte de algo maior | Sim, faz sentido sozinho |
| Pode ser redistribuído? | Geralmente não | Sim (RSS, embed) |
| Exemplo | Seção "Sobre" de uma página | Post de blog completo |

## Aninhamento: article dentro de section e vice-versa

Ambos podem ser aninhados livremente:

\`\`\`html
<!-- Section contendo articles -->
<section>
  <h2>Blog</h2>
  <article>
    <h3>Primeiro post</h3>
    <p>Conteúdo...</p>
  </article>
  <article>
    <h3>Segundo post</h3>
    <p>Conteúdo...</p>
  </article>
</section>

<!-- Article contendo sections -->
<article>
  <h2>Guia Completo de HTML</h2>
  <section>
    <h3>Introdução</h3>
    <p>Nesta seção...</p>
  </section>
  <section>
    <h3>Conceitos básicos</h3>
    <p>Nesta seção...</p>
  </section>
</article>
\`\`\`

## Quando usar \`<div>\` ao invés de semântica?

Use \`<div>\` **apenas para agrupamento visual/estilístico**, quando nenhum elemento semântico se aplica:

\`\`\`html
<!-- Correto: div para wrapper de layout -->
<div class="container">
  <section>...</section>
</div>

<!-- Errado: div onde section seria melhor -->
<div class="about-section">
  <h2>Sobre nós</h2>
  <p>...</p>
</div>
\`\`\``,
            },
          },
          {
            title: 'Usar aside e details',
            contentType: 'text' as const,
            order: 3,
            content: {
              body: `# Aside e Details

## O elemento \`<aside>\`

O \`<aside>\` representa conteúdo **tangencialmente relacionado** ao conteúdo principal. É algo complementar que, se removido, não prejudica a compreensão do conteúdo principal.

### Uso como barra lateral

\`\`\`html
<main>
  <article>
    <h2>Artigo principal</h2>
    <p>Conteúdo do artigo...</p>
  </article>

  <aside>
    <h3>Artigos Relacionados</h3>
    <ul>
      <li><a href="/artigo-2">Outro artigo</a></li>
      <li><a href="/artigo-3">Mais um artigo</a></li>
    </ul>
  </aside>
</main>
\`\`\`

### Uso dentro de um article (nota lateral)

\`\`\`html
<article>
  <h2>História da Internet</h2>
  <p>A internet começou como um projeto militar chamado ARPANET...</p>

  <aside>
    <p><strong>Você sabia?</strong> O primeiro e-mail foi enviado em 1971 por Ray Tomlinson.</p>
  </aside>

  <p>Com o tempo, a rede se expandiu para universidades...</p>
</article>
\`\`\`

### Exemplos comuns de \`<aside>\`

- Barra lateral de um blog
- Biografia do autor ao lado do artigo
- Publicidade relacionada
- Glossário ou definições complementares
- Widgets (clima, redes sociais)

## O elemento \`<details>\` e \`<summary>\`

O \`<details>\` cria um **widget de divulgação** (disclosure) que pode ser aberto e fechado pelo usuário — **sem JavaScript**!

\`\`\`html
<details>
  <summary>Clique para ver mais informações</summary>
  <p>Este conteúdo fica oculto até o usuário clicar no resumo acima.</p>
  <p>Pode conter qualquer HTML: textos, listas, imagens, etc.</p>
</details>
\`\`\`

### O elemento \`<summary>\`

O \`<summary>\` é o **título clicável** dentro de \`<details>\`. Se omitido, o navegador mostra "Detalhes" por padrão.

\`\`\`html
<details>
  <summary>Perguntas Frequentes</summary>
  <dl>
    <dt>O curso é gratuito?</dt>
    <dd>Sim, todas as aulas são gratuitas.</dd>
    <dt>Preciso instalar algo?</dt>
    <dd>Apenas um navegador web e um editor de texto.</dd>
  </dl>
</details>
\`\`\`

### Atributo \`open\`

Use o atributo \`open\` para que o \`<details>\` comece expandido:

\`\`\`html
<details open>
  <summary>Informações importantes</summary>
  <p>Este conteúdo já aparece visível ao carregar a página.</p>
</details>
\`\`\`

### Criando um FAQ completo

\`\`\`html
<section>
  <h2>Perguntas Frequentes</h2>

  <details>
    <summary>Como faço para me inscrever?</summary>
    <p>Clique no botão "Inscreva-se" no topo da página e preencha o formulário.</p>
  </details>

  <details>
    <summary>Qual a duração do curso?</summary>
    <p>O curso tem aproximadamente 40 horas de conteúdo, divididas em 6 módulos.</p>
  </details>

  <details>
    <summary>Recebo certificado?</summary>
    <p>Sim! Ao completar todos os módulos e exercícios, você recebe um certificado digital.</p>
  </details>
</section>
\`\`\`

## Combinando aside e details

\`\`\`html
<aside>
  <h3>Dicas Extras</h3>
  <details>
    <summary>Atalhos do VS Code</summary>
    <ul>
      <li><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> — Paleta de comandos</li>
      <li><kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> — Formatar documento</li>
    </ul>
  </details>
  <details>
    <summary>Extensões recomendadas</summary>
    <ul>
      <li>Live Server</li>
      <li>HTML CSS Support</li>
      <li>Prettier</li>
    </ul>
  </details>
</aside>
\`\`\`

Esses elementos enriquecem a experiência do usuário e melhoram a acessibilidade da página ao descrever claramente o papel de cada bloco de conteúdo.`,
            },
          },
          {
            title: 'Exercício: Estruturar blog semântico',
            contentType: 'exercise' as const,
            order: 4,
            content: {
              language: 'html' as const,
              problem: 'Crie a estrutura completa de uma página de blog usando **todas as tags semânticas** que aprendemos. A página deve conter: cabeçalho com logo e menu de navegação, conteúdo principal com dois artigos (cada um com título, data, texto e rodapé de autor), uma barra lateral com artigos relacionados e um FAQ usando `<details>`, e um rodapé com copyright e links.',
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meu Blog</title>
</head>
<body>
  <!-- TODO: Adicione o header com h1 e nav -->

  <!-- TODO: Adicione o main com dois articles -->

  <!-- TODO: Adicione um aside com links e um FAQ usando details/summary -->

  <!-- TODO: Adicione o footer -->

</body>
</html>`,
              hints: [
                'Use <header> para o cabeçalho do site e também dentro de cada <article> para título e data.',
                'O <main> deve conter os <article> e pode conter <section> para agrupar os artigos.',
                'Use <aside> fora do <main> ou dentro dele, dependendo da relação com o conteúdo.',
                'Cada <article> pode ter seu próprio <header> e <footer>.',
                'Use <time datetime="..."> para datas.',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meu Blog</title>
</head>
<body>
  <header>
    <h1>DevBlog</h1>
    <p>Artigos sobre desenvolvimento web</p>
    <nav>
      <ul>
        <li><a href="/">Início</a></li>
        <li><a href="/artigos">Artigos</a></li>
        <li><a href="/sobre">Sobre</a></li>
        <li><a href="/contato">Contato</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <section>
      <h2>Últimos Artigos</h2>

      <article>
        <header>
          <h3>Introdução ao HTML Semântico</h3>
          <time datetime="2025-03-10">10 de março de 2025</time>
        </header>
        <p>O HTML semântico é fundamental para criar páginas web acessíveis e bem estruturadas. Neste artigo, exploramos as principais tags e quando utilizá-las.</p>
        <p>Ao usar tags como header, nav, main e footer, comunicamos ao navegador e aos leitores de tela o significado de cada parte da página.</p>
        <footer>
          <p>Escrito por <strong>Ana Costa</strong></p>
        </footer>
      </article>

      <article>
        <header>
          <h3>Acessibilidade na Web: Primeiros Passos</h3>
          <time datetime="2025-03-08">8 de março de 2025</time>
        </header>
        <p>Acessibilidade web garante que todas as pessoas possam usar a internet, independentemente de suas capacidades. Veja como começar a implementar boas práticas.</p>
        <p>Desde usar textos alternativos em imagens até garantir navegação por teclado, pequenos ajustes fazem grande diferença.</p>
        <footer>
          <p>Escrito por <strong>Carlos Lima</strong></p>
        </footer>
      </article>
    </section>
  </main>

  <aside>
    <section>
      <h3>Artigos Relacionados</h3>
      <ul>
        <li><a href="/css-basico">CSS Básico para Iniciantes</a></li>
        <li><a href="/javascript-intro">Introdução ao JavaScript</a></li>
        <li><a href="/responsivo">Design Responsivo</a></li>
      </ul>
    </section>

    <section>
      <h3>Perguntas Frequentes</h3>
      <details>
        <summary>Com que frequência o blog é atualizado?</summary>
        <p>Publicamos novos artigos toda semana, geralmente às terças e quintas.</p>
      </details>
      <details>
        <summary>Posso contribuir com artigos?</summary>
        <p>Sim! Entre em contato pela página de contato e envie sua proposta.</p>
      </details>
      <details>
        <summary>Os artigos são gratuitos?</summary>
        <p>Todos os artigos do blog são gratuitos e sempre serão.</p>
      </details>
    </section>
  </aside>

  <footer>
    <p>&copy; 2025 DevBlog. Todos os direitos reservados.</p>
    <nav>
      <a href="/privacidade">Privacidade</a>
      <a href="/termos">Termos de Uso</a>
    </nav>
  </footer>
</body>
</html>`,
            },
          },
          {
            title: 'Quiz: Semântica',
            contentType: 'quiz' as const,
            order: 5,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual elemento HTML5 representa o conteúdo principal e único de uma página?',
                  options: ['<section>', '<article>', '<main>', '<div>'],
                  correctAnswer: 2,
                  explanation: 'O elemento <main> representa o conteúdo principal da página — aquele que é único e não se repete em outras páginas do site.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'Uma página HTML pode ter vários elementos <header>.',
                  correctAnswer: true,
                  explanation: 'Uma página pode ter múltiplos <header>: um para a página e outros dentro de <article>, <section>, etc. O que não pode é aninhar <header> dentro de outro <header>.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Qual é a principal diferença entre <section> e <article>?',
                  options: [
                    '<section> é para texto e <article> para imagens',
                    '<article> é independente e autocontido, <section> faz parte de algo maior',
                    '<section> só pode estar dentro de <main>',
                    'Não há diferença, são sinônimos',
                  ],
                  correctAnswer: 1,
                  explanation: 'O <article> representa conteúdo independente que faz sentido sozinho (ex: post de blog). O <section> agrupa conteúdo tematicamente relacionado dentro de um contexto maior.',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Qual elemento cria um widget expansível/retrátil sem JavaScript?',
                  options: ['<aside>', '<dialog>', '<details>', '<summary>'],
                  correctAnswer: 2,
                  explanation: 'O elemento <details>, combinado com <summary>, cria um widget de divulgação que o usuário pode abrir e fechar sem necessidade de JavaScript.',
                },
                {
                  id: 'q5',
                  type: 'true_false',
                  question: 'O elemento <aside> só pode ser usado como barra lateral da página.',
                  correctAnswer: false,
                  explanation: 'O <aside> pode ser usado tanto como barra lateral da página quanto dentro de um <article> para representar conteúdo tangencialmente relacionado, como notas laterais ou curiosidades.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Acessibilidade com HTML',
        slug: 'acessibilidade-com-html',
        description: 'Compreender os princípios de acessibilidade web e aplicar técnicas com HTML puro.',
        type: 'text' as const,
        isFree: false,
        order: 2,
        sections: [
          {
            title: 'Entender acessibilidade web',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Acessibilidade Web (a11y)

## O que é acessibilidade web?

Acessibilidade web (abreviada como **a11y** — "a", 11 letras, "y") significa criar sites que **todas as pessoas** possam usar, incluindo pessoas com deficiências visuais, auditivas, motoras ou cognitivas.

## Por que acessibilidade importa?

- **Ética:** Aproximadamente 1 bilhão de pessoas no mundo vivem com alguma deficiência
- **Legal:** Muitos países têm leis que exigem acessibilidade digital (no Brasil, a Lei Brasileira de Inclusão — Lei 13.146/2015)
- **Negócios:** Sites acessíveis alcançam mais pessoas e melhoram o SEO
- **Qualidade:** Práticas de acessibilidade melhoram a experiência para **todos** os usuários

## WCAG — Diretrizes de Acessibilidade

As **WCAG** (Web Content Accessibility Guidelines) são diretrizes internacionais organizadas em 4 princípios, conhecidos como **POUR**:

1. **Perceptível** — O conteúdo pode ser percebido por todos (texto alternativo, legendas, contraste)
2. **Operável** — A interface pode ser operada por todos (teclado, tempo suficiente)
3. **Compreensível** — O conteúdo é compreensível (linguagem clara, comportamento previsível)
4. **Robusto** — O conteúdo funciona com tecnologias assistivas (HTML válido, ARIA)

### Níveis de conformidade

- **A** — Mínimo (essencial)
- **AA** — Recomendado (padrão do mercado)
- **AAA** — Ideal (nem sempre viável)

## Como leitores de tela funcionam?

Leitores de tela como **NVDA**, **JAWS** e **VoiceOver** transformam o conteúdo visual em áudio. Eles:

1. Leem o **DOM** (estrutura HTML), não o que aparece visualmente
2. Usam tags semânticas para criar um **mapa da página**
3. Anunciam o **tipo** de cada elemento (link, botão, título, imagem, formulário)
4. Permitem navegar por **landmarks** (regiões semânticas)

## Práticas essenciais com HTML puro

### Texto alternativo em imagens

\`\`\`html
<!-- Correto: descreve a imagem -->
<img src="grafico.png" alt="Gráfico de barras mostrando vendas de 2024 por trimestre">

<!-- Imagem decorativa: alt vazio -->
<img src="enfeite.png" alt="">

<!-- Errado: alt genérico -->
<img src="grafico.png" alt="imagem">
\`\`\`

### Hierarquia de títulos

\`\`\`html
<!-- Correto: hierarquia lógica -->
<h1>Nome do Site</h1>
  <h2>Seção Principal</h2>
    <h3>Subseção</h3>
  <h2>Outra Seção</h2>

<!-- Errado: pular níveis -->
<h1>Nome do Site</h1>
  <h4>Subseção</h4>  <!-- pulou h2 e h3 -->
\`\`\`

### Labels em formulários

\`\`\`html
<!-- Correto: label associado -->
<label for="email">E-mail:</label>
<input type="email" id="email" name="email">

<!-- Errado: sem label -->
<input type="email" placeholder="Digite seu e-mail">
\`\`\`

### Idioma da página

\`\`\`html
<!-- Permite ao leitor de tela usar pronúncia correta -->
<html lang="pt-BR">
\`\`\`

## Ferramentas para testar acessibilidade

- **Lighthouse** (integrado ao Chrome DevTools)
- **axe DevTools** (extensão do navegador)
- **WAVE** (avaliador online)
- **NVDA** (leitor de tela gratuito para Windows)
- **VoiceOver** (integrado ao macOS/iOS)`,
            },
          },
          {
            title: 'Aplicar atributos ARIA básicos',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Atributos ARIA Básicos

## O que é ARIA?

**ARIA** (Accessible Rich Internet Applications) é um conjunto de atributos HTML que melhoram a acessibilidade quando as tags semânticas nativas não são suficientes.

> **Primeira regra do ARIA:** Se você pode usar um elemento HTML nativo com a semântica desejada, **use-o**. Só recorra ao ARIA quando não houver alternativa nativa.

## O atributo \`role\`

O atributo \`role\` define a **função** de um elemento para tecnologias assistivas:

\`\`\`html
<!-- Desnecessário: <nav> já tem role="navigation" implícito -->
<nav role="navigation">...</nav>  <!-- redundante! -->

<!-- Útil: div precisando agir como alerta -->
<div role="alert">Erro: campo obrigatório não preenchido.</div>

<!-- Útil: div agindo como botão (prefira <button>) -->
<div role="button" tabindex="0">Clique aqui</div>
\`\`\`

### Roles comuns

| Role | Função | Elemento nativo equivalente |
|------|--------|-----------------------------|
| \`banner\` | Cabeçalho do site | \`<header>\` (filho de body) |
| \`navigation\` | Navegação | \`<nav>\` |
| \`main\` | Conteúdo principal | \`<main>\` |
| \`complementary\` | Conteúdo complementar | \`<aside>\` |
| \`contentinfo\` | Rodapé do site | \`<footer>\` (filho de body) |
| \`alert\` | Mensagem importante | — |
| \`dialog\` | Janela de diálogo | \`<dialog>\` |

## O atributo \`aria-label\`

Fornece um **rótulo textual** quando não há texto visível:

\`\`\`html
<!-- Botão com apenas ícone -->
<button aria-label="Fechar">
  <span>✕</span>
</button>

<!-- Navegação com nome -->
<nav aria-label="Menu principal">
  <ul>...</ul>
</nav>

<!-- Diferenciando dois navs -->
<nav aria-label="Menu principal">...</nav>
<nav aria-label="Menu do rodapé">...</nav>
\`\`\`

## O atributo \`aria-hidden\`

**Esconde** um elemento das tecnologias assistivas (mas ele continua visível na tela):

\`\`\`html
<!-- Ícone decorativo: esconder do leitor de tela -->
<button>
  <span aria-hidden="true">🔍</span>
  Buscar
</button>

<!-- SVG decorativo -->
<svg aria-hidden="true">...</svg>
\`\`\`

**Cuidado:** Nunca use \`aria-hidden="true"\` em elementos que contêm conteúdo importante ou que podem receber foco.

## O atributo \`aria-describedby\`

Associa um elemento a uma **descrição adicional**:

\`\`\`html
<label for="senha">Senha:</label>
<input type="password" id="senha" aria-describedby="senha-dica">
<p id="senha-dica">A senha deve ter pelo menos 8 caracteres, incluindo um número.</p>
\`\`\`

Quando o leitor de tela foca no input, ele lê: *"Senha, campo de senha. A senha deve ter pelo menos 8 caracteres, incluindo um número."*

## O atributo \`aria-live\`

Anuncia **mudanças dinâmicas** de conteúdo sem que o usuário precise navegar até o elemento:

\`\`\`html
<!-- Mensagens de status -->
<div aria-live="polite" id="status">
  <!-- JS atualiza o conteúdo aqui -->
</div>

<!-- Alertas urgentes -->
<div aria-live="assertive" id="alerta">
  <!-- Interrompe o leitor de tela para anunciar -->
</div>
\`\`\`

**Valores de \`aria-live\`:**
- \`polite\` — Aguarda o leitor de tela terminar o que está falando
- \`assertive\` — Interrompe imediatamente para anunciar
- \`off\` — Não anuncia (padrão)

## Exemplo prático completo

\`\`\`html
<form>
  <div>
    <label for="nome">Nome completo:</label>
    <input type="text" id="nome" required aria-describedby="nome-ajuda">
    <p id="nome-ajuda">Digite seu nome e sobrenome.</p>
  </div>

  <div>
    <label for="email">E-mail:</label>
    <input type="email" id="email" required aria-describedby="email-ajuda">
    <p id="email-ajuda">Usaremos para enviar a confirmação.</p>
  </div>

  <button type="submit">
    <span aria-hidden="true">📧</span>
    Enviar
  </button>

  <div aria-live="polite" id="form-status"></div>
</form>
\`\`\``,
            },
          },
          {
            title: 'Garantir navegação por teclado',
            contentType: 'text' as const,
            order: 3,
            content: {
              body: `# Navegação por Teclado

## Por que navegação por teclado é essencial?

Muitas pessoas não usam mouse: pessoas com deficiências motoras, usuários de leitores de tela, ou simplesmente usuários avançados que preferem teclado. Se seu site não funciona sem mouse, você está excluindo essas pessoas.

## Elementos naturalmente focáveis

Alguns elementos HTML já recebem foco automaticamente com a tecla **Tab**:

- \`<a href="...">\` — Links
- \`<button>\` — Botões
- \`<input>\`, \`<textarea>\`, \`<select>\` — Campos de formulário
- \`<details>\` — Widget expansível

**Elementos que NÃO recebem foco:** \`<div>\`, \`<span>\`, \`<p>\`, \`<section>\`, etc.

## O atributo \`tabindex\`

O \`tabindex\` controla se e como um elemento participa da navegação por Tab:

\`\`\`html
<!-- tabindex="0": inclui na ordem natural de tabulação -->
<div role="button" tabindex="0">Botão customizado</div>

<!-- tabindex="-1": focável por JS, mas não por Tab -->
<div id="modal" tabindex="-1">Conteúdo do modal</div>

<!-- tabindex positivo: EVITE! Altera a ordem natural -->
<input tabindex="3">  <!-- NÃO faça isso -->
\`\`\`

### Regras do tabindex

| Valor | Comportamento |
|-------|--------------|
| Não definido | Segue comportamento padrão do elemento |
| \`0\` | Incluído na ordem natural de tabulação |
| \`-1\` | Removido da tabulação, mas focável via JavaScript |
| Positivo | **Evitar!** Cria ordem customizada, difícil de manter |

## Indicador de foco visível

**Nunca remova o outline de foco** sem substituí-lo por algo equivalente:

\`\`\`html
<!-- ERRADO: remove indicador de foco -->
<style>
  *:focus { outline: none; }  /* Nunca faça isso! */
</style>

<!-- CORRETO: customiza o indicador -->
<style>
  *:focus-visible {
    outline: 3px solid #4A90D9;
    outline-offset: 2px;
  }
</style>
\`\`\`

O pseudo-seletor \`:focus-visible\` mostra o outline apenas para navegação por teclado, não para cliques de mouse.

## Skip Links (Links de Pular)

Skip links permitem que usuários de teclado **pulem diretamente** para o conteúdo principal, sem precisar tabular por todo o menu:

\`\`\`html
<body>
  <a href="#conteudo-principal" class="skip-link">
    Pular para o conteúdo principal
  </a>

  <header>
    <nav>
      <!-- muitos links de menu aqui -->
    </nav>
  </header>

  <main id="conteudo-principal">
    <h1>Conteúdo da Página</h1>
    <!-- ... -->
  </main>
</body>
\`\`\`

CSS para mostrar o skip link apenas no foco:

\`\`\`html
<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    z-index: 100;
  }
  .skip-link:focus {
    top: 0;
  }
</style>
\`\`\`

## Ordem lógica do DOM

A ordem de tabulação segue a **ordem do código HTML**, não a posição visual (CSS). Garanta que a ordem do DOM faça sentido:

\`\`\`html
<!-- Correto: ordem do DOM = ordem lógica -->
<header>...</header>
<nav>...</nav>
<main>...</main>
<aside>...</aside>
<footer>...</footer>

<!-- Problemático: CSS reordena visualmente, mas Tab segue o DOM -->
<style>
  .sidebar { order: -1; }  /* Aparece primeiro visualmente */
</style>
<!-- A tabulação ainda segue a ordem do HTML -->
\`\`\`

## Teclas de navegação comuns

| Tecla | Ação |
|-------|------|
| **Tab** | Avança para o próximo elemento focável |
| **Shift + Tab** | Volta para o elemento focável anterior |
| **Enter** | Ativa links e botões |
| **Espaço** | Ativa botões, marca checkboxes |
| **Setas** | Navega entre radio buttons, opções de select |
| **Esc** | Fecha modais, menus |

## Testando navegação por teclado

Para testar se seu site funciona sem mouse:

1. Abra a página no navegador
2. Pressione **Tab** repetidamente para navegar
3. Verifique se **todos** os elementos interativos são alcançáveis
4. Verifique se o **indicador de foco** é visível
5. Verifique se a **ordem** faz sentido logicamente
6. Tente usar **Enter** e **Espaço** para ativar elementos`,
            },
          },
          {
            title: 'Exercício: Auditar acessibilidade',
            contentType: 'exercise' as const,
            order: 4,
            content: {
              language: 'html' as const,
              problem: 'A página abaixo possui **diversos problemas de acessibilidade**. Identifique e corrija todos os problemas: falta de atributo lang, imagens sem alt adequado, formulário sem labels, falta de skip link, uso incorreto de títulos, falta de ARIA e elementos não acessíveis por teclado. Corrija todos os erros mantendo o mesmo conteúdo visual.',
              starterCode: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Loja Virtual</title>
  <style>
    * { outline: none; }
  </style>
</head>
<body>
  <div class="header">
    <img src="logo.png">
    <div class="menu">
      <a href="/">Home</a>
      <a href="/produtos">Produtos</a>
      <a href="/contato">Contato</a>
    </div>
  </div>

  <div class="content">
    <h3>Bem-vindo à nossa loja</h3>
    <p>Confira nossos produtos em destaque.</p>

    <div class="product">
      <img src="produto1.jpg">
      <h5>Camiseta Básica</h5>
      <p>R$ 49,90</p>
      <div onclick="addToCart(1)" class="btn">Adicionar ao Carrinho</div>
    </div>
  </div>

  <div class="footer">
    <p>© 2025 Loja Virtual</p>
  </div>

  <div class="contact-form">
    <h6>Fale Conosco</h6>
    <input type="text" placeholder="Seu nome">
    <input type="email" placeholder="Seu e-mail">
    <textarea placeholder="Sua mensagem"></textarea>
    <div onclick="sendForm()" class="btn">Enviar</div>
  </div>
</body>
</html>`,
              hints: [
                'Adicione lang="pt-BR" ao elemento <html>.',
                'Substitua as divs genéricas por tags semânticas (header, nav, main, footer).',
                'Adicione alt descritivo nas imagens e alt="" na logo se decorativa.',
                'Use hierarquia correta de títulos (h1, h2, h3 em ordem).',
                'Troque os divs com onclick por <button>.',
                'Adicione <label> aos campos do formulário.',
                'Remova outline: none e adicione :focus-visible personalizado.',
                'Adicione um skip link no topo da página.',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loja Virtual</title>
  <style>
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      z-index: 100;
    }
    .skip-link:focus {
      top: 0;
    }
    *:focus-visible {
      outline: 3px solid #4A90D9;
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  <a href="#conteudo-principal" class="skip-link">Pular para o conteúdo principal</a>

  <header>
    <img src="logo.png" alt="Loja Virtual - Logo">
    <nav aria-label="Menu principal">
      <a href="/">Home</a>
      <a href="/produtos">Produtos</a>
      <a href="/contato">Contato</a>
    </nav>
  </header>

  <main id="conteudo-principal">
    <h1>Bem-vindo à nossa loja</h1>
    <p>Confira nossos produtos em destaque.</p>

    <section aria-label="Produtos em destaque">
      <article>
        <img src="produto1.jpg" alt="Camiseta básica branca de algodão">
        <h2>Camiseta Básica</h2>
        <p>R$ 49,90</p>
        <button type="button" onclick="addToCart(1)">Adicionar ao Carrinho</button>
      </article>
    </section>

    <section>
      <h2>Fale Conosco</h2>
      <form>
        <div>
          <label for="nome">Seu nome:</label>
          <input type="text" id="nome" name="nome" required>
        </div>
        <div>
          <label for="email">Seu e-mail:</label>
          <input type="email" id="email" name="email" required>
        </div>
        <div>
          <label for="mensagem">Sua mensagem:</label>
          <textarea id="mensagem" name="mensagem" required></textarea>
        </div>
        <button type="submit">Enviar</button>
      </form>
    </section>
  </main>

  <footer>
    <p>&copy; 2025 Loja Virtual</p>
  </footer>
</body>
</html>`,
            },
          },
          {
            title: 'Quiz: Acessibilidade',
            contentType: 'quiz' as const,
            order: 5,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'O que significa a sigla WCAG?',
                  options: [
                    'Web Content Accessibility Guidelines',
                    'Web Coding and Architecture Guide',
                    'Website Content Arrangement Guidelines',
                    'Web Components Accessibility Group',
                  ],
                  correctAnswer: 0,
                  explanation: 'WCAG significa Web Content Accessibility Guidelines (Diretrizes de Acessibilidade para Conteúdo Web), o padrão internacional de acessibilidade.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'O atributo aria-hidden="true" esconde o elemento tanto visualmente quanto para leitores de tela.',
                  correctAnswer: false,
                  explanation: 'O aria-hidden="true" esconde o elemento APENAS para tecnologias assistivas (leitores de tela). O elemento continua visível na tela. Para esconder visualmente, é necessário CSS.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Qual valor de tabindex torna um elemento focável por JavaScript mas NÃO pela tecla Tab?',
                  options: ['tabindex="0"', 'tabindex="-1"', 'tabindex="1"', 'tabindex="auto"'],
                  correctAnswer: 1,
                  explanation: 'tabindex="-1" permite focar o elemento via JavaScript (element.focus()), mas o remove da ordem de tabulação por Tab. Útil para modais e seções que recebem foco programaticamente.',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Qual atributo ARIA deve ser usado para associar uma descrição auxiliar a um campo de formulário?',
                  options: ['aria-label', 'aria-hidden', 'aria-describedby', 'aria-live'],
                  correctAnswer: 2,
                  explanation: 'O aria-describedby associa um elemento a uma descrição adicional (como dicas de preenchimento). O leitor de tela lê o label do campo e, em seguida, a descrição associada.',
                },
                {
                  id: 'q5',
                  type: 'true_false',
                  question: 'Um skip link permite que usuários de teclado pulem diretamente para o conteúdo principal da página.',
                  correctAnswer: true,
                  explanation: 'Skip links são links posicionados no início da página que, quando ativados, levam o foco diretamente para o conteúdo principal, permitindo pular a navegação repetitiva.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'SEO com HTML',
        slug: 'seo-com-html',
        description: 'Otimizar páginas HTML para mecanismos de busca usando meta tags e dados estruturados.',
        type: 'text' as const,
        isFree: false,
        order: 3,
        sections: [
          {
            title: 'Usar meta tags para SEO',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Meta Tags para SEO

## O que é SEO?

**SEO** (Search Engine Optimization) é o conjunto de técnicas para melhorar o posicionamento de uma página nos resultados de busca do Google e outros buscadores. O HTML é a **base do SEO** — sem uma estrutura HTML correta, nenhuma outra otimização funciona bem.

## A tag \`<title>\`

A tag \`<title>\` é o elemento **mais importante** para SEO. Ela define o título que aparece na aba do navegador e nos resultados de busca:

\`\`\`html
<head>
  <title>Aprenda HTML Gratuito - Curso Completo para Iniciantes | DevBlog</title>
</head>
\`\`\`

**Boas práticas:**
- Entre 50 e 60 caracteres
- Palavra-chave principal no início
- Nome do site no final, separado por \`|\` ou \`—\`
- Cada página deve ter um título **único**

## A meta tag \`description\`

A \`description\` aparece como o texto descritivo nos resultados de busca:

\`\`\`html
<meta name="description" content="Aprenda HTML do zero com nosso curso gratuito. 6 módulos práticos com exercícios interativos, quiz e projeto final. Comece hoje!">
\`\`\`

**Boas práticas:**
- Entre 150 e 160 caracteres
- Inclua a palavra-chave naturalmente
- Seja descritivo e atrativo (é seu "anúncio" no Google)
- Cada página deve ter descrição **única**

## A meta tag \`robots\`

Controla como os buscadores tratam a página:

\`\`\`html
<!-- Permitir indexação e seguir links (padrão) -->
<meta name="robots" content="index, follow">

<!-- Não indexar esta página -->
<meta name="robots" content="noindex">

<!-- Indexar, mas não seguir links -->
<meta name="robots" content="index, nofollow">

<!-- Não indexar e não seguir links -->
<meta name="robots" content="noindex, nofollow">
\`\`\`

## Open Graph (para Facebook e LinkedIn)

As meta tags **Open Graph** controlam como sua página aparece quando compartilhada em redes sociais:

\`\`\`html
<meta property="og:title" content="Aprenda HTML - Curso Gratuito">
<meta property="og:description" content="Curso completo de HTML com 6 módulos práticos.">
<meta property="og:image" content="https://exemplo.com/imagem-compartilhamento.jpg">
<meta property="og:url" content="https://exemplo.com/curso-html">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
\`\`\`

**Dicas para og:image:**
- Tamanho recomendado: 1200 × 630 pixels
- Use URL absoluta (com https://)
- Inclua texto legível na imagem

## Twitter Cards

Similar ao Open Graph, mas específico para o Twitter (X):

\`\`\`html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Aprenda HTML - Curso Gratuito">
<meta name="twitter:description" content="Curso completo de HTML com 6 módulos práticos.">
<meta name="twitter:image" content="https://exemplo.com/imagem-twitter.jpg">
<meta name="twitter:site" content="@devblog">
\`\`\`

**Tipos de card:**
- \`summary\` — Card pequeno com miniatura
- \`summary_large_image\` — Card grande com imagem destacada

## Outras meta tags úteis

\`\`\`html
<!-- Charset (obrigatório) -->
<meta charset="UTF-8">

<!-- Viewport (essencial para mobile) -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- Autor -->
<meta name="author" content="João Silva">

<!-- Canonical (evita conteúdo duplicado) -->
<link rel="canonical" href="https://exemplo.com/pagina-original">

<!-- Favicon -->
<link rel="icon" href="/favicon.ico" type="image/x-icon">
\`\`\`

## Exemplo completo de \`<head>\` otimizado

\`\`\`html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aprenda HTML Gratuito - Curso Completo | DevBlog</title>
  <meta name="description" content="Curso gratuito de HTML com 6 módulos, exercícios práticos e projeto final. Aprenda do zero ao avançado.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://devblog.com/curso-html">

  <!-- Open Graph -->
  <meta property="og:title" content="Aprenda HTML - Curso Gratuito">
  <meta property="og:description" content="Curso completo de HTML com 6 módulos práticos.">
  <meta property="og:image" content="https://devblog.com/img/curso-html-og.jpg">
  <meta property="og:url" content="https://devblog.com/curso-html">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Aprenda HTML - Curso Gratuito">
  <meta name="twitter:description" content="Curso completo de HTML com 6 módulos práticos.">
  <meta name="twitter:image" content="https://devblog.com/img/curso-html-twitter.jpg">

  <link rel="icon" href="/favicon.ico">
</head>
\`\`\``,
            },
          },
          {
            title: 'Aplicar dados estruturados',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Dados Estruturados (JSON-LD e Schema.org)

## O que são dados estruturados?

Dados estruturados são informações formatadas de maneira padronizada que ajudam os **buscadores a entender** o conteúdo da página. Eles podem gerar **rich snippets** — resultados de busca enriquecidos com avaliações, preços, receitas, FAQs, etc.

## Schema.org

O **Schema.org** é o vocabulário padrão usado por Google, Bing, Yahoo e Yandex para dados estruturados. Ele define tipos como:

- \`Article\` — Artigo de blog/notícia
- \`BreadcrumbList\` — Trilha de navegação
- \`FAQPage\` — Página de perguntas frequentes
- \`Course\` — Curso educacional
- \`Person\` — Pessoa
- \`Organization\` — Organização

## JSON-LD: o formato recomendado

O **JSON-LD** (JavaScript Object Notation for Linked Data) é o formato recomendado pelo Google. Ele é inserido em um \`<script>\` no \`<head>\` ou \`<body>\`:

\`\`\`html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Introdução ao HTML Semântico",
  "author": {
    "@type": "Person",
    "name": "Ana Costa"
  },
  "datePublished": "2025-03-10",
  "dateModified": "2025-03-12",
  "description": "Aprenda sobre as tags semânticas do HTML5 e como usá-las.",
  "image": "https://exemplo.com/artigo-html.jpg"
}
</script>
\`\`\`

## Breadcrumbs (Trilha de Navegação)

Breadcrumbs aparecem nos resultados de busca mostrando a hierarquia da página:

\`\`\`html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Início",
      "item": "https://exemplo.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Cursos",
      "item": "https://exemplo.com/cursos"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "HTML Completo",
      "item": "https://exemplo.com/cursos/html"
    }
  ]
}
</script>
\`\`\`

Combine o JSON-LD com a navegação visível em HTML:

\`\`\`html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Início</a></li>
    <li><a href="/cursos">Cursos</a></li>
    <li aria-current="page">HTML Completo</li>
  </ol>
</nav>
\`\`\`

## FAQ Page

Páginas de FAQ podem gerar rich snippets com perguntas e respostas diretamente nos resultados do Google:

\`\`\`html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "O curso é gratuito?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim, todo o conteúdo do curso é gratuito e aberto."
      }
    },
    {
      "@type": "Question",
      "name": "Preciso ter experiência prévia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Não, o curso foi criado para iniciantes absolutos."
      }
    }
  ]
}
</script>
\`\`\`

## Validando dados estruturados

Use estas ferramentas para verificar se seus dados estão corretos:

- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema Markup Validator**: https://validator.schema.org/

## Dicas importantes

1. **Não invente dados** — Os dados estruturados devem refletir o conteúdo real da página
2. **Um JSON-LD por tipo** — Você pode ter múltiplos blocos \`<script>\` na mesma página
3. **Mantenha atualizado** — Se a data do artigo muda, atualize o \`dateModified\`
4. **Teste sempre** — Valide com as ferramentas do Google antes de publicar`,
            },
          },
          {
            title: 'Exercício: Otimizar página para SEO',
            contentType: 'exercise' as const,
            order: 3,
            content: {
              language: 'html' as const,
              problem: 'A página abaixo é um artigo de blog, mas está completamente sem otimização para SEO. Adicione: tag title otimizada, meta description, meta viewport, meta robots, tags Open Graph completas, Twitter Card, link canonical, dados estruturados JSON-LD para Article e BreadcrumbList. Mantenha todo o conteúdo existente.',
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Artigo</title>
</head>
<body>
  <header>
    <h1>DevBlog</h1>
    <nav>
      <a href="/">Início</a>
      <a href="/artigos">Artigos</a>
    </nav>
  </header>

  <main>
    <article>
      <h2>10 Dicas de HTML para Iniciantes</h2>
      <p>Publicado em 15 de março de 2025 por Ana Costa</p>
      <p>Aprender HTML é o primeiro passo para se tornar um desenvolvedor web. Neste artigo, compartilhamos 10 dicas essenciais para quem está começando.</p>
      <p>Desde a estrutura básica de um documento até o uso de tags semânticas, cada dica foi pensada para acelerar seu aprendizado.</p>
    </article>
  </main>

  <footer>
    <p>&copy; 2025 DevBlog</p>
  </footer>
</body>
</html>`,
              hints: [
                'A tag <title> deve ter entre 50-60 caracteres e incluir a palavra-chave principal.',
                'A meta description deve ter entre 150-160 caracteres.',
                'Use og:type "article" para artigos de blog.',
                'O JSON-LD do Article precisa de headline, author, datePublished e description.',
                'Adicione BreadcrumbList com Início > Artigos > Título do artigo.',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>10 Dicas de HTML para Iniciantes - Guia Completo | DevBlog</title>
  <meta name="description" content="Descubra 10 dicas essenciais de HTML para iniciantes. Aprenda desde a estrutura básica até tags semânticas e acelere seu aprendizado em desenvolvimento web.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://devblog.com/artigos/10-dicas-html-iniciantes">

  <!-- Open Graph -->
  <meta property="og:title" content="10 Dicas de HTML para Iniciantes">
  <meta property="og:description" content="Descubra 10 dicas essenciais de HTML para iniciantes e acelere seu aprendizado.">
  <meta property="og:image" content="https://devblog.com/img/10-dicas-html-og.jpg">
  <meta property="og:url" content="https://devblog.com/artigos/10-dicas-html-iniciantes">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="pt_BR">
  <meta property="article:published_time" content="2025-03-15">
  <meta property="article:author" content="Ana Costa">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="10 Dicas de HTML para Iniciantes">
  <meta name="twitter:description" content="Descubra 10 dicas essenciais de HTML para iniciantes e acelere seu aprendizado.">
  <meta name="twitter:image" content="https://devblog.com/img/10-dicas-html-twitter.jpg">

  <!-- Dados Estruturados: Article -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "10 Dicas de HTML para Iniciantes",
    "author": {
      "@type": "Person",
      "name": "Ana Costa"
    },
    "datePublished": "2025-03-15",
    "description": "Aprender HTML é o primeiro passo para se tornar um desenvolvedor web. Neste artigo, compartilhamos 10 dicas essenciais para quem está começando.",
    "image": "https://devblog.com/img/10-dicas-html.jpg",
    "publisher": {
      "@type": "Organization",
      "name": "DevBlog",
      "logo": {
        "@type": "ImageObject",
        "url": "https://devblog.com/img/logo.png"
      }
    }
  }
  </script>

  <!-- Dados Estruturados: Breadcrumb -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Início",
        "item": "https://devblog.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Artigos",
        "item": "https://devblog.com/artigos"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "10 Dicas de HTML para Iniciantes",
        "item": "https://devblog.com/artigos/10-dicas-html-iniciantes"
      }
    ]
  }
  </script>
</head>
<body>
  <header>
    <h1>DevBlog</h1>
    <nav>
      <a href="/">Início</a>
      <a href="/artigos">Artigos</a>
    </nav>
  </header>

  <nav aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Início</a></li>
      <li><a href="/artigos">Artigos</a></li>
      <li aria-current="page">10 Dicas de HTML para Iniciantes</li>
    </ol>
  </nav>

  <main>
    <article>
      <h2>10 Dicas de HTML para Iniciantes</h2>
      <p>Publicado em <time datetime="2025-03-15">15 de março de 2025</time> por Ana Costa</p>
      <p>Aprender HTML é o primeiro passo para se tornar um desenvolvedor web. Neste artigo, compartilhamos 10 dicas essenciais para quem está começando.</p>
      <p>Desde a estrutura básica de um documento até o uso de tags semânticas, cada dica foi pensada para acelerar seu aprendizado.</p>
    </article>
  </main>

  <footer>
    <p>&copy; 2025 DevBlog</p>
  </footer>
</body>
</html>`,
            },
          },
          {
            title: 'Quiz: SEO e meta tags',
            contentType: 'quiz' as const,
            order: 4,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual é o tamanho recomendado para a tag <title> em termos de SEO?',
                  options: ['10 a 20 caracteres', '30 a 40 caracteres', '50 a 60 caracteres', '80 a 100 caracteres'],
                  correctAnswer: 2,
                  explanation: 'O tamanho recomendado para a tag <title> é entre 50 e 60 caracteres. Títulos maiores são cortados nos resultados de busca.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'As meta tags Open Graph são usadas para controlar como a página aparece quando compartilhada em redes sociais.',
                  correctAnswer: true,
                  explanation: 'As meta tags Open Graph (og:title, og:description, og:image, etc.) definem como a página é exibida ao ser compartilhada no Facebook, LinkedIn e outras redes sociais.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Qual formato de dados estruturados é recomendado pelo Google?',
                  options: ['XML', 'Microdata', 'JSON-LD', 'RDFa'],
                  correctAnswer: 2,
                  explanation: 'O Google recomenda o formato JSON-LD (JavaScript Object Notation for Linked Data) para dados estruturados, pois é fácil de implementar e não se mistura com o HTML.',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Qual meta tag evita que uma página seja indexada pelos buscadores?',
                  options: [
                    '<meta name="robots" content="noindex">',
                    '<meta name="robots" content="nofollow">',
                    '<meta name="description" content="noindex">',
                    '<meta name="index" content="false">',
                  ],
                  correctAnswer: 0,
                  explanation: 'A meta tag <meta name="robots" content="noindex"> instrui os buscadores a não indexar a página. O "nofollow" apenas impede que sigam os links, mas não impede a indexação.',
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    title: 'Recursos Avançados e Projeto Final',
    description: 'Conhecer recursos modernos e aplicar tudo em um projeto.',
    order: 6,
    lessons: [
      {
        title: 'Recursos modernos do HTML5',
        slug: 'recursos-modernos-html5',
        description: 'Explorar atributos globais, elementos interativos e gráficos com SVG e Canvas.',
        type: 'text' as const,
        isFree: false,
        order: 1,
        sections: [
          {
            title: 'Usar atributos globais úteis',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Atributos Globais Úteis

## O que são atributos globais?

Atributos globais são atributos que podem ser usados em **qualquer elemento HTML**. O HTML5 introduziu vários atributos globais poderosos que facilitam a interação e a personalização de elementos.

## Atributos \`data-*\` (dados personalizados)

Os atributos \`data-*\` permitem armazenar **dados personalizados** diretamente nos elementos HTML, sem interferir na apresentação ou semântica:

\`\`\`html
<article data-id="42" data-category="html" data-author="ana-costa">
  <h2>Artigo sobre HTML</h2>
  <p>Conteúdo do artigo...</p>
</article>

<button data-action="delete" data-item-id="42">
  Excluir
</button>
\`\`\`

### Acessando data-* com JavaScript

\`\`\`html
<div id="produto" data-preco="49.90" data-estoque="15">
  Camiseta Básica
</div>

<script>
  const produto = document.getElementById('produto');

  // Usando dataset
  console.log(produto.dataset.preco);    // "49.90"
  console.log(produto.dataset.estoque);  // "15"

  // Nomes compostos: data-item-id → dataset.itemId
</script>
\`\`\`

**Regras de nomenclatura:**
- Sempre começam com \`data-\`
- Apenas letras minúsculas, números e hífens
- No JavaScript, hífens são convertidos para camelCase: \`data-item-id\` → \`dataset.itemId\`

## O atributo \`contenteditable\`

Torna qualquer elemento **editável** pelo usuário, diretamente no navegador:

\`\`\`html
<div contenteditable="true">
  <h2>Clique aqui e edite este título</h2>
  <p>Este parágrafo também é editável. Experimente!</p>
</div>

<!-- Apenas um campo editável -->
<p contenteditable="true">Edite este texto.</p>
\`\`\`

**Valores possíveis:**
- \`true\` — O elemento é editável
- \`false\` — O elemento não é editável (padrão)
- \`plaintext-only\` — Editável, mas só aceita texto puro (sem formatação)

## O atributo \`hidden\`

O atributo \`hidden\` **esconde completamente** um elemento da página (equivale a \`display: none\` em CSS):

\`\`\`html
<p>Este parágrafo é visível.</p>
<p hidden>Este parágrafo está oculto.</p>

<!-- Útil para esconder conteúdo que será revelado por JS -->
<div id="mensagem" hidden>
  <p>Obrigado por se inscrever!</p>
</div>

<script>
  // Revelar o elemento
  document.getElementById('mensagem').hidden = false;
</script>
\`\`\`

## O atributo \`draggable\`

Torna um elemento **arrastável** com a API de Drag and Drop:

\`\`\`html
<div draggable="true" id="card">
  <p>Arraste este card</p>
</div>

<div id="area-destino" style="border: 2px dashed #ccc; padding: 20px;">
  Solte aqui
</div>

<script>
  const card = document.getElementById('card');
  const destino = document.getElementById('area-destino');

  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', card.id);
  });

  destino.addEventListener('dragover', (e) => {
    e.preventDefault(); // Permite o drop
  });

  destino.addEventListener('drop', (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    destino.appendChild(document.getElementById(id));
  });
</script>
\`\`\`

## O atributo \`spellcheck\`

Ativa ou desativa a **verificação ortográfica** do navegador:

\`\`\`html
<!-- Verificação ortográfica ativada (padrão para textarea) -->
<textarea spellcheck="true">Escreva aqui e o navegador sublinhará erros.</textarea>

<!-- Desativada (útil para código ou dados técnicos) -->
<input type="text" spellcheck="false" placeholder="Digite código HTML">
<textarea spellcheck="false">function hello() { return "world"; }</textarea>
\`\`\`

## Resumo dos atributos globais

| Atributo | Função | Exemplo de uso |
|----------|--------|---------------|
| \`data-*\` | Armazenar dados customizados | Metadados de produtos, IDs |
| \`contenteditable\` | Tornar editável | Editores WYSIWYG, notas |
| \`hidden\` | Esconder elemento | Mensagens de feedback, modais |
| \`draggable\` | Tornar arrastável | Kanban boards, reordenação |
| \`spellcheck\` | Verificação ortográfica | Campos de texto, editores |

Outros atributos globais úteis incluem \`title\` (tooltip), \`lang\` (idioma específico), \`dir\` (direção do texto) e \`translate\` (controle de tradução automática).`,
            },
          },
          {
            title: 'Conhecer elementos interativos',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Elementos Interativos do HTML5

## O elemento \`<dialog>\`

O \`<dialog>\` cria uma **janela de diálogo** (modal ou não modal) nativa do HTML, sem necessidade de bibliotecas JavaScript:

\`\`\`html
<dialog id="meu-modal">
  <h2>Confirmar ação</h2>
  <p>Tem certeza que deseja excluir este item?</p>
  <form method="dialog">
    <button value="cancelar">Cancelar</button>
    <button value="confirmar">Confirmar</button>
  </form>
</dialog>

<button onclick="document.getElementById('meu-modal').showModal()">
  Abrir Modal
</button>
\`\`\`

### Modal vs Não Modal

\`\`\`html
<script>
  const dialog = document.getElementById('meu-modal');

  // Modal: bloqueia interação com o resto da página
  dialog.showModal();

  // Não modal: permite interação com o resto da página
  dialog.show();

  // Fechar
  dialog.close();

  // Verificar o valor retornado (do botão do form)
  dialog.addEventListener('close', () => {
    console.log(dialog.returnValue); // "cancelar" ou "confirmar"
  });
</script>
\`\`\`

### Estilizando o backdrop

\`\`\`html
<style>
  dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }
</style>
\`\`\`

O \`<dialog>\` já vem com comportamento de foco acessível: o foco fica preso dentro do modal e **Esc** fecha automaticamente.

## O elemento \`<details>\` e \`<summary>\` (revisão)

Já vimos esses elementos no módulo anterior. Aqui, vamos explorar usos avançados:

\`\`\`html
<!-- Acordeão exclusivo (HTML puro, sem JS) usando atributo name -->
<details name="faq">
  <summary>Pergunta 1</summary>
  <p>Resposta 1...</p>
</details>
<details name="faq">
  <summary>Pergunta 2</summary>
  <p>Resposta 2...</p>
</details>
<details name="faq">
  <summary>Pergunta 3</summary>
  <p>Resposta 3...</p>
</details>
\`\`\`

Quando vários \`<details>\` compartilham o mesmo atributo \`name\`, abrir um fecha automaticamente os outros — criando um **acordeão** sem JavaScript!

## O elemento \`<progress>\`

Exibe uma **barra de progresso**:

\`\`\`html
<!-- Progresso determinado (valor conhecido) -->
<label for="download">Download:</label>
<progress id="download" value="65" max="100">65%</progress>

<!-- Progresso indeterminado (carregando...) -->
<label for="carregando">Carregando:</label>
<progress id="carregando">Carregando...</progress>
\`\`\`

**Atributos:**
- \`value\` — Valor atual do progresso
- \`max\` — Valor máximo (padrão: 1)
- O texto dentro é fallback para navegadores antigos

### Atualizando com JavaScript

\`\`\`html
<progress id="upload" value="0" max="100">0%</progress>

<script>
  const progress = document.getElementById('upload');
  let valor = 0;
  const intervalo = setInterval(() => {
    valor += 10;
    progress.value = valor;
    if (valor >= 100) clearInterval(intervalo);
  }, 500);
</script>
\`\`\`

## O elemento \`<meter>\`

Similar ao \`<progress>\`, mas para **medições estáticas** dentro de um intervalo conhecido:

\`\`\`html
<!-- Uso de disco -->
<label for="disco">Uso do disco:</label>
<meter id="disco" value="0.7" min="0" max="1" low="0.3" high="0.7" optimum="0.2">
  70%
</meter>

<!-- Nota de avaliação -->
<label for="nota">Nota:</label>
<meter id="nota" value="8.5" min="0" max="10" low="4" high="7" optimum="10">
  8.5 de 10
</meter>
\`\`\`

**Atributos do \`<meter>\`:**
- \`min\`, \`max\` — Intervalo total
- \`low\`, \`high\` — Definem faixas (baixo, médio, alto)
- \`optimum\` — Valor ideal (determina as cores)
- O navegador muda a cor automaticamente: verde (bom), amarelo (ok), vermelho (ruim)

## Diferença entre \`<progress>\` e \`<meter>\`

| Critério | \`<progress>\` | \`<meter>\` |
|----------|--------------|-----------|
| Propósito | Progresso de uma tarefa | Medição estática |
| Exemplos | Download, upload, formulário | Nota, uso de disco, temperatura |
| Indeterminado | Sim (sem value) | Não |
| Faixas de cor | Não | Sim (low, high, optimum) |

## Tabela resumo

| Elemento | Função | JavaScript necessário? |
|----------|--------|----------------------|
| \`<dialog>\` | Janela modal/não modal | Sim, para abrir/fechar |
| \`<details>\` | Conteúdo expansível | Não |
| \`<progress>\` | Barra de progresso | Opcional (atualizar valor) |
| \`<meter>\` | Indicador de medição | Não |`,
            },
          },
          {
            title: 'Incorporar SVG e Canvas',
            contentType: 'text' as const,
            order: 3,
            content: {
              body: `# SVG e Canvas

## SVG (Scalable Vector Graphics)

O **SVG** é um formato de imagem vetorial baseado em XML. Diferente de imagens raster (PNG, JPG), imagens SVG **não perdem qualidade** ao serem redimensionadas.

### SVG via tag \`<img>\`

\`\`\`html
<img src="icone.svg" alt="Ícone de estrela" width="48" height="48">
\`\`\`

**Prós:** Simples, cache do navegador
**Contras:** Não é possível estilizar com CSS ou manipular com JS

### SVG inline (dentro do HTML)

\`\`\`html
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="#3498db" />
  <text x="50" y="55" text-anchor="middle" fill="white" font-size="16">
    HTML
  </text>
</svg>
\`\`\`

**Prós:** Estilizável com CSS, manipulável com JS, acessível
**Contras:** Aumenta o tamanho do HTML, sem cache separado

### Estilizando SVG inline com CSS

\`\`\`html
<style>
  .icone-svg {
    fill: #2c3e50;
    transition: fill 0.3s;
  }
  .icone-svg:hover {
    fill: #e74c3c;
  }
</style>

<svg class="icone-svg" width="32" height="32" viewBox="0 0 24 24">
  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
           2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
           C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
           c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
</svg>
\`\`\`

### Formas básicas do SVG

\`\`\`html
<svg width="400" height="200" viewBox="0 0 400 200">
  <!-- Retângulo -->
  <rect x="10" y="10" width="80" height="60" fill="#e74c3c" rx="10" />

  <!-- Círculo -->
  <circle cx="160" cy="40" r="30" fill="#3498db" />

  <!-- Elipse -->
  <ellipse cx="260" cy="40" rx="50" ry="30" fill="#2ecc71" />

  <!-- Linha -->
  <line x1="10" y1="120" x2="390" y2="120" stroke="#95a5a6" stroke-width="2" />

  <!-- Polígono (triângulo) -->
  <polygon points="50,190 10,180 90,180" fill="#f39c12" />

  <!-- Texto -->
  <text x="200" y="190" text-anchor="middle" font-size="18" fill="#2c3e50">
    Formas SVG
  </text>
</svg>
\`\`\`

## Canvas

O \`<canvas>\` é um elemento HTML que oferece uma **superfície de desenho** manipulada exclusivamente via JavaScript. Ideal para gráficos dinâmicos, jogos e visualizações.

### Exemplo básico

\`\`\`html
<canvas id="meu-canvas" width="400" height="200">
  Seu navegador não suporta Canvas.
</canvas>

<script>
  const canvas = document.getElementById('meu-canvas');
  const ctx = canvas.getContext('2d');

  // Retângulo preenchido
  ctx.fillStyle = '#3498db';
  ctx.fillRect(10, 10, 150, 80);

  // Retângulo com borda
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 3;
  ctx.strokeRect(180, 10, 150, 80);

  // Texto
  ctx.fillStyle = '#2c3e50';
  ctx.font = '20px Arial';
  ctx.fillText('Olá, Canvas!', 10, 140);

  // Círculo
  ctx.beginPath();
  ctx.arc(300, 140, 40, 0, Math.PI * 2);
  ctx.fillStyle = '#2ecc71';
  ctx.fill();
</script>
\`\`\`

### Desenhando linhas e caminhos

\`\`\`html
<script>
  const ctx = document.getElementById('meu-canvas').getContext('2d');

  // Triângulo
  ctx.beginPath();
  ctx.moveTo(200, 10);   // Ponto inicial
  ctx.lineTo(150, 90);   // Linha até
  ctx.lineTo(250, 90);   // Linha até
  ctx.closePath();        // Fecha o caminho
  ctx.fillStyle = '#f39c12';
  ctx.fill();
  ctx.stroke();
</script>
\`\`\`

## SVG vs Canvas: quando usar cada um?

| Critério | SVG | Canvas |
|----------|-----|--------|
| Tipo | Vetorial (XML) | Raster (pixels) |
| Escalabilidade | Perfeita | Perde qualidade |
| Interatividade | Cada elemento é acessível no DOM | Apenas o canvas inteiro |
| Performance | Bom para poucos elementos | Bom para muitos elementos |
| Acessibilidade | Boa (texto, title, desc) | Limitada |
| Casos de uso | Ícones, logos, gráficos simples, mapas | Jogos, gráficos complexos, edição de imagem |

## Acessibilidade em SVG

\`\`\`html
<svg role="img" aria-labelledby="titulo-svg desc-svg" width="100" height="100">
  <title id="titulo-svg">Gráfico de vendas</title>
  <desc id="desc-svg">Gráfico de barras mostrando vendas mensais de janeiro a junho.</desc>
  <!-- conteúdo do gráfico -->
</svg>
\`\`\`

Para Canvas, use \`aria-label\` ou conteúdo de fallback dentro da tag:

\`\`\`html
<canvas id="grafico" width="400" height="200" role="img" aria-label="Gráfico de vendas mensais">
  <p>Vendas: Jan 100, Fev 150, Mar 200, Abr 180, Mai 220, Jun 250.</p>
</canvas>
\`\`\``,
            },
          },
          {
            title: 'Exercício: Página com recursos modernos',
            contentType: 'exercise' as const,
            order: 4,
            content: {
              language: 'html' as const,
              problem: 'Crie uma página que demonstre recursos modernos do HTML5. A página deve conter: um botão que abre um `<dialog>` modal de confirmação, uma barra `<progress>` simulando um download, um SVG inline com pelo menos duas formas geométricas, e um FAQ usando `<details>` com atributo `name` para criar acordeão exclusivo. Use atributos `data-*` nos elementos do FAQ.',
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recursos Modernos do HTML5</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    button { padding: 8px 16px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Recursos Modernos do HTML5</h1>

  <!-- TODO: Seção com dialog modal -->
  <section>
    <h2>Dialog Modal</h2>
  </section>

  <!-- TODO: Seção com progress -->
  <section>
    <h2>Barra de Progresso</h2>
  </section>

  <!-- TODO: Seção com SVG inline -->
  <section>
    <h2>SVG Inline</h2>
  </section>

  <!-- TODO: Seção com details/summary acordeão -->
  <section>
    <h2>FAQ (Acordeão)</h2>
  </section>

</body>
</html>`,
              hints: [
                'Use dialog.showModal() para abrir o modal e <form method="dialog"> para fechá-lo.',
                'Para o progress, use setInterval para simular um download incrementando o valor.',
                'No SVG, use viewBox e formas como <circle>, <rect>, <text>.',
                'Para o acordeão exclusivo, adicione o atributo name com o mesmo valor em todos os <details>.',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recursos Modernos do HTML5</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    button { padding: 8px 16px; cursor: pointer; }
    dialog { border-radius: 8px; border: 1px solid #ccc; padding: 20px; max-width: 400px; }
    dialog::backdrop { background-color: rgba(0, 0, 0, 0.5); }
    progress { width: 100%; height: 24px; }
    details { margin-bottom: 8px; }
    summary { cursor: pointer; padding: 10px; background: #f0f0f0; border-radius: 4px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Recursos Modernos do HTML5</h1>

  <!-- Dialog Modal -->
  <section>
    <h2>Dialog Modal</h2>
    <p>Clique no botão para abrir uma janela de confirmação:</p>
    <button id="btn-abrir">Excluir Item</button>

    <dialog id="modal-confirmar">
      <h3>Confirmar exclusão</h3>
      <p>Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.</p>
      <form method="dialog">
        <button value="cancelar">Cancelar</button>
        <button value="confirmar">Confirmar</button>
      </form>
    </dialog>

    <p id="resultado-dialog"></p>

    <script>
      const dialog = document.getElementById('modal-confirmar');
      const btnAbrir = document.getElementById('btn-abrir');
      const resultado = document.getElementById('resultado-dialog');

      btnAbrir.addEventListener('click', () => {
        dialog.showModal();
      });

      dialog.addEventListener('close', () => {
        if (dialog.returnValue === 'confirmar') {
          resultado.textContent = 'Item excluído com sucesso!';
        } else {
          resultado.textContent = 'Ação cancelada.';
        }
      });
    </script>
  </section>

  <!-- Barra de Progresso -->
  <section>
    <h2>Barra de Progresso</h2>
    <label for="download-progress">Download:</label>
    <progress id="download-progress" value="0" max="100">0%</progress>
    <p id="download-status">0% concluído</p>
    <button id="btn-download">Iniciar Download</button>

    <script>
      const progress = document.getElementById('download-progress');
      const status = document.getElementById('download-status');
      const btnDownload = document.getElementById('btn-download');

      btnDownload.addEventListener('click', () => {
        let valor = 0;
        btnDownload.disabled = true;
        const intervalo = setInterval(() => {
          valor += 5;
          progress.value = valor;
          status.textContent = valor + '% concluído';
          if (valor >= 100) {
            clearInterval(intervalo);
            status.textContent = 'Download concluído!';
            btnDownload.disabled = false;
          }
        }, 200);
      });
    </script>
  </section>

  <!-- SVG Inline -->
  <section>
    <h2>SVG Inline</h2>
    <svg width="300" height="150" viewBox="0 0 300 150" role="img" aria-labelledby="svg-titulo">
      <title id="svg-titulo">Formas geométricas coloridas</title>
      <rect x="10" y="10" width="100" height="60" fill="#3498db" rx="8" />
      <circle cx="200" cy="40" r="35" fill="#e74c3c" />
      <polygon points="260,10 290,70 230,70" fill="#2ecc71" />
      <text x="150" y="130" text-anchor="middle" font-size="16" fill="#2c3e50">
        Retângulo, Círculo e Triângulo
      </text>
    </svg>
  </section>

  <!-- FAQ com Acordeão -->
  <section>
    <h2>FAQ (Acordeão)</h2>

    <details name="faq" data-category="geral" data-id="1">
      <summary>O que é HTML5?</summary>
      <p>HTML5 é a versão mais recente da linguagem de marcação HTML. Ela introduziu novos elementos semânticos, APIs JavaScript e melhor suporte a multimídia.</p>
    </details>

    <details name="faq" data-category="aprendizado" data-id="2">
      <summary>Preciso saber JavaScript para usar HTML5?</summary>
      <p>Não para a maioria dos recursos. Elementos como &lt;details&gt;, &lt;progress&gt; e tags semânticas funcionam sem JavaScript. Porém, &lt;dialog&gt; e &lt;canvas&gt; requerem JS para funcionalidade completa.</p>
    </details>

    <details name="faq" data-category="compatibilidade" data-id="3">
      <summary>Todos os navegadores suportam HTML5?</summary>
      <p>Todos os navegadores modernos (Chrome, Firefox, Safari, Edge) suportam a grande maioria dos recursos do HTML5. Para navegadores antigos, pode ser necessário usar polyfills.</p>
    </details>

    <details name="faq" data-category="geral" data-id="4">
      <summary>Qual a diferença entre SVG e Canvas?</summary>
      <p>SVG é vetorial e declarativo (cada forma é um elemento no DOM), ideal para ícones e gráficos simples. Canvas é baseado em pixels e imperativo (desenho via JavaScript), ideal para jogos e gráficos complexos.</p>
    </details>
  </section>

</body>
</html>`,
            },
          },
          {
            title: 'Quiz: HTML5 moderno',
            contentType: 'quiz' as const,
            order: 5,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual atributo HTML5 permite armazenar dados personalizados em qualquer elemento?',
                  options: ['custom-*', 'data-*', 'attr-*', 'info-*'],
                  correctAnswer: 1,
                  explanation: 'Os atributos data-* permitem armazenar dados personalizados em elementos HTML. Eles são acessíveis via JavaScript usando element.dataset.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'O elemento <dialog> com showModal() bloqueia a interação com o restante da página.',
                  correctAnswer: true,
                  explanation: 'showModal() abre o dialog como modal: o foco fica preso dentro dele, um backdrop escurece a página, e a interação com outros elementos é bloqueada até fechá-lo.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Qual é a diferença principal entre <progress> e <meter>?',
                  options: [
                    '<progress> é para números e <meter> para texto',
                    '<progress> indica andamento de uma tarefa e <meter> representa uma medição estática',
                    '<meter> funciona sem JavaScript e <progress> não',
                    'Não há diferença, são sinônimos',
                  ],
                  correctAnswer: 1,
                  explanation: '<progress> representa o andamento de uma tarefa (download, upload). <meter> representa uma medição estática dentro de um intervalo conhecido (nota, uso de disco, temperatura).',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Como acessar o atributo data-item-id de um elemento via JavaScript?',
                  options: [
                    'element.data.itemId',
                    'element.getAttribute("item-id")',
                    'element.dataset.itemId',
                    'element.dataItemId',
                  ],
                  correctAnswer: 2,
                  explanation: 'Atributos data-* são acessados via element.dataset, e os hífens são convertidos em camelCase: data-item-id → dataset.itemId.',
                },
                {
                  id: 'q5',
                  type: 'true_false',
                  question: 'SVG inline pode ser estilizado com CSS, enquanto SVG via tag <img> não pode.',
                  correctAnswer: true,
                  explanation: 'Quando o SVG está inline (código SVG diretamente no HTML), seus elementos fazem parte do DOM e podem ser estilizados com CSS. Quando carregado via <img>, é tratado como imagem externa e não pode ser estilizado com CSS da página.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Boas práticas e padrões',
        slug: 'boas-praticas-e-padroes',
        description: 'Aprender convenções de código e validação de HTML.',
        type: 'text' as const,
        isFree: false,
        order: 2,
        sections: [
          {
            title: 'Seguir convenções de código',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Convenções de Código HTML

## Por que seguir convenções?

Seguir convenções de código torna seu HTML **mais legível**, **mais fácil de manter** e facilita o trabalho em equipe. Código consistente reduz erros e acelera o desenvolvimento.

## Indentação

Use **2 espaços** ou **4 espaços** para indentação (escolha um padrão e mantenha). A maioria dos projetos modernos usa 2 espaços:

\`\`\`html
<!-- Bom: indentação consistente com 2 espaços -->
<main>
  <section>
    <h2>Título</h2>
    <p>Parágrafo de texto.</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  </section>
</main>

<!-- Ruim: indentação inconsistente -->
<main>
<section>
      <h2>Título</h2>
  <p>Parágrafo de texto.</p>
        <ul>
    <li>Item 1</li>
      <li>Item 2</li>
  </ul>
</section>
</main>
\`\`\`

**Dica:** Configure seu editor para usar indentação automática. No VS Code, adicione ao settings.json:

\`\`\`html
<!-- Configuração do VS Code (settings.json): -->
<!-- "editor.tabSize": 2 -->
<!-- "editor.insertSpaces": true -->
<!-- "editor.formatOnSave": true -->
\`\`\`

## Nomeação de classes e IDs

Use **kebab-case** (palavras separadas por hífens) para classes e IDs:

\`\`\`html
<!-- Bom: kebab-case -->
<div class="card-produto">
  <h3 id="titulo-principal">Produto</h3>
</div>

<!-- Evite: camelCase, snake_case ou nomes genéricos -->
<div class="cardProduto">...</div>
<div class="card_produto">...</div>
<div class="div1">...</div>
\`\`\`

**Boas práticas de nomeação:**
- Nomes **descritivos**: \`header-principal\` em vez de \`div1\`
- Nomes **em inglês** ou **em português**, mas seja consistente
- Evite nomes baseados em aparência: \`texto-vermelho\` → prefira \`mensagem-erro\`

## Comentários

Use comentários para marcar seções e explicar decisões não óbvias:

\`\`\`html
<!-- Cabeçalho do site -->
<header>
  <h1>Meu Site</h1>
  <nav>...</nav>
</header>

<!-- Conteúdo principal -->
<main>
  <!-- Lista de produtos (carregada via API) -->
  <section id="produtos">
    ...
  </section>
</main>
<!-- /Conteúdo principal -->

<!-- Rodapé -->
<footer>
  ...
</footer>
\`\`\`

**Quando comentar:**
- Início e fim de seções grandes
- Decisões técnicas não óbvias
- TODOs e pendências

**Quando NÃO comentar:**
- O óbvio: \`<!-- Este é um parágrafo -->\` antes de \`<p>\`

## Organização de arquivos

Para projetos com múltiplas páginas, organize assim:

\`\`\`html
<!-- Estrutura recomendada de pastas -->
<!--
projeto/
├── index.html
├── sobre.html
├── contato.html
├── css/
│   ├── style.css
│   └── reset.css
├── js/
│   └── main.js
├── img/
│   ├── logo.svg
│   └── hero.jpg
└── fonts/
    └── minha-fonte.woff2
-->
\`\`\`

## Outras convenções

### Sempre use aspas duplas para atributos

\`\`\`html
<!-- Bom -->
<a href="https://exemplo.com" class="link-externo">Link</a>

<!-- Evite -->
<a href='https://exemplo.com' class='link-externo'>Link</a>
\`\`\`

### Sempre inclua o atributo \`alt\` em imagens

\`\`\`html
<img src="foto.jpg" alt="Descrição da imagem">
<img src="decoracao.png" alt="">  <!-- Imagem decorativa -->
\`\`\`

### Feche todas as tags (inclusive auto-fechantes)

\`\`\`html
<!-- HTML5 aceita ambos, mas seja consistente -->
<img src="foto.jpg" alt="Foto">
<br>
<hr>

<!-- Ou com barra (estilo XHTML, opcional) -->
<img src="foto.jpg" alt="Foto" />
<br />
\`\`\`

### Use letras minúsculas para tags e atributos

\`\`\`html
<!-- Bom -->
<section class="destaque">
  <h2>Título</h2>
</section>

<!-- Evite -->
<SECTION CLASS="destaque">
  <H2>Título</H2>
</SECTION>
\`\`\``,
            },
          },
          {
            title: 'Validar HTML',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Validação de HTML

## Por que validar HTML?

HTML inválido pode causar:
- **Renderização inconsistente** entre navegadores
- **Problemas de acessibilidade** (leitores de tela dependem de HTML válido)
- **Prejuízo ao SEO** (buscadores preferem páginas bem estruturadas)
- **Bugs difíceis de diagnosticar** em CSS e JavaScript

## O W3C Validator

O **W3C Markup Validation Service** é a ferramenta oficial para validar HTML:

- **URL:** https://validator.w3.org/
- Aceita URL, upload de arquivo ou código colado diretamente
- Identifica **erros** (problemas sérios) e **avisos** (melhorias recomendadas)

## Erros comuns de HTML

### 1. Falta do DOCTYPE

\`\`\`html
<!-- ERRADO: sem DOCTYPE -->
<html>
<head>
  <title>Página</title>
</head>

<!-- CORRETO -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <title>Página</title>
</head>
\`\`\`

Sem o DOCTYPE, o navegador entra em **quirks mode**, renderizando a página de forma imprevisível.

### 2. Tags não fechadas

\`\`\`html
<!-- ERRADO: p e li não fechados -->
<p>Primeiro parágrafo
<p>Segundo parágrafo

<ul>
  <li>Item 1
  <li>Item 2
</ul>

<!-- CORRETO -->
<p>Primeiro parágrafo</p>
<p>Segundo parágrafo</p>

<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
\`\`\`

### 3. Tags aninhadas incorretamente

\`\`\`html
<!-- ERRADO: fechamento em ordem errada -->
<p>Texto <strong>em <em>negrito e itálico</strong></em></p>

<!-- CORRETO: LIFO (último a abrir, primeiro a fechar) -->
<p>Texto <strong>em <em>negrito e itálico</em></strong></p>
\`\`\`

### 4. Elementos em contexto errado

\`\`\`html
<!-- ERRADO: div dentro de p -->
<p>
  Texto do parágrafo
  <div>Conteúdo em bloco</div>
</p>

<!-- CORRETO -->
<p>Texto do parágrafo</p>
<div>Conteúdo em bloco</div>

<!-- ERRADO: elementos interativos aninhados -->
<a href="/link">
  <button>Clique</button>
</a>

<!-- CORRETO: use um ou outro -->
<a href="/link">Clique</a>
<!-- ou -->
<button onclick="location.href='/link'">Clique</button>
\`\`\`

### 5. IDs duplicados

\`\`\`html
<!-- ERRADO: mesmo ID duas vezes -->
<div id="menu">Menu principal</div>
<div id="menu">Menu secundário</div>

<!-- CORRETO: IDs únicos -->
<div id="menu-principal">Menu principal</div>
<div id="menu-secundario">Menu secundário</div>
\`\`\`

### 6. Atributos faltando

\`\`\`html
<!-- ERRADO: img sem alt -->
<img src="foto.jpg">

<!-- ERRADO: html sem lang -->
<html>

<!-- CORRETO -->
<img src="foto.jpg" alt="Descrição da foto">
<html lang="pt-BR">
\`\`\`

## Ferramentas de validação

| Ferramenta | Tipo | URL |
|------------|------|-----|
| W3C Validator | Online | https://validator.w3.org/ |
| Nu HTML Checker | Online | https://validator.w3.org/nu/ |
| HTMLHint | Extensão/CLI | https://htmlhint.com/ |
| VS Code | Extensão | W3C Web Validator (extensão) |

## Validação no fluxo de trabalho

Integre a validação ao seu processo de desenvolvimento:

1. **Durante o código:** Use extensões do editor (HTMLHint, W3C Validator)
2. **Antes de publicar:** Valide com o W3C Validator
3. **Automaticamente:** Configure linters no pipeline de CI/CD

## Checklist de validação

- [ ] DOCTYPE declarado
- [ ] Atributo \`lang\` no \`<html>\`
- [ ] \`<meta charset="UTF-8">\` presente
- [ ] \`<title>\` definido e descritivo
- [ ] Todas as tags abertas estão fechadas
- [ ] Aninhamento correto (sem sobreposição)
- [ ] IDs são únicos na página
- [ ] Todas as imagens têm atributo \`alt\`
- [ ] Links têm \`href\` válido
- [ ] Hierarquia de títulos é lógica (h1 → h2 → h3)`,
            },
          },
          {
            title: 'Exercício: Validar e corrigir HTML',
            contentType: 'exercise' as const,
            order: 3,
            content: {
              language: 'html' as const,
              problem: 'O código abaixo contém **pelo menos 10 erros de HTML**. Encontre e corrija todos os problemas. Dica: use o W3C Validator (https://validator.w3.org/) para identificar os erros. Os erros incluem: falta de DOCTYPE, lang ausente, tags não fechadas, aninhamento incorreto, IDs duplicados, img sem alt, elementos em contexto errado e mais.',
              starterCode: `<html>
<head>
  <title>Minha Página
</head>
<body>
  <h1>Bem-vindo ao meu site</h3>

  <p>Este é um parágrafo com <strong>texto em <em>negrito e itálico</strong></em>.</p>

  <img src="foto.jpg">

  <div id="destaque">
    <p>Conteúdo em destaque</p>
  </div>

  <div id="destaque">
    <p>Outro conteúdo em destaque</p>
  </div>

  <p>
    Confira nossos produtos:
    <div class="produtos">
      <span>Produto 1</span>
    </div>
  </p>

  <ul>
    <li>Item 1
    <li>Item 2
    <li>Item 3
  </ul>

  <a href="/pagina">
    <button>Clique aqui</button>
  </a>

  <label>Nome:</label>
  <input type="text">

</body>
</html>`,
              hints: [
                'A primeira linha deve ser <!DOCTYPE html>.',
                'O elemento <html> precisa do atributo lang.',
                'A tag <title> não está fechada.',
                'O <h1> está sendo fechado com </h3> — use </h1>.',
                'As tags <strong> e <em> estão sobrepostas — corrija a ordem de fechamento.',
                'A <img> precisa do atributo alt.',
                'Não pode haver dois elementos com o mesmo id.',
                '<div> não pode estar dentro de <p>.',
                'As tags <li> precisam ser fechadas.',
                '<button> não deve estar dentro de <a>.',
                'O <label> precisa do atributo for associado ao id do input.',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Minha Página</title>
</head>
<body>
  <h1>Bem-vindo ao meu site</h1>

  <p>Este é um parágrafo com <strong>texto em <em>negrito e itálico</em></strong>.</p>

  <img src="foto.jpg" alt="Foto ilustrativa do site">

  <div id="destaque-principal">
    <p>Conteúdo em destaque</p>
  </div>

  <div id="destaque-secundario">
    <p>Outro conteúdo em destaque</p>
  </div>

  <p>Confira nossos produtos:</p>
  <div class="produtos">
    <span>Produto 1</span>
  </div>

  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>

  <a href="/pagina">Clique aqui</a>

  <label for="nome">Nome:</label>
  <input type="text" id="nome" name="nome">

</body>
</html>`,
            },
          },
          {
            title: 'Quiz: Boas práticas',
            contentType: 'quiz' as const,
            order: 4,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual convenção de nomeação é recomendada para classes e IDs em HTML?',
                  options: ['camelCase (cardProduto)', 'snake_case (card_produto)', 'kebab-case (card-produto)', 'PascalCase (CardProduto)'],
                  correctAnswer: 2,
                  explanation: 'A convenção kebab-case (palavras separadas por hífens, em minúsculas) é a mais utilizada e recomendada para classes e IDs em HTML/CSS.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'Se o DOCTYPE não for declarado, o navegador entra em "quirks mode" e pode renderizar a página de forma inconsistente.',
                  correctAnswer: true,
                  explanation: 'Sem o DOCTYPE, o navegador ativa o "quirks mode" para compatibilidade com páginas antigas, o que causa renderização imprevisível e inconsistente entre navegadores.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Qual destes é um erro de HTML válido?',
                  options: [
                    'Usar <br> sem barra de fechamento',
                    'Ter dois elementos com o mesmo id',
                    'Usar <div> dentro de <section>',
                    'Usar class com múltiplos valores',
                  ],
                  correctAnswer: 1,
                  explanation: 'IDs devem ser únicos em toda a página. Ter dois elementos com o mesmo id é um erro de HTML que pode causar problemas com JavaScript e acessibilidade.',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Qual ferramenta é a oficial para validar HTML?',
                  options: ['ESLint', 'Prettier', 'W3C Markup Validation Service', 'Lighthouse'],
                  correctAnswer: 2,
                  explanation: 'O W3C Markup Validation Service (validator.w3.org) é a ferramenta oficial do W3C para validar documentos HTML. ESLint é para JavaScript, Prettier é um formatador, e Lighthouse avalia performance e acessibilidade.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Projeto final: Site pessoal',
        slug: 'projeto-final-site-pessoal',
        description: 'Aplicar todos os conhecimentos do curso na criação de um site pessoal completo com múltiplas páginas.',
        type: 'text' as const,
        isFree: false,
        order: 3,
        sections: [
          {
            title: 'Planejar o projeto',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Planejamento do Projeto Final

## Visão geral

Neste projeto final, você vai criar um **site pessoal/portfólio** com 3 páginas HTML, aplicando **tudo** o que aprendeu nos 6 módulos do curso:

1. **index.html** — Página inicial com hero, sobre e rodapé
2. **projetos.html** — Galeria de projetos com cards
3. **contato.html** — Formulário de contato completo

## Wireframe simplificado

### Página Inicial (index.html)
\`\`\`html
<!--
┌─────────────────────────────────────┐
│  HEADER (logo + nav)                │
├─────────────────────────────────────┤
│  HERO SECTION                       │
│  (nome, título, CTA)               │
├─────────────────────────────────────┤
│  SEÇÃO SOBRE                        │
│  (foto, bio, habilidades)          │
├─────────────────────────────────────┤
│  FOOTER (copyright + links)         │
└─────────────────────────────────────┘
-->
\`\`\`

### Página de Projetos (projetos.html)
\`\`\`html
<!--
┌─────────────────────────────────────┐
│  HEADER (logo + nav)                │
├─────────────────────────────────────┤
│  TÍTULO DA PÁGINA                   │
├────────┬────────┬───────────────────┤
│ CARD 1 │ CARD 2 │ CARD 3           │
│ figure │ figure │ figure            │
│ h3     │ h3     │ h3               │
│ p      │ p      │ p                │
│ link   │ link   │ link             │
├────────┴────────┴───────────────────┤
│  FOOTER                             │
└─────────────────────────────────────┘
-->
\`\`\`

### Página de Contato (contato.html)
\`\`\`html
<!--
┌─────────────────────────────────────┐
│  HEADER (logo + nav)                │
├─────────────────────────────────────┤
│  FORMULÁRIO DE CONTATO              │
│  (fieldset: dados pessoais)        │
│  (fieldset: mensagem)              │
│  (botão enviar)                    │
├─────────────────────────────────────┤
│  FOOTER                             │
└─────────────────────────────────────┘
-->
\`\`\`

## Checklist de requisitos

### Módulo 1 — Fundamentos
- [ ] DOCTYPE, html, head, body corretos
- [ ] Meta charset e viewport
- [ ] Tag title descritiva em cada página
- [ ] Parágrafos, títulos, listas

### Módulo 2 — Textos e Links
- [ ] Hierarquia correta de headings (h1 → h2 → h3)
- [ ] Links de navegação entre as páginas
- [ ] Links externos com target="_blank"
- [ ] Formatação de texto (strong, em)

### Módulo 3 — Mídias e Tabelas
- [ ] Imagens com alt descritivo
- [ ] Elemento figure/figcaption
- [ ] Tabela (pode ser de habilidades/tecnologias)

### Módulo 4 — Formulários
- [ ] Formulário completo na página de contato
- [ ] Labels associados a inputs
- [ ] Fieldsets e legends
- [ ] Validação nativa (required, type, pattern)

### Módulo 5 — Semântica e Acessibilidade
- [ ] Tags semânticas: header, nav, main, section, article, aside, footer
- [ ] Skip link
- [ ] ARIA onde necessário (aria-label em navs)
- [ ] Navegação por teclado funcional
- [ ] Meta tags de SEO e Open Graph

### Módulo 6 — Recursos Avançados
- [ ] Dados estruturados JSON-LD
- [ ] HTML válido (W3C Validator)
- [ ] Convenções de código seguidas
- [ ] Código limpo e bem comentado

## Estrutura de arquivos

\`\`\`html
<!--
meu-portfolio/
├── index.html
├── projetos.html
├── contato.html
└── img/
        ├── foto-perfil.jpg
    ├── projeto1.jpg
    ├── projeto2.jpg
    └── projeto3.jpg
-->
\`\`\`

## Dicas para começar

1. **Comece pelo HTML** — Não se preocupe com CSS agora; foque na estrutura
2. **Uma página por vez** — Comece pela index.html, depois projetos.html, depois contato.html
3. **Reutilize o header/footer** — Copie o mesmo header e footer para todas as páginas
4. **Valide frequentemente** — Use o W3C Validator a cada grande mudança
5. **Teste acessibilidade** — Navegue por Tab e use o Lighthouse

Vamos começar!`,
            },
          },
          {
            title: 'Exercício: Criar página inicial',
            contentType: 'exercise' as const,
            order: 2,
            content: {
              language: 'html' as const,
              problem: 'Crie a página inicial (index.html) do seu site pessoal. Ela deve conter: skip link, header com logo/nome e nav com links para as 3 páginas, hero section com seu nome e uma frase de apresentação, seção "Sobre mim" com imagem e biografia, seção de habilidades com uma tabela, e footer com copyright e links de redes sociais. Inclua meta tags de SEO, Open Graph e dados estruturados JSON-LD para Person.',
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meu Portfólio</title>
  <!-- TODO: Adicione meta description, OG tags e JSON-LD -->
</head>
<body>
  <!-- TODO: Skip link -->

  <!-- TODO: Header com nav -->

  <main>
    <!-- TODO: Hero section -->

    <!-- TODO: Seção Sobre Mim com imagem e bio -->

    <!-- TODO: Seção Habilidades com tabela -->
  </main>

  <!-- TODO: Footer -->

</body>
</html>`,
              hints: [
                'Use <section> para cada bloco temático dentro de <main>.',
                'Na hero section, use um <h1> com seu nome e um <p> com sua função.',
                'Na seção Sobre, use <figure> e <figcaption> para sua foto.',
                'A tabela de habilidades pode ter colunas: Tecnologia, Nível, Experiência.',
                'No JSON-LD, use @type: "Person" com name, jobTitle, url.',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>João Silva — Desenvolvedor Web | Portfólio</title>
  <meta name="description" content="Portfólio de João Silva, desenvolvedor web front-end. Conheça meus projetos, habilidades e entre em contato.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://joaosilva.dev/">

  <meta property="og:title" content="João Silva — Desenvolvedor Web">
  <meta property="og:description" content="Portfólio de João Silva, desenvolvedor web front-end.">
  <meta property="og:image" content="https://joaosilva.dev/img/og-home.jpg">
  <meta property="og:url" content="https://joaosilva.dev/">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="João Silva — Desenvolvedor Web">
  <meta name="twitter:description" content="Portfólio de João Silva, desenvolvedor web front-end.">
  <meta name="twitter:image" content="https://joaosilva.dev/img/og-home.jpg">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "João Silva",
    "jobTitle": "Desenvolvedor Web Front-End",
    "url": "https://joaosilva.dev",
    "sameAs": [
      "https://github.com/joaosilva",
      "https://linkedin.com/in/joaosilva"
    ]
  }
  </script>

  <style>
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      z-index: 100;
    }
    .skip-link:focus {
      top: 0;
    }
    *:focus-visible {
      outline: 3px solid #4A90D9;
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  <a href="#conteudo-principal" class="skip-link">Pular para o conteúdo principal</a>

  <header>
    <h1>João Silva</h1>
    <nav aria-label="Menu principal">
      <ul>
        <li><a href="index.html" aria-current="page">Início</a></li>
        <li><a href="projetos.html">Projetos</a></li>
        <li><a href="contato.html">Contato</a></li>
      </ul>
    </nav>
  </header>

  <main id="conteudo-principal">
    <section aria-label="Apresentação">
      <h2>Olá, eu sou o João!</h2>
      <p>Desenvolvedor web front-end apaixonado por criar interfaces acessíveis e performáticas.</p>
      <a href="projetos.html">Ver meus projetos</a>
      <a href="contato.html">Entre em contato</a>
    </section>

    <section>
      <h2>Sobre Mim</h2>
      <figure>
        <img src="img/foto-perfil.jpg" alt="João Silva sorrindo, usando camiseta azul, em frente a um computador" width="200" height="200">
        <figcaption>João Silva — Desenvolvedor Web</figcaption>
      </figure>
      <p>Sou desenvolvedor web com 3 anos de experiência em criação de sites e aplicações front-end. Tenho paixão por HTML semântico, acessibilidade e boas práticas de desenvolvimento.</p>
      <p>Atualmente estudo React e TypeScript, e busco contribuir para projetos open source. Quando não estou programando, gosto de ler sobre design e tecnologia.</p>
    </section>

    <section>
      <h2>Habilidades</h2>
      <table>
        <caption>Minhas principais habilidades técnicas</caption>
        <thead>
          <tr>
            <th scope="col">Tecnologia</th>
            <th scope="col">Nível</th>
            <th scope="col">Experiência</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>HTML5</td>
            <td>Avançado</td>
            <td>3 anos</td>
          </tr>
          <tr>
            <td>CSS3</td>
            <td>Avançado</td>
            <td>3 anos</td>
          </tr>
          <tr>
            <td>JavaScript</td>
            <td>Intermediário</td>
            <td>2 anos</td>
          </tr>
          <tr>
            <td>React</td>
            <td>Iniciante</td>
            <td>6 meses</td>
          </tr>
          <tr>
            <td>Git</td>
            <td>Intermediário</td>
            <td>2 anos</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>

  <footer>
    <p>&copy; 2025 João Silva. Todos os direitos reservados.</p>
    <nav aria-label="Redes sociais">
      <ul>
        <li><a href="https://github.com/joaosilva" target="_blank" rel="noopener noreferrer">GitHub</a></li>
        <li><a href="https://linkedin.com/in/joaosilva" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
      </ul>
    </nav>
  </footer>
</body>
</html>`,
            },
          },
          {
            title: 'Exercício: Criar página de projetos',
            contentType: 'exercise' as const,
            order: 3,
            content: {
              language: 'html' as const,
              problem: 'Crie a página de projetos (projetos.html). Ela deve conter o mesmo header/footer da página inicial, um título de página, e pelo menos 3 cards de projetos. Cada card deve usar `<article>` com `<figure>`, `<figcaption>`, título, descrição, tecnologias usadas e link para o projeto. Use atributos `data-*` para categorizar os projetos.',
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Projetos — João Silva</title>
  <meta name="description" content="Conheça os projetos desenvolvidos por João Silva.">
  <style>
    .skip-link { position: absolute; top: -40px; left: 0; background: #000; color: #fff; padding: 8px; z-index: 100; }
    .skip-link:focus { top: 0; }
    *:focus-visible { outline: 3px solid #4A90D9; outline-offset: 2px; }
  </style>
</head>
<body>
  <a href="#conteudo-principal" class="skip-link">Pular para o conteúdo principal</a>

  <!-- TODO: Header com nav (mesmo da index.html) -->

  <main id="conteudo-principal">
    <h1>Meus Projetos</h1>

    <!-- TODO: Section com 3 articles de projetos -->
    <!-- Cada article deve ter: figure com img e figcaption, h2, p, lista de tecnologias, link -->
    <!-- Use data-category e data-year nos articles -->

  </main>

  <!-- TODO: Footer (mesmo da index.html) -->

</body>
</html>`,
              hints: [
                'Use <article> para cada card — projetos são conteúdos independentes.',
                'Use <figure> com <img> e <figcaption> para a imagem do projeto.',
                'Liste as tecnologias usadas com <ul> dentro de cada card.',
                'Adicione data-category="frontend" e data-year="2025" nos articles.',
                'Links externos devem ter target="_blank" e rel="noopener noreferrer".',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Projetos — João Silva | Portfólio</title>
  <meta name="description" content="Conheça os projetos de desenvolvimento web criados por João Silva, incluindo sites, aplicações e ferramentas.">
  <style>
    .skip-link { position: absolute; top: -40px; left: 0; background: #000; color: #fff; padding: 8px; z-index: 100; }
    .skip-link:focus { top: 0; }
    *:focus-visible { outline: 3px solid #4A90D9; outline-offset: 2px; }
  </style>
</head>
<body>
  <a href="#conteudo-principal" class="skip-link">Pular para o conteúdo principal</a>

  <header>
    <p><a href="index.html">João Silva</a></p>
    <nav aria-label="Menu principal">
      <ul>
        <li><a href="index.html">Início</a></li>
        <li><a href="projetos.html" aria-current="page">Projetos</a></li>
        <li><a href="contato.html">Contato</a></li>
      </ul>
    </nav>
  </header>

  <main id="conteudo-principal">
    <h1>Meus Projetos</h1>
    <p>Aqui estão alguns dos projetos que desenvolvi. Cada um me ensinou algo novo sobre desenvolvimento web.</p>

    <section aria-label="Lista de projetos">
      <article data-category="frontend" data-year="2025">
        <figure>
          <img src="img/projeto1.jpg" alt="Captura de tela do site de receitas mostrando a página inicial com cards de receitas" width="400" height="250">
          <figcaption>Site de Receitas — Página inicial</figcaption>
        </figure>
        <h2>Site de Receitas</h2>
        <p>Site responsivo com receitas culinárias organizadas por categoria. Utiliza HTML semântico e formulário de busca.</p>
        <h3>Tecnologias utilizadas:</h3>
        <ul>
          <li>HTML5</li>
          <li>CSS3</li>
          <li>JavaScript</li>
        </ul>
        <p><a href="https://github.com/joaosilva/receitas" target="_blank" rel="noopener noreferrer">Ver no GitHub</a></p>
      </article>

      <article data-category="frontend" data-year="2024">
        <figure>
          <img src="img/projeto2.jpg" alt="Captura de tela do dashboard de tarefas com lista de itens e filtros" width="400" height="250">
          <figcaption>Gerenciador de Tarefas — Dashboard</figcaption>
        </figure>
        <h2>Gerenciador de Tarefas</h2>
        <p>Aplicação para organizar tarefas do dia a dia com funcionalidades de adicionar, editar, excluir e filtrar por status.</p>
        <h3>Tecnologias utilizadas:</h3>
        <ul>
          <li>HTML5</li>
          <li>CSS3</li>
          <li>JavaScript</li>
          <li>LocalStorage</li>
        </ul>
        <p><a href="https://github.com/joaosilva/tarefas" target="_blank" rel="noopener noreferrer">Ver no GitHub</a></p>
      </article>

      <article data-category="landing-page" data-year="2024">
        <figure>
          <img src="img/projeto3.jpg" alt="Captura de tela da landing page de produto com hero section e depoimentos" width="400" height="250">
          <figcaption>Landing Page — Produto Digital</figcaption>
        </figure>
        <h2>Landing Page de Produto</h2>
        <p>Página de apresentação de um produto digital com seções de benefícios, depoimentos e formulário de captura de e-mail.</p>
        <h3>Tecnologias utilizadas:</h3>
        <ul>
          <li>HTML5</li>
          <li>CSS3</li>
        </ul>
        <p><a href="https://github.com/joaosilva/landing-page" target="_blank" rel="noopener noreferrer">Ver no GitHub</a></p>
      </article>
    </section>
  </main>

  <footer>
    <p>&copy; 2025 João Silva. Todos os direitos reservados.</p>
    <nav aria-label="Redes sociais">
      <ul>
        <li><a href="https://github.com/joaosilva" target="_blank" rel="noopener noreferrer">GitHub</a></li>
        <li><a href="https://linkedin.com/in/joaosilva" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
      </ul>
    </nav>
  </footer>
</body>
</html>`,
            },
          },
          {
            title: 'Exercício: Criar página de contato',
            contentType: 'exercise' as const,
            order: 4,
            content: {
              language: 'html' as const,
              problem: 'Crie a página de contato (contato.html). Ela deve conter o mesmo header/footer, um formulário completo com dois fieldsets (dados pessoais e mensagem), validação nativa HTML, labels acessíveis, aria-describedby para dicas, e um select de assunto. Use todos os recursos de acessibilidade que aprendemos.',
              starterCode: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contato — João Silva</title>
  <meta name="description" content="Entre em contato com João Silva para projetos, parcerias ou dúvidas.">
  <style>
    .skip-link { position: absolute; top: -40px; left: 0; background: #000; color: #fff; padding: 8px; z-index: 100; }
    .skip-link:focus { top: 0; }
    *:focus-visible { outline: 3px solid #4A90D9; outline-offset: 2px; }
  </style>
</head>
<body>
  <a href="#conteudo-principal" class="skip-link">Pular para o conteúdo principal</a>

  <!-- TODO: Header com nav -->

  <main id="conteudo-principal">
    <h1>Entre em Contato</h1>

    <!-- TODO: Formulário com dois fieldsets -->
    <!-- Fieldset 1: Dados pessoais (nome, email, telefone) -->
    <!-- Fieldset 2: Mensagem (assunto via select, mensagem via textarea) -->
    <!-- Todos os campos devem ter label, validação e aria-describedby quando necessário -->

  </main>

  <!-- TODO: Footer -->

</body>
</html>`,
              hints: [
                'Use <fieldset> e <legend> para agrupar campos relacionados.',
                'Cada <input> deve ter um <label for="..."> associado.',
                'Use aria-describedby para dicas de preenchimento.',
                'O campo de telefone pode usar pattern para validar formato.',
                'Adicione required nos campos obrigatórios.',
                'Use <select> para o assunto com opções predefinidas.',
              ],
              solution: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contato — João Silva | Portfólio</title>
  <meta name="description" content="Entre em contato com João Silva para projetos de desenvolvimento web, parcerias ou dúvidas.">
  <style>
    .skip-link { position: absolute; top: -40px; left: 0; background: #000; color: #fff; padding: 8px; z-index: 100; }
    .skip-link:focus { top: 0; }
    *:focus-visible { outline: 3px solid #4A90D9; outline-offset: 2px; }
  </style>
</head>
<body>
  <a href="#conteudo-principal" class="skip-link">Pular para o conteúdo principal</a>

  <header>
    <p><a href="index.html">João Silva</a></p>
    <nav aria-label="Menu principal">
      <ul>
        <li><a href="index.html">Início</a></li>
        <li><a href="projetos.html">Projetos</a></li>
        <li><a href="contato.html" aria-current="page">Contato</a></li>
      </ul>
    </nav>
  </header>

  <main id="conteudo-principal">
    <h1>Entre em Contato</h1>
    <p>Preencha o formulário abaixo e retornarei o mais breve possível.</p>

    <form action="#" method="post" novalidate>
      <fieldset>
        <legend>Dados Pessoais</legend>

        <div>
          <label for="nome">Nome completo: <span aria-hidden="true">*</span></label>
          <input type="text" id="nome" name="nome" required autocomplete="name" aria-describedby="nome-dica" minlength="3" maxlength="100">
          <p id="nome-dica">Digite seu nome e sobrenome (mínimo 3 caracteres).</p>
        </div>

        <div>
          <label for="email">E-mail: <span aria-hidden="true">*</span></label>
          <input type="email" id="email" name="email" required autocomplete="email" aria-describedby="email-dica" placeholder="exemplo@email.com">
          <p id="email-dica">Usaremos este e-mail para responder sua mensagem.</p>
        </div>

        <div>
          <label for="telefone">Telefone:</label>
          <input type="tel" id="telefone" name="telefone" autocomplete="tel" aria-describedby="telefone-dica" pattern="\\([0-9]{2}\\) [0-9]{4,5}-[0-9]{4}" placeholder="(11) 99999-9999">
          <p id="telefone-dica">Opcional. Formato: (11) 99999-9999</p>
        </div>
      </fieldset>

      <fieldset>
        <legend>Sua Mensagem</legend>

        <div>
          <label for="assunto">Assunto: <span aria-hidden="true">*</span></label>
          <select id="assunto" name="assunto" required>
            <option value="">Selecione um assunto</option>
            <option value="projeto">Proposta de projeto</option>
            <option value="parceria">Parceria</option>
            <option value="freelance">Trabalho freelance</option>
            <option value="duvida">Dúvida</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div>
          <label for="mensagem">Mensagem: <span aria-hidden="true">*</span></label>
          <textarea id="mensagem" name="mensagem" required rows="6" minlength="20" maxlength="1000" aria-describedby="mensagem-dica" placeholder="Escreva sua mensagem aqui..."></textarea>
          <p id="mensagem-dica">Mínimo de 20 caracteres. Seja o mais detalhado possível.</p>
        </div>

        <div>
          <input type="checkbox" id="newsletter" name="newsletter" value="sim">
          <label for="newsletter">Desejo receber novidades por e-mail</label>
        </div>
      </fieldset>

      <button type="submit">Enviar Mensagem</button>

      <p><small>Campos marcados com <span aria-hidden="true">*</span><span class="sr-only">asterisco</span> são obrigatórios.</small></p>
    </form>
  </main>

  <footer>
    <p>&copy; 2025 João Silva. Todos os direitos reservados.</p>
    <nav aria-label="Redes sociais">
      <ul>
        <li><a href="https://github.com/joaosilva" target="_blank" rel="noopener noreferrer">GitHub</a></li>
        <li><a href="https://linkedin.com/in/joaosilva" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
      </ul>
    </nav>
  </footer>
</body>
</html>`,
            },
          },
          {
            title: 'Quiz: Revisão geral do curso',
            contentType: 'quiz' as const,
            order: 5,
            content: {
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual é a estrutura mínima obrigatória de um documento HTML5?',
                  options: [
                    '<!DOCTYPE html>, <html>, <head>, <body>',
                    '<html>, <head>, <title>, <body>',
                    '<!DOCTYPE html>, <html>, <head>, <title>, <body>',
                    '<!DOCTYPE html>, <html>, <body>',
                  ],
                  correctAnswer: 2,
                  explanation: 'Um documento HTML5 válido precisa de: <!DOCTYPE html> para declarar o tipo, <html> com lang, <head> com <title> (obrigatório dentro de head) e <body> para o conteúdo.',
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'A tag <strong> tem significado semântico de importância, enquanto <b> é apenas visual.',
                  correctAnswer: true,
                  explanation: '<strong> indica que o texto tem importância semântica (leitores de tela podem enfatizá-lo). <b> apenas aplica negrito visual sem significado semântico.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Qual atributo é obrigatório na tag <img>?',
                  options: ['src e width', 'src e alt', 'src e title', 'alt e width'],
                  correctAnswer: 1,
                  explanation: 'Os atributos src (caminho da imagem) e alt (texto alternativo) são obrigatórios. O alt é essencial para acessibilidade e SEO.',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  question: 'Qual atributo HTML associa um <label> a um campo de formulário?',
                  options: ['name', 'id', 'for', 'ref'],
                  correctAnswer: 2,
                  explanation: 'O atributo for do <label> deve corresponder ao id do campo. Exemplo: <label for="email"> se conecta a <input id="email">.',
                },
                {
                  id: 'q5',
                  type: 'true_false',
                  question: 'A tag <section> pode conter elementos <article>, e um <article> pode conter elementos <section>.',
                  correctAnswer: true,
                  explanation: 'Ambos os aninhamentos são válidos. Um <section> de "Blog" pode conter vários <article> de posts. Um <article> longo pode ser dividido em <section> temáticas.',
                },
                {
                  id: 'q6',
                  type: 'multiple_choice',
                  question: 'Qual é a finalidade do atributo aria-live="polite"?',
                  options: [
                    'Esconder o elemento de leitores de tela',
                    'Anunciar mudanças de conteúdo quando o leitor de tela estiver disponível',
                    'Interromper imediatamente o leitor de tela para anunciar',
                    'Definir o idioma do elemento',
                  ],
                  correctAnswer: 1,
                  explanation: 'aria-live="polite" faz com que o leitor de tela anuncie mudanças de conteúdo no elemento QUANDO terminar o que está falando, sem interromper. Para interrupção imediata, usa-se "assertive".',
                },
                {
                  id: 'q7',
                  type: 'multiple_choice',
                  question: 'Qual formato de dados estruturados é recomendado pelo Google para SEO?',
                  options: ['XML', 'Microdata', 'JSON-LD', 'CSV'],
                  correctAnswer: 2,
                  explanation: 'O Google recomenda JSON-LD (JavaScript Object Notation for Linked Data) por ser fácil de implementar, não se misturar com o HTML e ser simples de manter.',
                },
                {
                  id: 'q8',
                  type: 'true_false',
                  question: 'O elemento <dialog> com o método showModal() automaticamente prende o foco do teclado dentro do modal.',
                  correctAnswer: true,
                  explanation: 'O <dialog> nativo com showModal() implementa "focus trapping" automaticamente: o Tab fica preso dentro do dialog, e Esc fecha o modal. Isso é um grande benefício para acessibilidade.',
                },
                {
                  id: 'q9',
                  type: 'multiple_choice',
                  question: 'Qual é o problema do CSS "* { outline: none; }"?',
                  options: [
                    'Causa problemas de performance',
                    'Remove o indicador visual de foco, prejudicando a navegação por teclado',
                    'Desativa o CSS de todos os elementos',
                    'Impede o uso de bordas nos elementos',
                  ],
                  correctAnswer: 1,
                  explanation: 'Remover o outline de foco torna impossível para usuários de teclado saber qual elemento está focado. Isso é uma grave falha de acessibilidade. Se quiser personalizar, use :focus-visible em vez de remover o outline.',
                },
                {
                  id: 'q10',
                  type: 'multiple_choice',
                  question: 'Ao validar HTML no W3C Validator, qual destes NÃO é considerado um erro?',
                  options: [
                    'Dois elementos com o mesmo id',
                    'Uma <img> sem atributo alt',
                    'Usar <div> dentro de <section>',
                    'Uma tag <p> contendo uma <div>',
                  ],
                  correctAnswer: 2,
                  explanation: 'Usar <div> dentro de <section> é perfeitamente válido. Já IDs duplicados, img sem alt e <div> dentro de <p> são erros de HTML (<p> só pode conter conteúdo inline, e <div> é um elemento de bloco).',
                },
              ],
            },
          },
        ],
      },
    ],
  },,
];

/**
 * Seed the "HTML Essencial" course with all modules, lessons and sections.
 * Idempotent — skips if the course already exists.
 */
export async function seedHtmlCourse(): Promise<void> {
  const db = getDatabase();
  const now = new Date();

  // 1. Find admin user
  const adminResult = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, 'ricardo@maroquio.com'))
    .limit(1);

  if (adminResult.length === 0) {
    if (env.NODE_ENV !== 'test')
      console.log('  ⚠ Admin user not found. Run seedAdminUser first.');
    return;
  }
  const instructorId = adminResult[0]!.id;

  // 2. Create / find category "Frontend"
  let categoryId: string;
  const existingCategory = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, 'frontend'))
    .limit(1);

  if (existingCategory.length > 0) {
    categoryId = existingCategory[0]!.id;
  } else {
    categoryId = uuidv7();
    await db.insert(categoriesTable).values({
      id: categoryId,
      name: 'Frontend',
      slug: 'frontend',
      description: 'Desenvolvimento web front-end',
      createdAt: now,
      updatedAt: now,
    });
  }

  // 3. Check if course already exists
  const existingCourse = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.slug, 'html-essencial'))
    .limit(1);

  if (existingCourse.length > 0) {
    if (env.NODE_ENV !== 'test')
      console.log('  → Course "HTML Essencial" already exists');
    return;
  }

  // 4. Create course
  const courseId = uuidv7();
  await db.insert(coursesTable).values({
    id: courseId,
    title: 'HTML Essencial',
    slug: 'html-essencial',
    description:
      'Domine HTML do zero ao avançado com lições práticas e objetivas. Aprenda a estruturar páginas web semânticas, acessíveis e prontas para estilização com CSS.',
    shortDescription: 'Aprenda HTML do zero com lições práticas e objetivas',
    level: 'beginner',
    tags: ['html', 'web', 'frontend', 'semântica', 'acessibilidade', 'formulários'],
    status: 'draft',
    price: 0,
    currency: 'BRL',
    categoryId,
    instructorId,
    createdAt: now,
    updatedAt: now,
  });

  // 5. Create modules → lessons → sections
  for (const moduleData of MODULES_DATA) {
    if (!moduleData) continue;
    const moduleId = uuidv7();
    await db.insert(modulesTable).values({
      id: moduleId,
      courseId,
      title: moduleData.title,
      description: moduleData.description,
      order: moduleData.order,
      createdAt: now,
      updatedAt: now,
    });

    for (const lessonData of moduleData.lessons) {
      const lessonId = uuidv7();
      await db.insert(lessonsTable).values({
        id: lessonId,
        moduleId,
        title: lessonData.title,
        slug: lessonData.slug,
        description: lessonData.description,
        type: lessonData.type,
        isFree: lessonData.isFree,
        order: lessonData.order,
        createdAt: now,
        updatedAt: now,
      });

      for (const sectionData of lessonData.sections) {
        await db.insert(sectionsTable).values({
          id: uuidv7(),
          lessonId,
          title: sectionData.title,
          contentType: sectionData.contentType,
          content: sectionData.content,
          order: sectionData.order,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  if (env.NODE_ENV !== 'test')
    console.log('  ✓ Course "HTML Essencial" seeded with all modules, lessons and sections.');
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (import.meta.main) {
  console.log('Seeding HTML course...');
  seedHtmlCourse()
    .then(() => {
      console.log('HTML course seeded successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed HTML course:', error);
      process.exit(1);
    });
}
