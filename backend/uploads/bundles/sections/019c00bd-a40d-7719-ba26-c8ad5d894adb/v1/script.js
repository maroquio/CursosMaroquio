const table = document.getElementById('demoTable');
const info = document.getElementById('info');

const descriptions = {
  none: { title: 'Estrutura da tabela', text: 'Uma tabela HTML é composta por &lt;thead&gt; (cabeçalho), &lt;tbody&gt; (corpo) e &lt;tfoot&gt; (rodapé). Use os botões para explorar cada parte.' },
  thead: { title: '&lt;thead&gt; — Cabeçalho', text: 'Define a linha de cabeçalho com &lt;th&gt; (table header). Navegadores e leitores de tela usam o thead para entender que estas são as colunas da tabela. Aparece no topo ao imprimir cada página.' },
  tbody: { title: '&lt;tbody&gt; — Corpo', text: 'Contém as linhas de dados da tabela. Cada &lt;tr&gt; é uma linha e cada &lt;td&gt; é uma célula. Separar thead/tbody/tfoot melhora a semântica e permite estilização independente.' },
  tfoot: { title: '&lt;tfoot&gt; — Rodapé', text: 'Usado para totais, resumos ou notas. O navegador garante que o tfoot apareça no final da tabela, mesmo que seja declarado antes do tbody no HTML.' },
  colspan: { title: 'colspan — Mesclar colunas', text: '<code>colspan="4"</code> faz a célula ocupar 4 colunas. Útil para totais, títulos que abrangem múltiplas colunas, ou linhas de resumo.' },
  rowspan: { title: 'rowspan — Mesclar linhas', text: '<code>rowspan="2"</code> faz a célula ocupar 2 linhas verticalmente. Útil quando uma categoria agrupa múltiplas linhas de dados.' }
};

document.querySelectorAll('.ctrl-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ctrl-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const hl = btn.dataset.highlight;
    table.className = hl !== 'none' ? `hl-${hl}` : '';
    const desc = descriptions[hl];
    info.innerHTML = `<div class="info-title">${desc.title}</div><div class="info-text">${desc.text}</div>`;
  });
});

// Click on table cells
table.addEventListener('click', (e) => {
  const cell = e.target.closest('[data-part]');
  if (!cell) return;
  const part = cell.dataset.part;
  document.querySelectorAll('.ctrl-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.highlight === part);
  });
  table.className = `hl-${part}`;
  const desc = descriptions[part];
  if (desc) {
    info.innerHTML = `<div class="info-title">${desc.title}</div><div class="info-text">${desc.text}</div>`;
  }
});
