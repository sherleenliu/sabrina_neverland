const intro = document.getElementById('intro');
const game = document.getElementById('game');
const enterBtn = document.getElementById('enterBtn');
const questForm = document.getElementById('questForm');
const questLayer = document.getElementById('questLayer');
const brightLayer = document.getElementById('brightLayer');
const counter = document.getElementById('counter');
const finale = document.getElementById('finale');
const tagline = document.getElementById('tagline');
const fxCanvas = document.getElementById('fxCanvas');
const ctx = fxCanvas.getContext('2d');

let quests = [];
let particles = [];
let textParticles = [];
let finaleStarted = false;
let finaleStartTime = 0;

const bubbleSlots = [
  {x: 300, y: 250},
  {x: 1460, y: 240},
  {x: 220, y: 500},
  {x: 1600, y: 420},
  {x: 365, y: 790},
  {x: 1380, y: 790},
  {x: 1220, y: 300},
  {x: 640, y: 230},
  {x: 1110, y: 790},
  {x: 760, y: 790},
  {x: 1550, y: 660},
  {x: 210, y: 680}
];

const islandTargets = [
  {x: 870, y: 560}, {x: 990, y: 520}, {x: 1090, y: 610}, {x: 760, y: 640},
  {x: 1200, y: 470}, {x: 675, y: 500}, {x: 930, y: 700}, {x: 1130, y: 720},
  {x: 820, y: 430}, {x: 1280, y: 590}, {x: 690, y: 700}, {x: 1000, y: 630}
];

enterBtn.addEventListener('click', () => {
  intro.classList.remove('active');
  game.classList.add('active');
});

questForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('nameInput').value.trim();
  const text = document.getElementById('questInput').value.trim();
  if (!name || !text) return;
  addQuest(name, text);
  questForm.reset();
});

function addQuest(name, text) {
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
  const visible = quests.filter(q => !q.done).length;
  const slot = bubbleSlots[visible % bubbleSlots.length];
  const q = { id, name, text, x: slot.x, y: slot.y, done: false };
  quests.push(q);
  renderQuest(q);
  updateProgress();
}

function renderQuest(q) {
  const el = document.createElement('button');
  el.className = 'quest-bubble';
  el.style.left = `${q.x / 1920 * 100}%`;
  el.style.top = `${q.y / 1080 * 100}%`;
  el.dataset.id = q.id;
  el.innerHTML = `<div class="star">✦</div><div class="name">${escapeHtml(q.name)}</div><div class="quest">${escapeHtml(q.text)}</div>`;
  el.addEventListener('click', () => completeQuest(q.id));
  questLayer.appendChild(el);
}

function completeQuest(id) {
  const q = quests.find(item => item.id === id);
  if (!q || q.done || finaleStarted) return;

  q.done = true;
  const bubble = questLayer.querySelector(`[data-id="${id}"]`);
  const target = islandTargets[quests.filter(item => item.done).length % islandTargets.length];

  if (bubble) {
    bubble.classList.add('completing');
    setTimeout(() => bubble.remove(), 360);
  }

  flyStar(q.x, q.y, target.x, target.y, () => {
    addIslandGlow(target.x, target.y);
    updateProgress();

    if (quests.length > 0 && quests.every(item => item.done)) {
      setTimeout(startFinale, 900);
    }
  });
}

function flyStar(x1, y1, x2, y2, done) {
  const star = document.createElement('div');
  star.className = 'star-fly';
  game.appendChild(star);

  const start = performance.now();
  const duration = 1100;
  const cx = (x1 + x2) / 2 + (Math.random() * 240 - 120);
  const cy = Math.min(y1, y2) - 160;

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const e = easeInOutQuad(t);
    const x = quad(x1, cx, x2, e);
    const y = quad(y1, cy, y2, e);
    const dx = quad(x1, cx, x2, Math.min(1, e + .02)) - x;
    const dy = quad(y1, cy, y2, Math.min(1, e + .02)) - y;

    star.style.left = `${x / 1920 * 100}%`;
    star.style.top = `${y / 1080 * 100}%`;

    addParticle(x, y, '#ffe7a0', 1.05);

    if (t < 1) requestAnimationFrame(step);
    else {
      star.remove();
      addPulse(x2, y2);
      done?.();
    }
  }

  requestAnimationFrame(step);
}

function quad(a, b, c, t) {
  return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
}

function addPulse(x, y) {
  const p = document.createElement('div');
  p.className = 'pulse';
  p.style.left = `${x / 1920 * 100}%`;
  p.style.top = `${y / 1080 * 100}%`;
  game.appendChild(p);
  setTimeout(() => p.remove(), 1000);
}

function addIslandGlow(x, y) {
  const g = document.createElement('div');
  g.className = 'island-glow';
  g.style.left = `${x / 1920 * 100}%`;
  g.style.top = `${y / 1080 * 100}%`;
  game.appendChild(g);
}

function updateProgress() {
  const total = quests.length;
  const completed = quests.filter(q => q.done).length;
  counter.textContent = `Quests ${completed} / ${total}`;
  const pct = total ? completed / total : 0;
  brightLayer.style.opacity = String(Math.min(.88, pct * .88));
}

function startFinale() {
  if (finaleStarted) return;
  document.querySelectorAll('.star-trail,.trail,.light-trail,.orb,.glow,.particle-glow').forEach(el => el.remove());
  document.querySelectorAll('.star-fly,.star-trail').forEach(el => el.remove());

  finaleStarted = true;
  questLayer.innerHTML = '';
  game.classList.add('finale-mode');
  tagline.textContent = 'Never Land will always be here, built by you, with all of us.';
  brightLayer.style.opacity = '.88';
  finale.classList.remove('hidden');

  launchFinaleStarsToText();
}

function launchFinaleStarsToText() {
  finaleStartTime = performance.now();
  textParticles = [];

  const points = getTextPoints();
  const sourcePoints = islandTargets.concat([
    {x: 900, y: 560}, {x: 980, y: 600}, {x: 1040, y: 520},
    {x: 850, y: 690}, {x: 1120, y: 650}, {x: 760, y: 610}
  ]);

  textParticles = points.map((pt, i) => {
    const src = sourcePoints[i % sourcePoints.length];
    const angle = Math.random() * Math.PI * 2;
    const jitter = Math.random() * 80;
    return {
      sx: src.x + Math.cos(angle) * jitter,
      sy: src.y + Math.sin(angle) * jitter * .35,
      cx: (src.x + pt.x) / 2 + (Math.random() * 220 - 110),
      cy: Math.min(src.y, pt.y) - 210 - Math.random() * 120,
      tx: pt.x,
      ty: pt.y,
      x: src.x,
      y: src.y,
      delay: Math.random() * 1.05,
      size: 1.4 + Math.random() * 2.8,
      twinkle: Math.random() * Math.PI * 2,
      arrived: false,
      boost: 1
    };
  });

  // Extra shooting stars from island to text
  for (let i = 0; i < 130; i++) {
    const p = sourcePoints[i % sourcePoints.length];
    const target = points[Math.floor(Math.random() * points.length)];
    setTimeout(() => flyFinalSpark(p.x, p.y, target.x, target.y), i * 10);
  }

  setTimeout(() => burstFinalFireworks(), 2600);
}

function getTextPoints() {
  const off = document.createElement('canvas');
  off.width = 1920;
  off.height = 1080;
  const o = off.getContext('2d');
  o.clearRect(0, 0, 1920, 1080);

  // 在島前面的上空，避開最上面的主標與副標
  o.fillStyle = '#fff';
  o.textAlign = 'center';
  o.textBaseline = 'middle';
  o.font = '700 104px Georgia, "Times New Roman", serif';
  o.fillText('HAPPY BIRTHDAY', 960, 295);
  o.font = '700 118px Georgia, "Times New Roman", serif';
  o.fillText('SABRINA', 960, 415);

  const data = o.getImageData(0, 0, 1920, 1080).data;
  const pts = [];
  const step = 6;

  for (let y = 170; y < 500; y += step) {
    for (let x = 260; x < 1660; x += step) {
      const a = data[(y * 1920 + x) * 4 + 3];
      if (a > 38 && Math.random() > .18) {
        pts.push({ x, y, boost: 1 });
      }
    }
  }

  shuffle(pts);
  return pts.slice(0, 1600);
}

function flyFinalSpark(x1, y1, x2, y2) {
  const start = performance.now();
  const duration = 1450 + Math.random() * 500;
  const cx = (x1 + x2) / 2 + (Math.random() * 160 - 80);
  const cy = Math.min(y1, y2) - 250 - Math.random() * 120;

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const e = easeOutCubic(t);
    const x = quad(x1, cx, x2, e);
    const y = quad(y1, cy, y2, e);

    addParticle(x, y, '#ffe7a0', 1.7);
    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function burstFinalFireworks() {
  const centers = [
    {x: 460, y: 270},
    {x: 1450, y: 285},
    {x: 960, y: 470},
    {x: 650, y: 390},
    {x: 1260, y: 390}
  ];

  centers.forEach((c, idx) => {
    setTimeout(() => {
      for (let i = 0; i < 95; i++) {
        const angle = (i / 95) * Math.PI * 2 + Math.random() * .12;
        const speed = 1.4 + Math.random() * 5.4;
        particles.push({
          x: c.x,
          y: c.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 78,
          max: 78,
          size: 1.6 + Math.random() * 2.6,
          color: Math.random() > .42 ? '#ffe7a0' : '#fff8d6'
        });
      }
    }, idx * 260);
  });
}

function addParticle(x, y, color = '#fff', size = 1) {
  particles.push({
    x, y,
    vx: (Math.random() - .5) * 1.2,
    vy: (Math.random() - .5) * 1.2 - .15,
    life: 42,
    max: 42,
    size: size + Math.random() * 1.8,
    color
  });
}

function animateParticles() {
  ctx.clearRect(0, 0, 1920, 1080);

  drawTextParticles();

  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.life--;
    p.x += p.vx;
    p.y += p.vy;

    const alpha = p.life / p.max;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 11;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  requestAnimationFrame(animateParticles);
}

function drawTextParticles() {
  if (!finaleStarted || !textParticles.length) return;

  const elapsed = (performance.now() - finaleStartTime) / 1000;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (const p of textParticles) {
    const t = Math.max(0, Math.min(1, (elapsed - p.delay) / 2.15));
    const e = easeOutCubic(t);

    p.x = quad(p.sx, p.cx, p.tx, e);
    p.y = quad(p.sy, p.cy, p.ty, e);

    if (t > 0 && t < 1) {
      ctx.strokeStyle = `rgba(255, 221, 128, ${0.045 * t})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.sx, p.sy);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    const pulse = .72 + .28 * Math.sin(elapsed * 5 + p.twinkle);
    const alpha = Math.min(1, t * 2.25) * Math.min(1, pulse + .08);

    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(255, 231, 160, .95)';
    ctx.fillStyle = '#ffe7a0';
    drawTinyStar(ctx, p.x, p.y, p.size * 0.95 * (1 + .08 * Math.sin(elapsed * 4 + p.twinkle)));
  }

  ctx.restore();
}

function drawTinyStar(context, x, y, r) {
  context.beginPath();
  context.arc(x, y, r, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = 'rgba(255, 245, 200, .62)';
  context.lineWidth = .8;
  context.beginPath();
  context.moveTo(x - r * 2.1, y);
  context.lineTo(x + r * 2.1, y);
  context.moveTo(x, y - r * 2.1);
  context.lineTo(x, y + r * 2.1);
  context.stroke();

  context.shadowBlur = 0;
  context.fillStyle = 'rgba(255,255,255,.88)';
  context.beginPath();
  context.arc(x, y, Math.max(.7, r * .34), 0, Math.PI * 2);
  context.fill();
}

animateParticles();

function loadDemo() {
  resetAll(false);
  [
    ['JAY', 'Sing your favorite song'],
    ['NINA', 'Go on a trip you’ve always dreamed of'],
    ['KELLY', 'Take a shot for every memory we made'],
    ['CHRIS', 'Dance like no one’s watching'],
    ['LUNA', 'Do something just for yourself'],
    ['MAYA', 'Make a wish and believe in it'],
    ['JAKE', 'Don’t grow up, it’s a trap']
  ].forEach(([n, q], i) => setTimeout(() => addQuest(n, q), i * 90));
}

function resetAll(keepGame = true) {
  quests = [];
  particles = [];
  textParticles = [];
  finaleStarted = false;

  questLayer.innerHTML = '';
  document.querySelectorAll('.pulse,.island-glow,.star-fly').forEach(el => el.remove());

  brightLayer.style.opacity = '0';
  finale.classList.add('hidden');
  game.classList.remove('finale-mode');
  tagline.textContent = 'Let’s Ignite Never Land.';

  updateProgress();
  ctx.clearRect(0, 0, 1920, 1080);

  if (!keepGame) {
    intro.classList.remove('active');
    game.classList.add('active');
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function easeInOutQuad(t) {
  return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();

  if (k === 'd') {
    intro.classList.remove('active');
    game.classList.add('active');
    loadDemo();
  }

  if (k === 'r') {
    resetAll();
  }

  if (k === 'f') {
    if (quests.length === 0) loadDemo();
    setTimeout(() => {
      quests.forEach(q => {
        if (!q.done) completeQuest(q.id);
      });
    }, 500);
  }
});
