// Canvas drawing
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const penColor = document.getElementById('penColor');
const penSize = document.getElementById('penSize');
const clearBtn = document.getElementById('clearCanvas');

let drawing = false;
let lastX = 0, lastY = 0;

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return [(clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY];
}

function startDraw(e) {
  drawing = true;
  [lastX, lastY] = getPos(e);
}

function draw(e) {
  if (!drawing) return;
  e.preventDefault();
  const [x, y] = getPos(e);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = penColor.value;
  ctx.lineWidth = penSize.value;
  ctx.lineCap = 'round';
  ctx.stroke();
  [lastX, lastY] = [x, y];
}

function stopDraw() { drawing = false; }

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDraw);
canvas.addEventListener('mouseleave', stopDraw);
canvas.addEventListener('touchstart', startDraw);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDraw);

clearBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Draw initial hint
ctx.fillStyle = '#334155';
ctx.font = '16px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Desenhe aqui com o mouse!', canvas.width / 2, canvas.height / 2);

// SVG interaction
const svgInfo = document.getElementById('svgInfo');
const shapeDescriptions = {
  rect: '&lt;rect&gt; — Retângulo. Atributos: x, y (posição), width, height (tamanho), rx (borda arredondada), fill (cor).',
  circle: '&lt;circle&gt; — Círculo. Atributos: cx, cy (centro), r (raio), fill (cor).',
  ellipse: '&lt;ellipse&gt; — Elipse. Atributos: cx, cy (centro), rx, ry (raios horizontal e vertical), fill (cor).',
  polygon: '&lt;polygon&gt; — Polígono. Atributo points define os vértices como pares x,y separados por espaço.',
  line: '&lt;line&gt; — Linha. Atributos: x1, y1 (início), x2, y2 (fim), stroke (cor), stroke-width (espessura).',
  text: '&lt;text&gt; — Texto em SVG. Atributos: x, y (posição), font-size, fill, text-anchor (alinhamento).'
};

document.querySelectorAll('.svg-shape').forEach(shape => {
  shape.addEventListener('click', () => {
    document.querySelectorAll('.svg-shape').forEach(s => s.classList.remove('selected'));
    shape.classList.add('selected');
    svgInfo.innerHTML = shapeDescriptions[shape.dataset.shape];
  });
});
