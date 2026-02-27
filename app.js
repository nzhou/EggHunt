const state = {
  mode: "setup",
  theme: "garden",
  totalEggs: 6,
  eggs: [],
  sceneObjects: [],
  nextObjectId: 1,
  pendingEggs: [],
  hideTool: "eggs",
  selectedPropKind: "bunny",
  selectedItem: null,
  dragging: null,
  foundCount: 0,
  wandUses: 3,
  soundEnabled: true,
  musicEnabled: true,
};

const BGM_PATH = "assets/audio/bgm_main.mp3";

const THEME_BACKGROUND_MAP = {
  garden: "assets/themes/garden.png",
  forest: "assets/themes/forest.png",
  playground: "assets/themes/playground.png",
  indoor: "assets/themes/indoor.png",
};

const THEME_LABEL_MAP = {
  garden: "Garden",
  forest: "Forest",
  playground: "Playground",
  indoor: "Baby Room",
};

const EGG_ASSET_PATHS = [
  "assets/eggs/egg01.png",
  "assets/eggs/egg02.png",
  "assets/eggs/egg03.png",
  "assets/eggs/egg04.png",
  "assets/eggs/egg05.png",
];
const EGG_MIN_COUNT = 3;
const EGG_MAX_COUNT = 12;

const PROP_ASSET_MAP = {
  basket: "assets/props/prop_basket.png?v=4",
  bunny: "assets/props/prop_bunny.png?v=4",
  carrot: "assets/props/prop_carrot.png?v=4",
  chick: "assets/props/prop_chick.png?v=4",
  daffodil: "assets/props/prop_daffodil.png?v=4",
  pinwheel: "assets/props/prop_pinwheel.png?v=4",
  storybook: "assets/props/prop_storybook.png?v=4",
  toy: "assets/props/prop_toy.png?v=4",
  tulip: "assets/props/prop_tulip.png?v=4",
};

const COMMON_PROP_KINDS = [
  "bunny",
  "chick",
  "daffodil",
  "tulip",
  "basket",
  "carrot",
  "pinwheel",
  "storybook",
  "toy",
];

const PROP_ICON_MAP = {
  bunny: "🐇",
  chick: "🐥",
  daffodil: "🌼",
  tulip: "🌷",
  basket: "🧺",
  carrot: "🥕",
  pinwheel: "🌀",
  storybook: "📖",
  toy: "🧸",
};

const setupScreen = document.getElementById("setupScreen");
const gameScreen = document.getElementById("gameScreen");
const themePicker = document.getElementById("themePicker");
const eggMinusBtn = document.getElementById("eggMinusBtn");
const eggPlusBtn = document.getElementById("eggPlusBtn");
const eggCountValue = document.getElementById("eggCountValue");
const startHideBtn = document.getElementById("startHideBtn");
const scene = document.getElementById("scene");
const modeText = document.getElementById("modeText");
const counterText = document.getElementById("counterText");
const hintText = document.getElementById("hintText");
const hideToolsPanel = document.getElementById("hideToolsPanel");
const eggToolBtn = document.getElementById("eggToolBtn");
const propToolBtn = document.getElementById("propToolBtn");
const eggShelfWrap = document.getElementById("eggShelfWrap");
const eggShelfLabel = document.getElementById("eggShelfLabel");
const eggShelf = document.getElementById("eggShelf");
const propShelfWrap = document.getElementById("propShelfWrap");
const propShelfLabel = document.getElementById("propShelfLabel");
const propPicker = document.getElementById("propPicker");
const nextBtn = document.getElementById("nextBtn");
const hintBtn = document.getElementById("hintBtn");
const restartBtn = document.getElementById("restartBtn");
const musicToggleBtn = document.getElementById("musicToggleBtn");
const soundToggleBtn = document.getElementById("soundToggleBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const newHuntBtn = document.getElementById("newHuntBtn");
const winSummary = document.getElementById("winSummary");
const completePanel = document.getElementById("completePanel");
let audioCtx = null;
let bgmAudio = null;
let celebrationCanvas = null;
let celebrationCtx = null;
let celebrationRaf = null;
let celebrationParticles = [];
let celebrationStartedAt = 0;
let celebrationLastFrameAt = 0;
let celebrationBurstCount = 0;
let celebrationNextBurstAt = 0;
let celebrationResizeHandler = null;
let noiseBuffer = null;
const FIREWORK_COLORS = ["#ff6b6b", "#ffd166", "#06d6a0", "#4cc9f0", "#f72585", "#f9844a"];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setEggCount(value) {
  state.totalEggs = clamp(Number(value) || EGG_MIN_COUNT, EGG_MIN_COUNT, EGG_MAX_COUNT);
  eggCountValue.textContent = String(state.totalEggs);
}

function stopCelebrationFireworks() {
  if (celebrationRaf) {
    cancelAnimationFrame(celebrationRaf);
    celebrationRaf = null;
  }
  if (celebrationResizeHandler) {
    window.removeEventListener("resize", celebrationResizeHandler);
    celebrationResizeHandler = null;
  }
  celebrationParticles = [];
  celebrationCtx = null;
  if (celebrationCanvas) {
    celebrationCanvas.remove();
    celebrationCanvas = null;
  }
}

function shouldReduceMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function resizeCelebrationCanvas() {
  if (!celebrationCanvas || !celebrationCtx) {
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  celebrationCanvas.width = Math.floor(width * dpr);
  celebrationCanvas.height = Math.floor(height * dpr);
  celebrationCanvas.style.width = `${width}px`;
  celebrationCanvas.style.height = `${height}px`;
  celebrationCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function spawnFireworkBurst() {
  if (!celebrationCanvas) {
    return;
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const x = width * (0.15 + Math.random() * 0.7);
  const y = height * (0.12 + Math.random() * 0.38);
  const pieces = 42 + Math.floor(Math.random() * 20);

  for (let i = 0; i < pieces; i += 1) {
    const angle = (Math.PI * 2 * i) / pieces + (Math.random() - 0.5) * 0.22;
    const speed = 110 + Math.random() * 260;
    celebrationParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      life: 0,
      ttl: 0.9 + Math.random() * 0.75,
      size: 1.8 + Math.random() * 2.8,
      color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
    });
  }
}

function drawCelebrationFrame(now) {
  if (!celebrationCtx || !celebrationCanvas) {
    return;
  }
  const dt = Math.min(0.033, (now - celebrationLastFrameAt) / 1000 || 0.016);
  celebrationLastFrameAt = now;

  if (now >= celebrationNextBurstAt && celebrationBurstCount < 8) {
    spawnFireworkBurst();
    celebrationBurstCount += 1;
    celebrationNextBurstAt = now + 200 + Math.random() * 180;
  }

  const gravity = 460;
  celebrationParticles = celebrationParticles.filter((p) => {
    p.life += dt;
    if (p.life >= p.ttl) {
      return false;
    }
    p.vy += gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    return true;
  });

  celebrationCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  for (const p of celebrationParticles) {
    const alpha = 1 - p.life / p.ttl;
    celebrationCtx.globalAlpha = alpha;
    celebrationCtx.fillStyle = p.color;
    celebrationCtx.beginPath();
    celebrationCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    celebrationCtx.fill();
  }
  celebrationCtx.globalAlpha = 1;

  const elapsed = now - celebrationStartedAt;
  if (elapsed < 2300 || celebrationParticles.length > 0) {
    celebrationRaf = requestAnimationFrame(drawCelebrationFrame);
    return;
  }
  stopCelebrationFireworks();
}

function startCelebrationFireworks() {
  stopCelebrationFireworks();
  if (shouldReduceMotion()) {
    return;
  }

  celebrationCanvas = document.createElement("canvas");
  celebrationCanvas.setAttribute("aria-hidden", "true");
  celebrationCanvas.style.position = "fixed";
  celebrationCanvas.style.inset = "0";
  celebrationCanvas.style.pointerEvents = "none";
  celebrationCanvas.style.zIndex = "999";
  document.body.appendChild(celebrationCanvas);

  celebrationCtx = celebrationCanvas.getContext("2d");
  if (!celebrationCtx) {
    stopCelebrationFireworks();
    return;
  }

  celebrationResizeHandler = () => resizeCelebrationCanvas();
  window.addEventListener("resize", celebrationResizeHandler);
  resizeCelebrationCanvas();

  celebrationParticles = [];
  celebrationBurstCount = 0;
  celebrationStartedAt = performance.now();
  celebrationLastFrameAt = celebrationStartedAt;
  celebrationNextBurstAt = celebrationStartedAt;
  celebrationRaf = requestAnimationFrame(drawCelebrationFrame);
}

function showScreen(name) {
  setupScreen.classList.toggle("active", name === "setup");
  gameScreen.classList.toggle("active", name === "game");
  restartBtn.hidden = name === "setup";
}

function updateSoundButton() {
  if (!soundToggleBtn) {
    return;
  }
  soundToggleBtn.textContent = state.soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";
  soundToggleBtn.setAttribute("aria-pressed", state.soundEnabled ? "true" : "false");
}

function updateMusicButton() {
  if (!musicToggleBtn) {
    return;
  }
  musicToggleBtn.textContent = state.musicEnabled ? "🎵 Music On" : "🎵 Music Off";
  musicToggleBtn.setAttribute("aria-pressed", state.musicEnabled ? "true" : "false");
}

function ensureBgmAudio() {
  if (bgmAudio) {
    return bgmAudio;
  }
  bgmAudio = new Audio(BGM_PATH);
  bgmAudio.loop = true;
  bgmAudio.preload = "auto";
  bgmAudio.volume = 0.24;
  return bgmAudio;
}

function syncBackgroundMusic() {
  const audio = ensureBgmAudio();
  if (!state.musicEnabled) {
    audio.pause();
    return;
  }
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      // autoplay can be blocked before a user interaction
    });
  }
}

function resetRound() {
  stopCelebrationFireworks();
  state.mode = "setup";
  setEggCount(state.totalEggs);
  state.eggs = [];
  state.sceneObjects = [];
  state.nextObjectId = 1;
  state.pendingEggs = [];
  state.hideTool = "eggs";
  state.selectedPropKind = COMMON_PROP_KINDS[0];
  state.selectedItem = null;
  state.dragging = null;
  state.foundCount = 0;
  state.wandUses = 3;
  renderThemePicker();
  renderPropPicker();
  renderScene();
  renderStatus();
  showScreen("setup");
}

function startHideMode() {
  stopCelebrationFireworks();
  state.mode = "hide";
  setEggCount(state.totalEggs);
  state.eggs = [];
  state.sceneObjects = [];
  state.nextObjectId = 1;
  state.pendingEggs = Array.from({ length: state.totalEggs }, () => buildEggTemplate());
  state.hideTool = "eggs";
  state.selectedPropKind = COMMON_PROP_KINDS[0];
  state.selectedItem = null;
  state.dragging = null;
  state.foundCount = 0;
  state.wandUses = 3;
  showScreen("game");
  renderPropPicker();
  renderScene();
  renderStatus();
}

function startFindMode() {
  state.mode = "find";
  renderScene();
  renderStatus();
}

function replayCurrentHunt(options = {}) {
  stopCelebrationFireworks();
  const { resetWands = true } = options;
  state.mode = "find";
  state.foundCount = 0;
  if (resetWands) {
    state.wandUses = 3;
  }
  state.eggs.forEach((egg) => {
    egg.found = false;
    egg.foundAt = null;
  });
  state.selectedItem = null;
  state.dragging = null;
  showScreen("game");
  renderScene();
  renderStatus();
}

function renderStatus() {
  if (state.mode === "hide") {
    modeText.textContent =
      state.hideTool === "eggs"
        ? "Hide Mode: drag eggs from shelf. Drag item to move. Drag R/S handles to rotate/scale."
        : "Hide Mode: drag props from shelf. Drag item to move. Drag R/S handles to rotate/scale.";
    counterText.textContent = `Eggs: ${state.eggs.length}/${state.totalEggs} | Props: ${state.sceneObjects.length}`;
    nextBtn.disabled = state.eggs.length !== state.totalEggs;
    nextBtn.textContent = "Pass to Finder";
    nextBtn.hidden = false;
    hintBtn.hidden = true;
    hintText.hidden = true;
    completePanel.hidden = true;
    hideToolsPanel.hidden = false;
    eggToolBtn.classList.toggle("active-tool", state.hideTool === "eggs");
    propToolBtn.classList.toggle("active-tool", state.hideTool === "props");
    eggShelfWrap.hidden = state.hideTool !== "eggs";
    propShelfWrap.hidden = state.hideTool !== "props";
    renderEggShelf();
    renderPropPicker();
  }

  if (state.mode === "find") {
    modeText.textContent = "Find Mode: tap to find eggs";
    counterText.textContent = `Found: ${state.foundCount}/${state.totalEggs}`;
    nextBtn.disabled = false;
    nextBtn.textContent = "Restart the Hunt";
    nextBtn.hidden = false;
    hintBtn.hidden = false;
    hintBtn.disabled = state.wandUses < 1;
    hintText.hidden = false;
    hintText.textContent = `Wands left: ${state.wandUses}`;
    completePanel.hidden = true;
    hideToolsPanel.hidden = true;
    eggShelfWrap.hidden = true;
    propShelfWrap.hidden = true;
    state.dragging = null;
  }

  if (state.mode === "complete") {
    modeText.textContent = "Great job! All eggs found.";
    counterText.textContent = `Found: ${state.foundCount}/${state.totalEggs}`;
    nextBtn.hidden = true;
    hintBtn.hidden = true;
    hintText.hidden = true;
    completePanel.hidden = false;
    hideToolsPanel.hidden = true;
    eggShelfWrap.hidden = true;
    propShelfWrap.hidden = true;
    state.dragging = null;
  }
}

function sceneCoordsFromEvent(event) {
  return sceneCoordsFromClient(event.clientX, event.clientY);
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function randomPattern() {
  return Math.floor(Math.random() * 5);
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomEggScale() {
  return Number((0.8 + Math.random() * 0.7).toFixed(2));
}

function randomEggAsset() {
  return randomFrom(EGG_ASSET_PATHS);
}

function randomEggRotation() {
  return Math.floor(Math.random() * 37 - 18);
}

function buildEggTemplate() {
  return {
    found: false,
    foundAt: null,
    pattern: randomPattern(),
    asset: randomEggAsset(),
    scale: 1,
    rotate: 0,
    flipX: 1,
    hitRadius: 4.9,
  };
}

function randomPropScale() {
  return Number((0.75 + Math.random() * 0.7).toFixed(2));
}

function randomPropRotation() {
  return Math.floor(Math.random() * 61 - 30);
}

function getAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      return null;
    }
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone({ freq, type = "sine", duration = 0.16, volume = 0.2, sweepTo = null, when = 0 }) {
  if (!state.soundEnabled) {
    return;
  }
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  const start = ctx.currentTime + when;
  const end = start + duration;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (sweepTo) {
    osc.frequency.exponentialRampToValueAtTime(sweepTo, end);
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(end + 0.01);
}

function getNoiseBuffer(ctx) {
  if (noiseBuffer) {
    return noiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 0.6);
  noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const channel = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    channel[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function playNoiseBurst({ when = 0, duration = 0.08, volume = 0.12, highpass = 900, bandpass = 1800, q = 0.8 }) {
  if (!state.soundEnabled) {
    return;
  }
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  const start = ctx.currentTime + when;
  const end = start + duration;

  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(highpass, start);

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(bandpass, start);
  bp.Q.setValueAtTime(q, start);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  source.connect(hp);
  hp.connect(bp);
  bp.connect(gain);
  gain.connect(ctx.destination);

  source.start(start);
  source.stop(end + 0.02);
}

function playHoorayVoice({ baseFreq = 440, when = 0, volume = 0.055 }) {
  playTone({
    freq: baseFreq,
    type: "triangle",
    duration: 0.22,
    volume,
    when,
    sweepTo: baseFreq * 1.45,
  });
  playTone({
    freq: baseFreq * 1.48,
    type: "sine",
    duration: 0.2,
    volume: volume * 0.82,
    when: when + 0.03,
    sweepTo: baseFreq * 2.05,
  });
}

function playEggFoundSfx() {
  playTone({ freq: 740, type: "triangle", duration: 0.14, volume: 0.17 });
  playTone({ freq: 988, type: "triangle", duration: 0.2, volume: 0.15, when: 0.09 });
}

function playPropTapSfx() {
  playTone({ freq: 320, type: "square", duration: 0.08, volume: 0.11, sweepTo: 220 });
  playTone({ freq: 180, type: "triangle", duration: 0.14, volume: 0.08, when: 0.04, sweepTo: 110 });
}

function playMissTapSfx() {
  playTone({ freq: 260, type: "sine", duration: 0.07, volume: 0.05, sweepTo: 210 });
}

function playWandSfx() {
  playTone({ freq: 520, type: "triangle", duration: 0.1, volume: 0.08 });
  playTone({ freq: 780, type: "sine", duration: 0.13, volume: 0.1, when: 0.05 });
  playTone({ freq: 1120, type: "triangle", duration: 0.16, volume: 0.09, when: 0.11 });
}

function playCelebrationSfx() {
  // Hand-clap style hits (noise bursts).
  playNoiseBurst({ when: 0.0, duration: 0.07, volume: 0.13, highpass: 900, bandpass: 1900, q: 0.9 });
  playNoiseBurst({ when: 0.12, duration: 0.07, volume: 0.12, highpass: 1000, bandpass: 2200, q: 0.8 });
  playNoiseBurst({ when: 0.28, duration: 0.08, volume: 0.14, highpass: 850, bandpass: 1700, q: 1.0 });
  playNoiseBurst({ when: 0.42, duration: 0.08, volume: 0.13, highpass: 950, bandpass: 2100, q: 0.85 });

  // "Hooray" crowd-like shouts (stacked upward sweeps).
  playHoorayVoice({ baseFreq: 420, when: 0.18, volume: 0.058 });
  playHoorayVoice({ baseFreq: 470, when: 0.22, volume: 0.056 });
  playHoorayVoice({ baseFreq: 520, when: 0.26, volume: 0.052 });

  playHoorayVoice({ baseFreq: 500, when: 0.56, volume: 0.06 });
  playHoorayVoice({ baseFreq: 560, when: 0.6, volume: 0.057 });
  playHoorayVoice({ baseFreq: 620, when: 0.64, volume: 0.053 });

  // Extra applause tail.
  playNoiseBurst({ when: 0.84, duration: 0.09, volume: 0.11, highpass: 900, bandpass: 1800, q: 0.85 });
  playNoiseBurst({ when: 0.98, duration: 0.08, volume: 0.1, highpass: 1000, bandpass: 2100, q: 0.8 });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function propHitRadius(prop) {
  return 6.3 * (prop.scale ?? 1);
}

function getSelectedObject() {
  if (!state.selectedItem) {
    return null;
  }
  const source = state.selectedItem.type === "egg" ? state.eggs : state.sceneObjects;
  return source[state.selectedItem.index] || null;
}

function clearSelection() {
  state.selectedItem = null;
}

function setSelection(type, index) {
  state.selectedItem = { type, index };
}

function normalizeEgg(egg) {
  egg.scale = egg.scale ?? 1;
  egg.rotate = egg.rotate ?? 0;
  egg.flipX = egg.flipX === -1 ? -1 : 1;
  egg.foundAt = egg.foundAt ?? null;
  egg.hitRadius = Number((4.9 * egg.scale).toFixed(2));
}

function normalizeProp(prop) {
  prop.scale = prop.scale ?? 1;
  prop.rotate = prop.rotate ?? 0;
  prop.flipX = prop.flipX === -1 ? -1 : 1;
  if (!prop.id) {
    prop.id = state.nextObjectId++;
  }
}

function objectCenterPx(obj) {
  return {
    x: (obj.x / 100) * scene.clientWidth,
    y: (obj.y / 100) * scene.clientHeight,
  };
}

function objectCenterClientPx(obj) {
  const local = objectCenterPx(obj);
  const rect = scene.getBoundingClientRect();
  return {
    x: rect.left + local.x,
    y: rect.top + local.y,
  };
}

function findObjectAt(point) {
  let hit = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = state.sceneObjects.length - 1; i >= 0; i -= 1) {
    const prop = state.sceneObjects[i];
    const d = distance(prop, point);
    if (d <= propHitRadius(prop) && d < bestDistance) {
      bestDistance = d;
      hit = { type: "prop", index: i };
    }
  }

  for (let i = state.eggs.length - 1; i >= 0; i -= 1) {
    const egg = state.eggs[i];
    const d = distance(egg, point);
    if (d <= (egg.hitRadius ?? 5.5) && d < bestDistance) {
      bestDistance = d;
      hit = { type: "egg", index: i };
    }
  }

  return hit;
}

function renderPropPicker() {
  propPicker.innerHTML = "";
  if (state.mode !== "hide" || state.hideTool !== "props") {
    return;
  }
  propShelfLabel.textContent = "Prop Shelf (unlimited drag)";

  COMMON_PROP_KINDS.forEach((kind) => {
    const propEl = document.createElement("button");
    propEl.type = "button";
    propEl.className = "shelf-prop";
    propEl.draggable = true;
    propEl.dataset.kind = kind;
    propEl.title = `Drag ${kind.replace("-", " ")} into scene`;
    const propAsset = PROP_ASSET_MAP[kind];
    if (propAsset) {
      propEl.classList.add("image-prop");
      propEl.style.backgroundImage = `url("${propAsset}")`;
    } else {
      const label = document.createElement("span");
      label.className = "shelf-prop-label";
      label.textContent = PROP_ICON_MAP[kind] || kind.replace("-", " ");
      propEl.appendChild(label);
    }
    propEl.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", `prop:${kind}`);
      event.dataTransfer.effectAllowed = "copy";
    });
    propPicker.appendChild(propEl);
  });
}

function renderEggShelf() {
  eggShelf.innerHTML = "";
  if (state.mode !== "hide" || state.hideTool !== "eggs") {
    return;
  }
  eggShelfLabel.textContent = `Egg Shelf (${state.pendingEggs.length} left)`;

  state.pendingEggs.forEach((egg, index) => {
    const shelfEgg = document.createElement("button");
    shelfEgg.type = "button";
    shelfEgg.className = "shelf-egg";
    shelfEgg.draggable = true;
    shelfEgg.dataset.eggIndex = String(index);
    shelfEgg.title = "Drag into the scene";
    if (egg.asset) {
      shelfEgg.style.backgroundImage = `url("${egg.asset}")`;
      shelfEgg.classList.add("image-egg");
    } else {
      shelfEgg.classList.add(`pattern-${egg.pattern ?? 0}`);
    }
    shelfEgg.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", `egg:${index}`);
      event.dataTransfer.effectAllowed = "copyMove";
    });
    eggShelf.appendChild(shelfEgg);
  });
}

function renderThemePicker() {
  if (!themePicker) {
    return;
  }
  themePicker.innerHTML = "";
  Object.entries(THEME_BACKGROUND_MAP).forEach(([theme, imagePath]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `theme-option${state.theme === theme ? " selected" : ""}`;
    btn.dataset.theme = theme;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", state.theme === theme ? "true" : "false");
    btn.title = THEME_LABEL_MAP[theme] || theme;

    const preview = document.createElement("span");
    preview.className = "theme-option-preview";
    preview.style.backgroundImage = `url("${imagePath}")`;
    btn.appendChild(preview);

    const name = document.createElement("span");
    name.className = "theme-option-name";
    name.textContent = THEME_LABEL_MAP[theme] || theme;
    btn.appendChild(name);

    btn.addEventListener("click", () => {
      state.theme = theme;
      renderThemePicker();
      renderScene();
    });

    themePicker.appendChild(btn);
  });
}

function sceneCoordsFromClient(clientX, clientY) {
  const rect = scene.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  return {
    x: Math.max(2, Math.min(98, x)),
    y: Math.max(2, Math.min(98, y)),
  };
}

function placeEggFromShelf(eggIndex, point) {
  if (eggIndex < 0 || eggIndex >= state.pendingEggs.length) {
    return;
  }
  const template = state.pendingEggs.splice(eggIndex, 1)[0];
  const egg = {
    ...template,
    x: point.x,
    y: point.y,
  };
  normalizeEgg(egg);
  state.eggs.push(egg);
  setSelection("egg", state.eggs.length - 1);
  renderScene();
  renderStatus();
}

function returnEggToShelf(eggIndex) {
  if (eggIndex < 0 || eggIndex >= state.eggs.length) {
    return;
  }
  const removed = state.eggs.splice(eggIndex, 1)[0];
  state.pendingEggs.push({
    found: false,
    pattern: removed.pattern ?? randomPattern(),
    asset: removed.asset ?? randomEggAsset(),
    scale: 1,
    rotate: 0,
    hitRadius: 4.9,
  });
}

function placePropFromShelf(kind, point) {
  if (!COMMON_PROP_KINDS.includes(kind)) {
    return;
  }
  const prop = {
    id: state.nextObjectId++,
    kind,
    x: point.x,
    y: point.y,
    rotate: 0,
    scale: 1,
    flipX: 1,
    opacity: 1,
  };
  normalizeProp(prop);
  state.sceneObjects.push(prop);
  setSelection("prop", state.sceneObjects.length - 1);
  renderScene();
  renderStatus();
}

function handleHideTap(event) {
  const point = sceneCoordsFromEvent(event);
  const handleEl = event.target.closest(".transform-handle");
  if (handleEl && state.selectedItem) {
    const obj = getSelectedObject();
    if (!obj) {
      return;
    }
    const handleType = handleEl.dataset.handle;
    if (handleType === "delete") {
      if (state.selectedItem.type === "egg") {
        returnEggToShelf(state.selectedItem.index);
      } else {
        state.sceneObjects.splice(state.selectedItem.index, 1);
      }
      clearSelection();
      state.dragging = null;
      renderScene();
      renderStatus();
      return;
    }
    if (handleType === "flip") {
      obj.flipX = obj.flipX === -1 ? 1 : -1;
      if (state.selectedItem.type === "egg") {
        normalizeEgg(obj);
      } else {
        normalizeProp(obj);
      }
      renderScene();
      renderStatus();
      return;
    }
    const center = objectCenterClientPx(obj);
    const dx = event.clientX - center.x;
    const dy = event.clientY - center.y;
    state.dragging = {
      mode: handleType,
      type: state.selectedItem.type,
      index: state.selectedItem.index,
      pointerId: event.pointerId,
      startRotate: obj.rotate ?? 0,
      startScale: obj.scale ?? 1,
      startAngle: Math.atan2(dy, dx),
      startDistance: Math.max(8, Math.sqrt(dx * dx + dy * dy)),
      moved: false,
    };
    return;
  }

  const hit = findObjectAt(point);
  if (hit) {
    setSelection(hit.type, hit.index);
    const selected = getSelectedObject();
    state.dragging = {
      mode: "move",
      type: hit.type,
      index: hit.index,
      pointerId: event.pointerId,
      dx: selected.x - point.x,
      dy: selected.y - point.y,
      moved: false,
      startPoint: point,
    };
    renderScene();
    return;
  }

  clearSelection();
  if (state.hideTool === "props") {
    renderStatus();
    return;
  }
  renderStatus();
}

function handleHideDrag(event) {
  if (!state.dragging || state.dragging.pointerId !== event.pointerId) {
    return;
  }
  const source = state.dragging.type === "egg" ? state.eggs : state.sceneObjects;
  const obj = source[state.dragging.index];
  if (!obj) {
    state.dragging = null;
    return;
  }
  if (state.dragging.mode === "move") {
    const point = sceneCoordsFromEvent(event);
    obj.x = clamp(point.x + state.dragging.dx, 2, 98);
    obj.y = clamp(point.y + state.dragging.dy, 2, 98);
    state.dragging.moved =
      Math.abs(point.x - state.dragging.startPoint.x) > 0.2 ||
      Math.abs(point.y - state.dragging.startPoint.y) > 0.2;
    renderScene();
    return;
  }

  const center = objectCenterClientPx(obj);
  const dx = event.clientX - center.x;
  const dy = event.clientY - center.y;
  if (state.dragging.mode === "rotate") {
    const angle = Math.atan2(dy, dx);
    const deltaDeg = ((angle - state.dragging.startAngle) * 180) / Math.PI;
    obj.rotate = clamp(state.dragging.startRotate + deltaDeg, -180, 180);
    state.dragging.moved = true;
  } else if (state.dragging.mode === "scale") {
    const dist = Math.max(8, Math.sqrt(dx * dx + dy * dy));
    const ratio = dist / state.dragging.startDistance;
    obj.scale = clamp(state.dragging.startScale * ratio, 0.55, 1.9);
    state.dragging.moved = true;
  }

  if (state.dragging.type === "egg") {
    normalizeEgg(obj);
  } else {
    normalizeProp(obj);
  }
  renderScene();
}

function endHideDrag(event) {
  if (!state.dragging || state.dragging.pointerId !== event.pointerId) {
    return;
  }
  state.dragging = null;
}

function handleFindTap(event) {
  const point = sceneCoordsFromEvent(event);

  const propMatch = [...state.sceneObjects]
    .reverse()
    .find((prop) => !prop.removing && distance(prop, point) < propHitRadius(prop));
  if (propMatch) {
    playPropTapSfx();
    propMatch.removing = true;
    const propEl = scene.querySelector(`.scene-object[data-prop-id="${propMatch.id}"]`);
    if (propEl) {
      const throwLeft = Math.random() < 0.5;
      const throwX = throwLeft ? -220 : 220;
      const spin = throwLeft ? -110 : 110;
      propEl.animate(
        [
          { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
          { transform: "translate(calc(-50% - 6px), -50%) rotate(-8deg)", opacity: 1, offset: 0.18 },
          { transform: "translate(calc(-50% + 8px), -50%) rotate(8deg)", opacity: 1, offset: 0.34 },
          {
            transform: `translate(calc(-50% + ${throwX}px), calc(-50% - 180px)) rotate(${spin}deg)`,
            opacity: 1,
            offset: 1,
          },
        ],
        { duration: 420, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" }
      );
    }
    setTimeout(() => {
      const idx = state.sceneObjects.findIndex((p) => p.id === propMatch.id);
      if (idx >= 0) {
        state.sceneObjects.splice(idx, 1);
        renderScene();
      }
    }, 420);
    return;
  }

  const match = state.eggs.find(
    (egg) => !egg.found && distance(egg, point) < (egg.hitRadius ?? 5.5)
  );

  if (!match) {
    playMissTapSfx();
    return;
  }

  playEggFoundSfx();
  match.found = true;
  match.foundAt = Date.now();
  state.foundCount += 1;
  renderScene();
  renderStatus();
  spawnFoundBurst(match);

  if (state.foundCount === state.totalEggs) {
    finishHunt();
  }
}

function spawnFoundBurst(egg) {
  if (!egg || !scene) {
    return;
  }

  const burst = document.createElement("div");
  burst.className = "found-burst";
  burst.style.left = `${egg.x}%`;
  burst.style.top = `${egg.y}%`;

  for (let i = 0; i < 8; i += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";
    sparkle.style.setProperty("--spark-angle", `${i * 45 + Math.floor(Math.random() * 12 - 6)}deg`);
    sparkle.style.setProperty("--spark-distance", `${28 + Math.floor(Math.random() * 16)}px`);
    sparkle.style.setProperty("--spark-delay", `${i * 20}ms`);
    burst.appendChild(sparkle);
  }

  scene.appendChild(burst);
  setTimeout(() => burst.remove(), 650);
}

function useHint() {
  if (state.mode !== "find" || state.wandUses < 1) {
    return;
  }

  const remaining = state.eggs.filter((egg) => !egg.found);
  if (remaining.length === 0) {
    return;
  }

  state.wandUses -= 1;
  playWandSfx();
  renderStatus();

  const target = remaining[Math.floor(Math.random() * remaining.length)];
  const ring = document.createElement("div");
  ring.className = "hint-ring";
  ring.style.left = `${target.x}%`;
  ring.style.top = `${target.y}%`;
  scene.appendChild(ring);

  setTimeout(() => ring.remove(), 1500);
}

function renderScene() {
  scene.className = `scene ${state.theme}`;
  const backgroundPath = THEME_BACKGROUND_MAP[state.theme];
  if (backgroundPath) {
    scene.style.backgroundImage = `url("${backgroundPath}")`;
  } else {
    scene.style.backgroundImage = "";
  }
  scene.innerHTML = "";

  state.eggs.forEach((egg, index) => {
    const eggEl = document.createElement("div");
    const pattern = egg.pattern ?? 0;
    const hasAsset = Boolean(egg.asset);
    const justFound = egg.found && egg.foundAt && Date.now() - egg.foundAt < 900;
    eggEl.className = `egg${hasAsset ? " image-egg" : ` pattern-${pattern}`}${egg.found ? " found" : ""}${justFound ? " found-pop" : ""}`;
    eggEl.style.left = `${egg.x}%`;
    eggEl.style.top = `${egg.y}%`;
    eggEl.style.setProperty("--egg-scale", String(egg.scale ?? 1));
    eggEl.style.setProperty("--egg-found-scale", "1.9");
    eggEl.style.setProperty("--egg-rotate", `${egg.rotate ?? 0}deg`);
    eggEl.style.setProperty("--egg-flip-x", String(egg.flipX ?? 1));
    if (hasAsset) {
      eggEl.style.backgroundImage = `url("${egg.asset}")`;
    }
    if (
      state.mode === "hide" &&
      state.selectedItem &&
      state.selectedItem.type === "egg" &&
      state.selectedItem.index === index
    ) {
      eggEl.classList.add("selected");
    }
    scene.appendChild(eggEl);
  });

  state.sceneObjects.forEach((obj, index) => {
    const objectEl = document.createElement("div");
    objectEl.className = "scene-object";
    const propAsset = PROP_ASSET_MAP[obj.kind];
    if (!propAsset) {
      return;
    }
    objectEl.classList.add("image-prop");
    objectEl.style.backgroundImage = `url("${propAsset}")`;
    objectEl.style.left = `${obj.x}%`;
    objectEl.style.top = `${obj.y}%`;
    objectEl.dataset.propId = String(obj.id);
    objectEl.style.setProperty("--rot", `${obj.rotate}deg`);
    objectEl.style.setProperty("--scale", String(obj.scale));
    objectEl.style.setProperty("--flip-x", String(obj.flipX ?? 1));
    objectEl.style.opacity = String(obj.opacity);
    if (
      state.mode === "hide" &&
      state.selectedItem &&
      state.selectedItem.type === "prop" &&
      state.selectedItem.index === index
    ) {
      objectEl.classList.add("selected");
    }
    scene.appendChild(objectEl);
  });

  if (state.mode === "hide" && state.selectedItem) {
    const obj = getSelectedObject();
    if (obj) {
      const center = objectCenterPx(obj);
      const baseRadius = (state.selectedItem.type === "egg" ? 26 : 32) * (obj.scale ?? 1);
      const angleRad = ((obj.rotate ?? 0) * Math.PI) / 180;
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);

      const rotateBase = { x: baseRadius, y: -baseRadius };
      const rotateOffset = {
        x: rotateBase.x * cosA - rotateBase.y * sinA,
        y: rotateBase.x * sinA + rotateBase.y * cosA,
      };

      const scaleBase = { x: baseRadius, y: baseRadius };
      const scaleOffset = {
        x: scaleBase.x * cosA - scaleBase.y * sinA,
        y: scaleBase.x * sinA + scaleBase.y * cosA,
      };
      const flipBase = { x: -baseRadius, y: -baseRadius };
      const flipOffset = {
        x: flipBase.x * cosA - flipBase.y * sinA,
        y: flipBase.x * sinA + flipBase.y * cosA,
      };
      const deleteBase = { x: -baseRadius, y: baseRadius };
      const deleteOffset = {
        x: deleteBase.x * cosA - deleteBase.y * sinA,
        y: deleteBase.x * sinA + deleteBase.y * cosA,
      };

      const rotateHandle = document.createElement("div");
      rotateHandle.className = "transform-handle rotate-handle";
      rotateHandle.dataset.handle = "rotate";
      rotateHandle.style.left = `${center.x + rotateOffset.x}px`;
      rotateHandle.style.top = `${center.y + rotateOffset.y}px`;
      rotateHandle.style.setProperty("--handle-rotate", `${obj.rotate ?? 0}deg`);
      rotateHandle.textContent = "⟲";
      rotateHandle.title = "Rotate";
      scene.appendChild(rotateHandle);

      const scaleHandle = document.createElement("div");
      scaleHandle.className = "transform-handle scale-handle";
      scaleHandle.dataset.handle = "scale";
      scaleHandle.style.left = `${center.x + scaleOffset.x}px`;
      scaleHandle.style.top = `${center.y + scaleOffset.y}px`;
      scaleHandle.style.setProperty("--handle-rotate", `${obj.rotate ?? 0}deg`);
      scaleHandle.textContent = "↔";
      scaleHandle.title = "Scale";
      scene.appendChild(scaleHandle);

      const flipHandle = document.createElement("div");
      flipHandle.className = "transform-handle flip-handle";
      flipHandle.dataset.handle = "flip";
      flipHandle.style.left = `${center.x + flipOffset.x}px`;
      flipHandle.style.top = `${center.y + flipOffset.y}px`;
      flipHandle.style.setProperty("--handle-rotate", `${obj.rotate ?? 0}deg`);
      flipHandle.textContent = "⇋";
      flipHandle.title = "Flip";
      scene.appendChild(flipHandle);

      const deleteHandle = document.createElement("div");
      deleteHandle.className = "transform-handle delete-handle";
      deleteHandle.dataset.handle = "delete";
      deleteHandle.style.left = `${center.x + deleteOffset.x}px`;
      deleteHandle.style.top = `${center.y + deleteOffset.y}px`;
      deleteHandle.style.setProperty("--handle-rotate", `${obj.rotate ?? 0}deg`);
      deleteHandle.textContent = "✕";
      deleteHandle.title = "Delete";
      scene.appendChild(deleteHandle);
    }
  }
}

function finishHunt() {
  winSummary.textContent = `You found all ${state.totalEggs} eggs in the ${state.theme} theme.`;
  state.mode = "complete";
  showScreen("game");
  renderStatus();
  playCelebrationSfx();
  startCelebrationFireworks();
}

eggMinusBtn.addEventListener("click", () => {
  setEggCount(state.totalEggs - 1);
});

eggPlusBtn.addEventListener("click", () => {
  setEggCount(state.totalEggs + 1);
});

soundToggleBtn.addEventListener("click", () => {
  state.soundEnabled = !state.soundEnabled;
  localStorage.setItem("egghunt_sound_enabled", state.soundEnabled ? "1" : "0");
  updateSoundButton();
});

musicToggleBtn.addEventListener("click", () => {
  state.musicEnabled = !state.musicEnabled;
  localStorage.setItem("egghunt_music_enabled", state.musicEnabled ? "1" : "0");
  updateMusicButton();
  syncBackgroundMusic();
});

startHideBtn.addEventListener("click", startHideMode);
eggToolBtn.addEventListener("click", () => {
  state.hideTool = "eggs";
  renderStatus();
});
propToolBtn.addEventListener("click", () => {
  state.hideTool = "props";
  renderStatus();
});
nextBtn.addEventListener("click", () => {
  if (state.mode === "hide") {
    startFindMode();
    return;
  }
  if (state.mode === "find") {
    replayCurrentHunt();
  }
});
hintBtn.addEventListener("click", useHint);
restartBtn.addEventListener("click", resetRound);
playAgainBtn.addEventListener("click", replayCurrentHunt);
newHuntBtn.addEventListener("click", resetRound);

scene.addEventListener("pointerdown", (event) => {
  if (state.mode === "hide") {
    event.preventDefault();
    handleHideTap(event);
  } else if (state.mode === "find") {
    handleFindTap(event);
  }
});
scene.addEventListener("pointermove", (event) => {
  if (state.mode !== "hide") {
    return;
  }
  handleHideDrag(event);
});
scene.addEventListener("pointerup", (event) => {
  if (state.mode !== "hide") {
    return;
  }
  endHideDrag(event);
});
scene.addEventListener("pointercancel", (event) => {
  if (state.mode !== "hide") {
    return;
  }
  endHideDrag(event);
});
scene.addEventListener("dragover", (event) => {
  if (state.mode !== "hide") {
    return;
  }
  event.preventDefault();
  scene.classList.add("drop-active");
});
scene.addEventListener("dragleave", () => {
  scene.classList.remove("drop-active");
});
scene.addEventListener("drop", (event) => {
  if (state.mode !== "hide") {
    return;
  }
  event.preventDefault();
  scene.classList.remove("drop-active");
  const raw = event.dataTransfer.getData("text/plain");
  const point = sceneCoordsFromClient(event.clientX, event.clientY);
  if (raw.startsWith("egg:")) {
    const index = Number(raw.slice(4));
    if (!Number.isInteger(index)) {
      return;
    }
    placeEggFromShelf(index, point);
    return;
  }
  if (raw.startsWith("prop:")) {
    placePropFromShelf(raw.slice(5), point);
  }
});
scene.addEventListener("contextmenu", (event) => event.preventDefault());

const savedSoundEnabled = localStorage.getItem("egghunt_sound_enabled");
if (savedSoundEnabled === "0") {
  state.soundEnabled = false;
}
const savedMusicEnabled = localStorage.getItem("egghunt_music_enabled");
if (savedMusicEnabled === "0") {
  state.musicEnabled = false;
}
updateMusicButton();
updateSoundButton();
syncBackgroundMusic();
setEggCount(state.totalEggs);
document.addEventListener(
  "pointerdown",
  () => {
    syncBackgroundMusic();
  },
  { once: true }
);
renderThemePicker();
resetRound();
