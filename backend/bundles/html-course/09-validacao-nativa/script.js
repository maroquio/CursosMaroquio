const form = document.getElementById('demoForm');
const formResult = document.getElementById('formResult');
const bio = document.getElementById('bio');
const charCount = document.getElementById('charCount');

const fields = {
  nome: { el: document.getElementById('nome'), msg: document.getElementById('msg-nome') },
  email: { el: document.getElementById('email'), msg: document.getElementById('msg-email') },
  idade: { el: document.getElementById('idade'), msg: document.getElementById('msg-idade') },
  cep: { el: document.getElementById('cep'), msg: document.getElementById('msg-cep') },
  bio: { el: document.getElementById('bio'), msg: document.getElementById('msg-bio') }
};

function validateField(name) {
  const { el, msg } = fields[name];
  if (!el.value && !el.required) {
    el.classList.remove('valid', 'invalid');
    msg.textContent = '';
    msg.className = 'validation-msg';
    return true;
  }

  if (el.checkValidity()) {
    el.classList.remove('invalid');
    el.classList.add('valid');
    msg.textContent = '✓ Válido';
    msg.className = 'validation-msg success';
    return true;
  } else {
    el.classList.remove('valid');
    el.classList.add('invalid');
    let text = 'Campo inválido';
    if (el.validity.valueMissing) text = 'Campo obrigatório';
    else if (el.validity.typeMismatch) text = 'Formato inválido';
    else if (el.validity.tooShort) text = `Mínimo ${el.minLength} caracteres`;
    else if (el.validity.tooLong) text = `Máximo ${el.maxLength} caracteres`;
    else if (el.validity.rangeUnderflow) text = `Mínimo: ${el.min}`;
    else if (el.validity.rangeOverflow) text = `Máximo: ${el.max}`;
    else if (el.validity.patternMismatch) text = el.title || 'Formato incorreto';
    msg.textContent = '✗ ' + text;
    msg.className = 'validation-msg error';
    return false;
  }
}

Object.keys(fields).forEach(name => {
  fields[name].el.addEventListener('input', () => validateField(name));
  fields[name].el.addEventListener('blur', () => validateField(name));
});

bio.addEventListener('input', () => {
  charCount.textContent = `${bio.value.length}/200`;
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let allValid = true;
  Object.keys(fields).forEach(name => {
    if (!validateField(name)) allValid = false;
  });

  if (allValid) {
    formResult.textContent = '✓ Formulário válido! Dados prontos para envio.';
    formResult.className = 'form-result success';
  } else {
    formResult.textContent = '✗ Corrija os campos destacados em vermelho.';
    formResult.className = 'form-result error';
  }
});

// Attr cards highlight corresponding fields
document.querySelectorAll('.attr-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.attr-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    document.querySelectorAll('.field').forEach(f => f.classList.remove('highlight'));
    const info = card.dataset.info;
    const mapping = {
      required: ['nome', 'email', 'idade'],
      minlength: ['nome', 'bio'],
      minmax: ['idade'],
      pattern: ['email', 'cep'],
      placeholder: ['nome', 'email', 'idade', 'cep', 'bio']
    };
    (mapping[info] || []).forEach(name => {
      fields[name].el.closest('.field').classList.add('highlight');
    });
  });
});
