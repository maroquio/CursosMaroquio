const previewTitle = document.getElementById('previewTitle');
const previewInput = document.getElementById('previewInput');
const previewCode = document.getElementById('previewCode');
const previewDesc = document.getElementById('previewDesc');

const types = {
  text: {
    html: '<input type="text" placeholder="Digite seu nome">',
    render: '<input type="text" placeholder="Digite seu nome">',
    desc: 'Campo de texto genérico. O tipo padrão quando nenhum type é especificado.'
  },
  email: {
    html: '<input type="email" placeholder="seu@email.com">',
    render: '<input type="email" placeholder="seu@email.com">',
    desc: 'Valida automaticamente formato de email. Em mobile, abre teclado com @.'
  },
  password: {
    html: '<input type="password" placeholder="Sua senha">',
    render: '<input type="password" placeholder="Sua senha">',
    desc: 'Oculta os caracteres digitados com pontos. Navegadores oferecem gerenciamento de senhas.'
  },
  number: {
    html: '<input type="number" min="0" max="100" step="5">',
    render: '<input type="number" min="0" max="100" step="5" value="50">',
    desc: 'Aceita apenas números. Atributos min, max e step controlam o intervalo. Mostra setas de incremento.'
  },
  tel: {
    html: '<input type="tel" placeholder="(11) 99999-0000">',
    render: '<input type="tel" placeholder="(11) 99999-0000">',
    desc: 'Em mobile, abre teclado numérico. Não valida formato — use pattern para isso.'
  },
  url: {
    html: '<input type="url" placeholder="https://exemplo.com">',
    render: '<input type="url" placeholder="https://exemplo.com">',
    desc: 'Valida que o valor é uma URL válida. Em mobile, o teclado mostra teclas .com e /.'
  },
  date: {
    html: '<input type="date">',
    render: '<input type="date">',
    desc: 'Mostra seletor de data nativo do navegador. Retorna formato YYYY-MM-DD.'
  },
  time: {
    html: '<input type="time">',
    render: '<input type="time">',
    desc: 'Seletor de hora nativo. Retorna formato HH:MM. Use step para controlar precisão (ex: step="60").'
  },
  color: {
    html: '<input type="color" value="#38bdf8">',
    render: '<input type="color" value="#38bdf8">',
    desc: 'Abre seletor de cores do sistema. Retorna valor hexadecimal (#RRGGBB).'
  },
  range: {
    html: '<input type="range" min="0" max="100" value="50">',
    render: '<label>0</label><input type="range" min="0" max="100" value="50"><label>100</label>',
    desc: 'Controle deslizante (slider). Use min, max e step para definir o intervalo. Combine com output para mostrar o valor.'
  },
  search: {
    html: '<input type="search" placeholder="Buscar...">',
    render: '<input type="search" placeholder="Buscar...">',
    desc: 'Similar a text, mas com semântica de busca. Alguns navegadores mostram um X para limpar o campo.'
  },
  file: {
    html: '<input type="file" accept="image/*">',
    render: '<input type="file" accept="image/*">',
    desc: 'Permite upload de arquivos. Use accept para filtrar tipos (image/*, .pdf, etc.) e multiple para múltiplos arquivos.'
  },
  checkbox: {
    html: '<input type="checkbox" id="aceito">\n<label for="aceito">Aceito os termos</label>',
    render: '<input type="checkbox" id="cb-demo"><label for="cb-demo">Aceito os termos</label>',
    desc: 'Caixa de marcação para opções booleanas. Use checked para marcar por padrão. Sempre associe com label.'
  },
  radio: {
    html: '<input type="radio" name="cor" id="r1">\n<label for="r1">Azul</label>\n<input type="radio" name="cor" id="r2">\n<label for="r2">Verde</label>',
    render: '<input type="radio" name="cor-demo" id="r1-demo"><label for="r1-demo">Azul</label>&nbsp;&nbsp;<input type="radio" name="cor-demo" id="r2-demo"><label for="r2-demo">Verde</label>',
    desc: 'Botão de seleção exclusiva. Inputs com o mesmo name formam um grupo — só um pode ser selecionado.'
  }
};

function showType(type) {
  const data = types[type];
  previewTitle.textContent = `type="${type}"`;
  previewInput.innerHTML = data.render;
  previewCode.textContent = data.html;
  previewDesc.textContent = data.desc;

  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
  });
}

document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => showType(btn.dataset.type));
});

showType('text');
