const slider = document.getElementById('viewport-slider');
const vpWidth = document.getElementById('vpWidth');
const placeholder = document.getElementById('imgPlaceholder');
const imgLabel = document.getElementById('imgLabel');
const imgSize = document.getElementById('imgSize');
const activeSource = document.getElementById('activeSource');
const media1 = document.getElementById('media1');
const media2 = document.getElementById('media2');
const media3 = document.getElementById('media3');

function update(width) {
  vpWidth.textContent = width;

  media1.classList.remove('active');
  media2.classList.remove('active');
  media3.classList.remove('active');

  if (width >= 1024) {
    placeholder.className = 'img-placeholder desktop';
    imgLabel.textContent = 'desktop-large.jpg';
    imgSize.textContent = '1200 × 800';
    activeSource.innerHTML = 'Fonte ativa: <strong>desktop-large.jpg</strong> — Viewport grande (≥ 1024px)';
    media3.classList.add('active');
  } else if (width >= 768) {
    placeholder.className = 'img-placeholder tablet';
    imgLabel.textContent = 'tablet-medium.jpg';
    imgSize.textContent = '768 × 512';
    activeSource.innerHTML = 'Fonte ativa: <strong>tablet-medium.jpg</strong> — Viewport médio (≥ 768px)';
    media2.classList.add('active');
  } else {
    placeholder.className = 'img-placeholder mobile';
    imgLabel.textContent = 'mobile-small.jpg';
    imgSize.textContent = '400 × 267';
    activeSource.innerHTML = 'Fonte ativa: <strong>mobile-small.jpg</strong> — Viewport pequeno (< 768px)';
    media1.classList.add('active');
  }
}

slider.addEventListener('input', () => update(parseInt(slider.value)));
update(1200);
