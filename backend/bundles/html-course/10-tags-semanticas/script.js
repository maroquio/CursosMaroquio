const info = document.getElementById('info');
const progressText = document.getElementById('progressText');
const barFill = document.getElementById('barFill');

const tagInfo = {
  header: {
    label: '<header>',
    title: '&lt;header&gt; — Cabeçalho',
    text: 'Contém o cabeçalho da página ou seção: logo, título, barra de busca. Pode existir dentro de &lt;article&gt; e &lt;section&gt; também.'
  },
  nav: {
    label: '<nav>',
    title: '&lt;nav&gt; — Navegação',
    text: 'Agrupa links de navegação principal. Leitores de tela reconhecem &lt;nav&gt; e oferecem atalho para pular direto à navegação.'
  },
  main: {
    label: '<main>',
    title: '&lt;main&gt; — Conteúdo Principal',
    text: 'Contém o conteúdo principal da página. Deve ser único (apenas um por página). Exclui header, nav, footer e sidebar.'
  },
  article: {
    label: '<article>',
    title: '&lt;article&gt; — Artigo',
    text: 'Conteúdo independente e auto-contido: post de blog, notícia, comentário. Faz sentido isolado fora do contexto da página.'
  },
  section: {
    label: '<section>',
    title: '&lt;section&gt; — Seção',
    text: 'Agrupa conteúdo tematicamente relacionado, geralmente com um heading. Use quando o conteúdo faz parte de um todo maior.'
  },
  aside: {
    label: '<aside>',
    title: '&lt;aside&gt; — Conteúdo Lateral',
    text: 'Conteúdo tangencialmente relacionado: sidebar, widgets, links relacionados, publicidade. Complementa mas não é essencial.'
  },
  footer: {
    label: '<footer>',
    title: '&lt;footer&gt; — Rodapé',
    text: 'Rodapé da página ou seção: copyright, links de contato, mapa do site. Pode existir em &lt;article&gt; e &lt;section&gt;.'
  }
};

let revealed = new Set();

document.querySelectorAll('.area').forEach(area => {
  area.addEventListener('click', (e) => {
    e.stopPropagation();
    const tag = area.dataset.tag;
    if (!tag) return;

    area.classList.add('revealed');
    area.querySelector('.area-label').textContent = tagInfo[tag].label;
    revealed.add(tag);

    info.innerHTML = `<div class="info-title">${tagInfo[tag].title}</div><div class="info-text">${tagInfo[tag].text}</div>`;

    const count = revealed.size;
    progressText.textContent = `${count} de 7 descobertas`;
    barFill.style.width = `${(count / 7) * 100}%`;

    if (count === 7) {
      progressText.textContent = '🎉 Todas as 7 tags descobertas!';
    }
  });
});
