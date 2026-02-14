const stack = document.getElementById('stack');
const info = document.getElementById('info');
const btnSeparate = document.getElementById('btn-separate');
const btnStack = document.getElementById('btn-stack');

const descriptions = {
  html: '<strong>HTML</strong> é a camada de <em>estrutura</em>. Define o conteúdo da página: textos, imagens, links, formulários. É como o esqueleto de um edifício.',
  css: '<strong>CSS</strong> é a camada de <em>apresentação</em>. Controla cores, fontes, layout e animações. É como a pintura e decoração do edifício.',
  js: '<strong>JavaScript</strong> é a camada de <em>comportamento</em>. Adiciona interatividade: cliques, validações, carregamento dinâmico. É como a eletricidade e elevadores do edifício.'
};

document.querySelectorAll('.layer').forEach(layer => {
  layer.addEventListener('click', () => {
    document.querySelectorAll('.layer').forEach(l => l.classList.remove('active'));
    layer.classList.add('active');
    info.innerHTML = descriptions[layer.dataset.layer];
    if (!stack.classList.contains('separated')) {
      stack.classList.add('separated');
    }
  });
});

btnSeparate.addEventListener('click', () => stack.classList.add('separated'));
btnStack.addEventListener('click', () => {
  stack.classList.remove('separated');
  document.querySelectorAll('.layer').forEach(l => l.classList.remove('active'));
  info.innerHTML = '<p>Clique em uma camada para saber mais.</p>';
});
