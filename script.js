const rawConfig = window.REVEAL_CONFIG || {};
const nameOrFallback = (value, fallback) => typeof value === 'string' && value.trim() ? value.trim() : fallback;
const configuredSex = typeof rawConfig.sexo === 'string' ? rawConfig.sexo.trim().toLocaleLowerCase('pt-BR') : '';
if (configuredSex && configuredSex !== 'menino' && configuredSex !== 'menina') {
  console.warn('Em config.js, sexo deve ser "menino" ou "menina". Usando "menino".');
}
const config = {
  nomeMae: nameOrFallback(rawConfig.nomeMae, 'Ana'),
  nomePai: nameOrFallback(rawConfig.nomePai, 'Vinícius'),
  nomeBebe: nameOrFallback(rawConfig.nomeBebe, 'Miguel'),
  sexo: configuredSex === 'menina' ? 'menina' : 'menino',
  nomeAlternativo: nameOrFallback(rawConfig.nomeAlternativo, configuredSex === 'menina' ? 'Miguel' : 'Maria'),
};
const isGirl = config.sexo === 'menina';
const upper = (value) => value.toLocaleUpperCase('pt-BR');
const girlName = isGirl ? config.nomeBebe : config.nomeAlternativo;
const boyName = isGirl ? config.nomeAlternativo : config.nomeBebe;
document.getElementById('parents-line').textContent = `MAMÃE ${upper(config.nomeMae)} E PAPAI ${upper(config.nomePai)} ESTÃO`;
document.getElementById('girl-name').textContent = upper(girlName);
document.getElementById('boy-name').textContent = upper(boyName);
document.getElementById('reveal-sex').textContent = `É ${config.sexo}!`;
document.getElementById('reveal-name').textContent = upper(config.nomeBebe);
document.getElementById('reveal').setAttribute('aria-label', `Revelação: é ${config.sexo}, ${config.nomeBebe}`);
document.getElementById('reveal').classList.toggle('is-girl', isGirl);
for (const id of ['girl-name', 'boy-name', 'reveal-name']) {
  const element = document.getElementById(id);
  element.classList.toggle('is-long', element.textContent.length > 9);
}

const scenes = [...document.querySelectorAll('.scene')];
const grid = document.getElementById('scratch-grid');
const status = document.getElementById('scratch-status');
const boySequence = ['pink', 'pink', 'blue', 'blue', 'pink', 'blue', 'pink', 'blue', 'blue'];
const sequence = isGirl ? boySequence.map((color) => color === 'blue' ? 'pink' : 'blue') : boySequence;
const winningLine = [2, 5, 8];
const revealed = new Set();
let revealTimer;

const soundToggle = document.getElementById('sound-toggle');
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
// Four gentle phrases in C major, with a longer note at each cadence.
const melody = [
  329.63, 392, 523.25, 493.88, 440, 392, 329.63, 293.66,
  349.23, 440, 587.33, 523.25, 493.88, 392, 349.23, 329.63,
  329.63, 392, 523.25, 659.25, 587.33, 523.25, 392, 440,
  349.23, 329.63, 293.66, 392, 329.63, 293.66, 261.63, 261.63,
];
const harmonyRoots = [261.63, 174.61, 196, 261.63];
let audioContext;
let musicTimer;
let nextNoteTime = 0;
let melodyIndex = 0;
let soundEnabled = false;
let soundPreference = 'automatic';
let scratchNoise;
let lastScratchSound = 0;

function updateSoundButton() {
  const label = soundEnabled ? 'Pausar música de fundo' : 'Ativar música de fundo';
  soundToggle.classList.toggle('is-on', soundEnabled);
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  soundToggle.setAttribute('aria-label', label);
  soundToggle.title = label;
}

function playNote(frequency, startTime, duration, volume = .09, shimmer = true) {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + .06);
  gain.gain.exponentialRampToValueAtTime(volume * .55, startTime + duration * .5);
  gain.gain.exponentialRampToValueAtTime(.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + .01);

  if (shimmer) {
    const overtone = audioContext.createOscillator();
    const overtoneGain = audioContext.createGain();
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(frequency * 2, startTime);
    overtoneGain.gain.setValueAtTime(.0001, startTime);
    overtoneGain.gain.exponentialRampToValueAtTime(volume * .17, startTime + .025);
    overtoneGain.gain.exponentialRampToValueAtTime(.0001, startTime + Math.min(duration, .8));
    overtone.connect(overtoneGain);
    overtoneGain.connect(audioContext.destination);
    overtone.start(startTime);
    overtone.stop(startTime + Math.min(duration, .8) + .01);
  }
}

function scheduleMelody() {
  if (!soundEnabled || !audioContext || audioContext.state !== 'running') return;
  while (nextNoteTime < audioContext.currentTime + .3) {
    const cadence = melodyIndex % 8 === 7;
    playNote(melody[melodyIndex], nextNoteTime, cadence ? 1.75 : 1.25);
    if (melodyIndex % 4 === 0) {
      const root = harmonyRoots[Math.floor(melodyIndex / 8)];
      playNote(root, nextNoteTime, 2.4, .025, false);
      playNote(root * 1.5, nextNoteTime, 1.8, .012, false);
    }
    melodyIndex = (melodyIndex + 1) % melody.length;
    nextNoteTime += .8;
  }
}

async function startSound() {
  if (!AudioContextClass) return;
  soundEnabled = true;
  updateSoundButton();
  audioContext ||= new AudioContextClass();
  try {
    await audioContext.resume();
  } catch {
    soundEnabled = false;
    updateSoundButton();
    return;
  }
  if (!soundEnabled) return;
  if (musicTimer) clearInterval(musicTimer);
  nextNoteTime = audioContext.currentTime + .05;
  scheduleMelody();
  musicTimer = window.setInterval(scheduleMelody, 120);
}

function stopSound() {
  soundEnabled = false;
  updateSoundButton();
  clearInterval(musicTimer);
  musicTimer = undefined;
  audioContext?.suspend();
}

function playScratchSound() {
  if (!soundEnabled || !audioContext || audioContext.state !== 'running') return;
  const now = performance.now();
  if (now - lastScratchSound < 80) return;
  lastScratchSound = now;
  if (!scratchNoise) {
    scratchNoise = audioContext.createBuffer(1, Math.round(audioContext.sampleRate * .13), audioContext.sampleRate);
    const data = scratchNoise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  const at = audioContext.currentTime;
  source.buffer = scratchNoise;
  source.playbackRate.value = .88 + Math.random() * .24;
  filter.type = 'bandpass';
  filter.frequency.value = 1900;
  filter.Q.value = .55;
  gain.gain.setValueAtTime(.0001, at);
  gain.gain.exponentialRampToValueAtTime(.025, at + .012);
  gain.gain.exponentialRampToValueAtTime(.0001, at + .12);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  source.start(at);
  source.stop(at + .13);
}

function playRevealChime() {
  if (!soundEnabled || audioContext?.state !== 'running') return;
  const at = audioContext.currentTime;
  [523.25, 659.25, 783.99].forEach((note, index) => playNote(note, at + index * .18, 1.3, .075));
}

function showScene(id) {
  scenes.forEach((scene) => {
    const active = scene.id === id;
    scene.hidden = !active;
    scene.classList.toggle('is-active', active);
  });
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (id === 'scratch') requestAnimationFrame(setupScratch);
  if (id === 'reveal') playRevealChime();
}

function paintCover(canvas) {
  const rect = canvas.getBoundingClientRect();
  const side = Math.round(rect.width);
  if (side < 1) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(side * ratio);
  canvas.height = Math.round(side * ratio);
  canvas.dataset.logicalSize = String(side);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.scale(ratio, ratio);
  const center = side / 2;
  const radius = side * .47;
  const gradient = ctx.createLinearGradient(0, 0, side, side);
  gradient.addColorStop(0, '#f9d864');
  gradient.addColorStop(.23, '#c97d0c');
  gradient.addColorStop(.49, '#ffe888');
  gradient.addColorStop(.73, '#d79017');
  gradient.addColorStop(1, '#f2bb37');
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = '#fff2c4';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  ctx.clip();
  for (let i = 0; i < side * 1.2; i++) {
    const x = (i * 71.3) % side;
    const y = (i * 37.7) % side;
    ctx.fillStyle = i % 3 ? '#fff5b038' : '#8e5a0921';
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.restore();
  canvas.dataset.covered = 'true';
}

function getPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function scratchAt(canvas, from, to) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const ratio = canvas.width / canvas.getBoundingClientRect().width;
  ctx.save();
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#000';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = canvas.getBoundingClientRect().width * .17;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(to.x, to.y, ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function erasedEnough(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const pixels = ctx.getImageData(0, 0, width, height).data;
  let empty = 0;
  let circle = 0;
  const mid = width / 2;
  const radius = width * .44;
  for (let y = 0; y < height; y += 5) {
    for (let x = 0; x < width; x += 5) {
      if ((x - mid) ** 2 + (y - mid) ** 2 > radius ** 2) continue;
      circle++;
      if (pixels[(y * width + x) * 4 + 3] < 80) empty++;
    }
  }
  return empty / circle > .65;
}

function revealCell(canvas) {
  if (canvas.dataset.covered !== 'true') return;
  canvas.dataset.covered = 'false';
  canvas.style.opacity = '0';
  canvas.style.pointerEvents = 'none';
  canvas.setAttribute('aria-label', `Círculo ${Number(canvas.dataset.index) + 1} revelado`);
  canvas.closest('.scratch-cell').classList.add('is-revealed');
  revealed.add(Number(canvas.dataset.index));
  status.textContent = `${revealed.size} de 9 círculos revelados.`;
  if (!revealTimer && winningLine.every((index) => revealed.has(index))) {
    winningLine.forEach((index) => grid.children[index].classList.add('is-winning'));
    status.textContent = `Sequência de três encontrada. É ${config.sexo}!`;
    revealTimer = window.setTimeout(() => showScene('reveal'), 1100);
  }
}

function makeCell(color, index) {
  const cell = document.createElement('div');
  cell.className = 'scratch-cell';
  const heart = document.createElement('span');
  heart.className = `scratch-heart scratch-heart--${color}`;
  heart.textContent = '♥';
  heart.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  canvas.className = 'scratch-cover';
  canvas.dataset.index = index;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'button');
  canvas.setAttribute('aria-label', `Raspar círculo ${index + 1} de 9`);
  let previous = null;
  canvas.addEventListener('pointerdown', (event) => {
    if (canvas.dataset.covered !== 'true') return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    previous = getPoint(canvas, event);
    scratchAt(canvas, previous, previous);
    playScratchSound();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!previous || canvas.dataset.covered !== 'true') return;
    event.preventDefault();
    const current = getPoint(canvas, event);
    scratchAt(canvas, previous, current);
    playScratchSound();
    previous = current;
    if (erasedEnough(canvas)) revealCell(canvas);
  });
  const stop = () => {
    if (!previous) return;
    previous = null;
    if (canvas.dataset.covered === 'true' && erasedEnough(canvas)) revealCell(canvas);
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.addEventListener('lostpointercapture', stop);
  canvas.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      revealCell(canvas);
    }
  });
  cell.append(heart, canvas);
  return cell;
}

function setupScratch() {
  clearTimeout(revealTimer);
  revealTimer = undefined;
  revealed.clear();
  status.textContent = 'Raspe os círculos e encontre a sequência de três.';
  grid.replaceChildren(...sequence.map(makeCell));
  grid.querySelectorAll('canvas').forEach(paintCover);
}

document.getElementById('open-envelope').addEventListener('click', () => {
  if (soundPreference !== 'muted' && !soundEnabled) startSound();
  showScene('letter');
});
document.getElementById('continue').addEventListener('click', () => showScene('scratch'));
document.getElementById('restart').addEventListener('click', () => showScene('intro'));
soundToggle.addEventListener('click', () => {
  if (soundEnabled) {
    soundPreference = 'muted';
    stopSound();
  } else {
    soundPreference = 'enabled';
    startSound();
  }
});

document.addEventListener('visibilitychange', () => {
  if (!audioContext || !soundEnabled) return;
  if (document.hidden) {
    clearInterval(musicTimer);
    musicTimer = undefined;
    audioContext.suspend();
  } else {
    startSound();
  }
});

window.addEventListener('resize', () => {
  if (!document.getElementById('scratch').hidden) {
    grid.querySelectorAll('canvas').forEach((canvas) => {
      if (canvas.dataset.covered !== 'true') return;
      const side = Math.round(canvas.getBoundingClientRect().width);
      if (side < 1) return;
      if (canvas.width < 1 || canvas.height < 1) {
        paintCover(canvas);
        return;
      }
      if (side === Number(canvas.dataset.logicalSize)) return;
      const copy = document.createElement('canvas');
      copy.width = canvas.width;
      copy.height = canvas.height;
      copy.getContext('2d').drawImage(canvas, 0, 0);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(side * ratio);
      canvas.height = Math.round(side * ratio);
      canvas.getContext('2d', { willReadFrequently: true }).drawImage(copy, 0, 0, canvas.width, canvas.height);
      canvas.dataset.logicalSize = String(side);
    });
  }
});
