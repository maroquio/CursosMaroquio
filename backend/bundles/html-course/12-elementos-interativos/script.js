// Dialog
const openBtn = document.getElementById('openDialog');
const dialog = document.getElementById('myDialog');
openBtn.addEventListener('click', () => dialog.showModal());

// Progress
const progress = document.getElementById('demoProgress');
const progressSlider = document.getElementById('progressSlider');
const progressValue = document.getElementById('progressValue');

progressSlider.addEventListener('input', () => {
  const val = progressSlider.value;
  progress.value = val;
  progressValue.textContent = val;
});

// Meter
const meter = document.getElementById('demoMeter');
const meterSlider = document.getElementById('meterSlider');
const meterLabel = document.getElementById('meterLabel');

meterSlider.addEventListener('input', () => {
  const val = parseFloat(meterSlider.value);
  meter.value = val;
  let status = 'bom';
  if (val >= 7) status = 'crítico';
  else if (val >= 3) status = 'alto';
  meterLabel.textContent = `${val} de 10 GB (${status})`;
});
