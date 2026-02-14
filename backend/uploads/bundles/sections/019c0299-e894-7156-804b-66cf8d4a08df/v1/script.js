const info = document.getElementById('info');
const demoPage = document.getElementById('demoPage');
let tabCount = 0;

const focusMessages = {
  'skip-link': { title: 'Skip Link', text: 'O "skip link" permite que usuários de teclado pulem direto para o conteúdo principal, sem navegar por todos os itens do menu. Aparece só ao receber foco.' },
  'dp-link': { title: 'Link de Navegação', text: 'Links no &lt;nav&gt; são naturalmente focáveis. O contorno azul (outline) indica visualmente qual elemento está selecionado. Nunca remova o outline sem substituí-lo!' },
  'dp-btn': { title: 'Botão', text: 'Botões (&lt;button&gt;) são naturalmente focáveis e ativados com Enter ou Espaço. Sempre use &lt;button&gt; em vez de &lt;div onclick&gt; para interações.' },
  'dp-input': { title: 'Campo de Formulário', text: 'Inputs são focáveis nativamente. O &lt;label&gt; associado ajuda leitores de tela a anunciar o campo. Use o atributo for= no label.' },
};

demoPage.addEventListener('focusin', (e) => {
  tabCount++;
  e.target.classList.add('focus-pulse');
  setTimeout(() => e.target.classList.remove('focus-pulse'), 400);

  let key = null;
  if (e.target.id === 'skipLink') key = 'skip-link';
  else if (e.target.classList.contains('dp-link')) key = 'dp-link';
  else if (e.target.classList.contains('dp-btn')) key = 'dp-btn';
  else if (e.target.id === 'dp-input') key = 'dp-input';

  if (key && focusMessages[key]) {
    const msg = focusMessages[key];
    info.innerHTML = `<div class="info-title">${msg.title}</div><div class="info-text">${msg.text}</div>`;
  }
});

// Prevent link/button default in demo
demoPage.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') e.preventDefault();
  if (e.target.tagName === 'BUTTON' && !e.target.type) e.preventDefault();
});

document.getElementById('skipLink').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('mainContent').focus();
});
