const info = document.getElementById('info');

const levelInfo = {
  1: { title: '&lt;h1&gt; — Título Principal', text: 'Usado uma vez por página. Representa o assunto principal. Essencial para SEO — motores de busca usam o h1 para entender o tema da página.' },
  2: { title: '&lt;h2&gt; — Seções', text: 'Divide o conteúdo em seções principais. Equivale aos capítulos de um livro. Pode haver múltiplos h2 na mesma página.' },
  3: { title: '&lt;h3&gt; — Subseções', text: 'Subdivide uma seção h2. Como subtópicos dentro de um capítulo. Nunca pule de h1 direto para h3 — mantenha a hierarquia.' },
  4: { title: '&lt;h4&gt; — Detalhes', text: 'Nível mais profundo de subdivisão. Raramente necessário, mas útil em conteúdo técnico ou documentação extensa.' }
};

document.querySelectorAll('.node-toggle').forEach(toggle => {
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle.parentElement.classList.toggle('open');
  });
});

document.querySelectorAll('.node-label').forEach(label => {
  label.addEventListener('click', (e) => {
    e.stopPropagation();
    const node = label.parentElement;
    document.querySelectorAll('.node').forEach(n => n.classList.remove('active'));
    node.classList.add('active');
    if (!node.classList.contains('leaf') && !node.classList.contains('open')) {
      node.classList.add('open');
    }
    const level = node.dataset.level;
    if (levelInfo[level]) {
      info.innerHTML = `<div class="info-title">${levelInfo[level].title}</div><div class="info-text">${levelInfo[level].text}</div>`;
    }
  });
});

// Start with h1 expanded
document.querySelector('.level-1').classList.add('open');
