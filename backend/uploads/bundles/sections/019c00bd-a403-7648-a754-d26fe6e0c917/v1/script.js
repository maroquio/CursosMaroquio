const miniContent = document.getElementById('miniContent');

document.querySelectorAll('.mini-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById('s-' + link.dataset.target);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.mini-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
});

// Update active link on scroll
miniContent.addEventListener('scroll', () => {
  const sections = miniContent.querySelectorAll('.mini-section');
  let currentId = '';
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    const containerRect = miniContent.getBoundingClientRect();
    if (rect.top <= containerRect.top + 40) {
      currentId = section.id.replace('s-', '');
    }
  });
  if (currentId) {
    document.querySelectorAll('.mini-link').forEach(l => {
      l.classList.toggle('active', l.dataset.target === currentId);
    });
  }
});
