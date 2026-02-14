const info = document.getElementById('info');

const explanations = {
  doctype: {
    title: '&lt;!DOCTYPE html&gt;',
    text: 'Declara que o documento usa HTML5. Deve ser a primeira linha de todo arquivo HTML. Sem ele, o navegador pode entrar em "modo quirks" e renderizar a página de forma inconsistente.'
  },
  html: {
    title: '&lt;html lang="pt-BR"&gt;',
    text: 'Elemento raiz que envolve todo o conteúdo. O atributo <code>lang</code> indica o idioma da página, essencial para acessibilidade e SEO.'
  },
  head: {
    title: '&lt;head&gt;',
    text: 'Contém metadados da página: título, charset, links para CSS, scripts e outras informações que não aparecem diretamente na tela.'
  },
  charset: {
    title: '&lt;meta charset="UTF-8"&gt;',
    text: 'Define a codificação de caracteres como UTF-8, que suporta acentos, emojis e caracteres de praticamente todos os idiomas.'
  },
  viewport: {
    title: '&lt;meta name="viewport"&gt;',
    text: 'Configura como a página se adapta a diferentes tamanhos de tela. Essencial para sites responsivos em celulares e tablets.'
  },
  title: {
    title: '&lt;title&gt;',
    text: 'Define o título da página que aparece na aba do navegador e nos resultados de busca. Cada página deve ter um título único e descritivo.'
  },
  body: {
    title: '&lt;body&gt;',
    text: 'Contém todo o conteúdo visível da página: textos, imagens, links, formulários, etc. Tudo que o usuário vê está dentro do body.'
  },
  content: {
    title: '&lt;h1&gt; (conteúdo)',
    text: 'Exemplo de conteúdo dentro do body. O &lt;h1&gt; é o título principal da página. Cada página deve ter apenas um &lt;h1&gt;.'
  }
};

document.querySelectorAll('.tag').forEach(tag => {
  tag.addEventListener('click', () => {
    document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
    document.querySelectorAll(`[data-tag="${tag.dataset.tag}"]`).forEach(t => t.classList.add('active'));
    const exp = explanations[tag.dataset.tag];
    info.innerHTML = `<div class="info-title">${exp.title}</div><div class="info-text">${exp.text}</div>`;
  });
});
