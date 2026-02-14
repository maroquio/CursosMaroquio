const codeOutput = document.getElementById('codeOutput');
const fakeIframe = document.getElementById('fakeIframe');
const fiOverlay = document.getElementById('fiOverlay');
const fiBtn = document.getElementById('fiBtn');

const checkboxes = {
  sandbox: document.getElementById('attr-sandbox'),
  scripts: document.getElementById('attr-allow-scripts'),
  forms: document.getElementById('attr-allow-forms'),
  lazy: document.getElementById('attr-loading-lazy'),
  width: document.getElementById('attr-width'),
};

function update() {
  const sandbox = checkboxes.sandbox.checked;
  const scripts = checkboxes.scripts.checked;
  const forms = checkboxes.forms.checked;
  const lazy = checkboxes.lazy.checked;
  const width = checkboxes.width.checked;

  // Build code
  let attrs = ['src="pagina.html"'];
  if (sandbox) {
    const sandboxVals = [];
    if (scripts) sandboxVals.push('allow-scripts');
    if (forms) sandboxVals.push('allow-forms');
    attrs.push(sandboxVals.length
      ? `sandbox="${sandboxVals.join(' ')}"`
      : 'sandbox');
  }
  if (lazy) attrs.push('loading="lazy"');
  if (width) attrs.push('width="100%"');

  codeOutput.textContent = `<iframe\n  ${attrs.join('\n  ')}\n></iframe>`;

  // Update preview
  if (sandbox && !scripts) {
    fakeIframe.classList.add('scripts-disabled');
  } else {
    fakeIframe.classList.remove('scripts-disabled');
  }

  if (sandbox && !forms) {
    fakeIframe.classList.add('forms-disabled');
  } else {
    fakeIframe.classList.remove('forms-disabled');
  }

  fakeIframe.style.width = width ? '100%' : '300px';

  // Show overlay when sandbox blocks everything
  if (sandbox && !scripts && !forms) {
    fiOverlay.classList.add('visible');
  } else {
    fiOverlay.classList.remove('visible');
  }
}

Object.values(checkboxes).forEach(cb => cb.addEventListener('change', update));

fiBtn.addEventListener('click', () => {
  if (!fakeIframe.classList.contains('scripts-disabled')) {
    fiBtn.textContent = 'Clicado! ✓';
    setTimeout(() => { fiBtn.textContent = 'Clique-me'; }, 1500);
  }
});

update();
