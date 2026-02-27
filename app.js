const state = {
  mode: "setup",
  screen: "setup",
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
  helpOpen: false,
};

const BGM_PATH = "assets/audio/bgm_main.mp3";
const SETTINGS_KEYS = {
  sound: "egghunt_sound_enabled",
  music: "egghunt_music_enabled",
  runtime: "egghunt_runtime_state_v1",
  metrics: "egghunt_metrics_v1",
};

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
const helpBtn = document.getElementById("helpBtn");
const setupMusicToggleBtn = document.getElementById("setupMusicToggleBtn");
const setupSoundToggleBtn = document.getElementById("setupSoundToggleBtn");
const musicToggleBtn = document.getElementById("musicToggleBtn");
const soundToggleBtn = document.getElementById("soundToggleBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const newHuntBtn = document.getElementById("newHuntBtn");
const winSummary = document.getElementById("winSummary");
const completePanel = document.getElementById("completePanel");
const helpModal = document.getElementById("helpModal");
const helpTitle = document.getElementById("helpTitle");
const helpBody = document.getElementById("helpBody");
const helpCloseBtn = document.getElementById("helpCloseBtn");
const toast = document.getElementById("toast");
const dragGhost = document.getElementById("dragGhost");
const rotateOverlay = document.getElementById("rotateOverlay");
let audioCtx = null;
let bgmAudio = null;
let bgmPausedByLifecycle = false;
let persistTimer = null;
let toastTimer = null;
let helpLastFocus = null;
let shelfDragState = null;
let mobileShelfFallbackEnabled = false;
let orientationLockActive = false;
const EGG_MIN_COUNT = 3;
const EGG_MAX_COUNT = 12;
const HELP_COPY = {
  hide: [
    "Press and hold an egg or prop in the shelf.",
    "Drag into the scene and release to place it.",
    "Tap placed items to move, rotate, scale, flip, or delete.",
    "Place all eggs, then tap Pass to Finder.",
  ],
  find: [
    "Tap eggs to find them all.",
    "Props are distractions and can be tapped away.",
    "Use Magic Wand to reveal one hidden egg.",
    "Find every egg to finish the hunt.",
  ],
  complete: ["Great job! Start a new hunt or replay this scene."],
};

function showScreen(name) {
  state.screen = name;
  setupScreen.classList.toggle("active", name === "setup");
  gameScreen.classList.toggle("active", name === "game");
  void setOrientationForScreen(name);
  updateRotateOverlay();
  setTimeout(updateRotateOverlay, 120);
  setTimeout(updateRotateOverlay, 420);
}

function updateSoundButton() {
  if (soundToggleBtn) {
    soundToggleBtn.textContent = state.soundEnabled ? "🔊" : "🔇";
    soundToggleBtn.setAttribute("aria-pressed", state.soundEnabled ? "true" : "false");
    soundToggleBtn.setAttribute("aria-label", state.soundEnabled ? "Sound on" : "Sound off");
    soundToggleBtn.title = state.soundEnabled ? "Sound on" : "Sound off";
  }
  if (setupSoundToggleBtn) {
    setupSoundToggleBtn.textContent = state.soundEnabled ? "🔊" : "🔇";
    setupSoundToggleBtn.setAttribute("aria-pressed", state.soundEnabled ? "true" : "false");
    setupSoundToggleBtn.setAttribute("aria-label", state.soundEnabled ? "Sound on" : "Sound off");
    setupSoundToggleBtn.title = state.soundEnabled ? "Sound on" : "Sound off";
  }
}

function updateMusicButton() {
  if (musicToggleBtn) {
    musicToggleBtn.textContent = state.musicEnabled ? "🎵" : "🔇";
    musicToggleBtn.setAttribute("aria-pressed", state.musicEnabled ? "true" : "false");
    musicToggleBtn.setAttribute("aria-label", state.musicEnabled ? "Music on" : "Music off");
    musicToggleBtn.title = state.musicEnabled ? "Music on" : "Music off";
  }
  if (setupMusicToggleBtn) {
    setupMusicToggleBtn.textContent = state.musicEnabled ? "🎵" : "🔇";
    setupMusicToggleBtn.setAttribute("aria-pressed", state.musicEnabled ? "true" : "false");
    setupMusicToggleBtn.setAttribute("aria-label", state.musicEnabled ? "Music on" : "Music off");
    setupMusicToggleBtn.title = state.musicEnabled ? "Music on" : "Music off";
  }
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

function setEggCount(value) {
  state.totalEggs = clamp(Number(value) || EGG_MIN_COUNT, EGG_MIN_COUNT, EGG_MAX_COUNT);
  eggCountValue.textContent = String(state.totalEggs);
  schedulePersistRuntimeState();
}

function showToast(message) {
  if (!toast) {
    return;
  }
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 1800);
}

function getHelpMode() {
  if (state.mode === "hide") {
    return "hide";
  }
  if (state.mode === "find") {
    return "find";
  }
  return "complete";
}

function openHelpModal() {
  if (!helpModal) {
    return;
  }
  helpLastFocus = document.activeElement;
  const mode = getHelpMode();
  helpTitle.textContent = mode === "hide" ? "Help: Place Egg Mode" : "Help: Find Mode";
  helpBody.innerHTML = "";
  HELP_COPY[mode].forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    helpBody.appendChild(li);
  });
  helpModal.hidden = false;
  helpModal.setAttribute("aria-hidden", "false");
  state.helpOpen = true;
  helpCloseBtn.focus();
  trackEvent("helpOpened");
  if (state.dragging) {
    state.dragging = null;
  }
}

function closeHelpModal() {
  if (!helpModal || helpModal.hidden) {
    return;
  }
  helpModal.hidden = true;
  helpModal.setAttribute("aria-hidden", "true");
  state.helpOpen = false;
  if (helpLastFocus && typeof helpLastFocus.focus === "function") {
    helpLastFocus.focus();
  }
}

function isLandscape() {
  const bySize = window.innerWidth >= window.innerHeight;
  if (window.screen && window.screen.orientation && typeof window.screen.orientation.angle === "number") {
    const angle = Math.abs(window.screen.orientation.angle) % 180;
    const byAngle = angle === 90;
    return bySize || byAngle;
  }
  return bySize;
}

async function setOrientationForScreen(screenName) {
  const orientationApi = window.screen && window.screen.orientation;
  if (!orientationApi || typeof orientationApi.lock !== "function") {
    orientationLockActive = false;
    updateRotateOverlay();
    return;
  }

  try {
    if (screenName === "game") {
      await orientationApi.lock("landscape");
      orientationLockActive = true;
    } else if (typeof orientationApi.unlock === "function") {
      orientationApi.unlock();
      orientationLockActive = false;
    }
  } catch {
    orientationLockActive = false;
  }
  updateRotateOverlay();
}

function updateRotateOverlay() {
  const shouldShow = false;
  rotateOverlay.hidden = !shouldShow;
}

function trackEvent(name) {
  const raw = localStorage.getItem(SETTINGS_KEYS.metrics);
  const metrics = raw ? JSON.parse(raw) : {};
  metrics[name] = (metrics[name] || 0) + 1;
  metrics.lastUpdatedAt = Date.now();
  localStorage.setItem(SETTINGS_KEYS.metrics, JSON.stringify(metrics));
}

function persistRuntimeState() {
  const snapshot = {
    mode: state.mode,
    theme: state.theme,
    totalEggs: state.totalEggs,
    eggs: state.eggs,
    sceneObjects: state.sceneObjects,
    nextObjectId: state.nextObjectId,
    pendingEggs: state.pendingEggs,
    hideTool: state.hideTool,
    selectedPropKind: state.selectedPropKind,
    foundCount: state.foundCount,
    wandUses: state.wandUses,
    soundEnabled: state.soundEnabled,
    musicEnabled: state.musicEnabled,
    timestamp: Date.now(),
  };
  localStorage.setItem(SETTINGS_KEYS.runtime, JSON.stringify(snapshot));
}

function schedulePersistRuntimeState() {
  if (persistTimer) {
    clearTimeout(persistTimer);
  }
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistRuntimeState();
  }, 350);
}

function applySnapshot(snapshot) {
  state.mode = snapshot.mode || "setup";
  state.theme = THEME_BACKGROUND_MAP[snapshot.theme] ? snapshot.theme : "garden";
  state.totalEggs = Number(snapshot.totalEggs) || 6;
  state.eggs = Array.isArray(snapshot.eggs) ? snapshot.eggs : [];
  state.sceneObjects = Array.isArray(snapshot.sceneObjects) ? snapshot.sceneObjects : [];
  state.nextObjectId = Number(snapshot.nextObjectId) || 1;
  state.pendingEggs = Array.isArray(snapshot.pendingEggs) ? snapshot.pendingEggs : [];
  state.hideTool = snapshot.hideTool === "props" ? "props" : "eggs";
  state.selectedPropKind = COMMON_PROP_KINDS.includes(snapshot.selectedPropKind)
    ? snapshot.selectedPropKind
    : COMMON_PROP_KINDS[0];
  state.selectedItem = null;
  state.dragging = null;
  state.foundCount = Number(snapshot.foundCount) || 0;
  state.wandUses = Number(snapshot.wandUses);
  if (!Number.isFinite(state.wandUses)) {
    state.wandUses = 3;
  }
  state.soundEnabled = snapshot.soundEnabled !== false;
  state.musicEnabled = snapshot.musicEnabled !== false;

  state.eggs.forEach((egg) => normalizeEgg(egg));
  state.sceneObjects.forEach((prop) => normalizeProp(prop));

  setEggCount(state.totalEggs);
}

function restoreRuntimeState() {
  const raw = localStorage.getItem(SETTINGS_KEYS.runtime);
  if (!raw) {
    return false;
  }

  try {
    const snapshot = JSON.parse(raw);
    if (!snapshot || typeof snapshot !== "object") {
      return false;
    }
    applySnapshot(snapshot);
    return true;
  } catch {
    return false;
  }
}

function handleLifecycleStateChange(isVisible) {
  if (!isVisible) {
    if (bgmAudio && !bgmAudio.paused) {
      bgmPausedByLifecycle = true;
      bgmAudio.pause();
    } else {
      bgmPausedByLifecycle = false;
    }
    if (audioCtx && audioCtx.state === "running") {
      audioCtx.suspend();
    }
    persistRuntimeState();
    return;
  }

  if (state.musicEnabled && bgmPausedByLifecycle) {
    syncBackgroundMusic();
    bgmPausedByLifecycle = false;
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function resetRound() {
  closeHelpModal();
  clearShelfDragState();
  mobileShelfFallbackEnabled = false;
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
  schedulePersistRuntimeState();
}

function startHideMode() {
  clearShelfDragState();
  state.mode = "hide";
  mobileShelfFallbackEnabled = false;
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
  trackEvent("huntsStarted");
  schedulePersistRuntimeState();
}

function startFindMode() {
  state.mode = "find";
  renderScene();
  renderStatus();
  schedulePersistRuntimeState();
}

function replayCurrentHunt() {
  state.mode = "find";
  state.foundCount = 0;
  state.wandUses = 3;
  state.eggs.forEach((egg) => {
    egg.found = false;
    egg.foundAt = null;
  });
  state.selectedItem = null;
  state.dragging = null;
  showScreen("game");
  renderScene();
  renderStatus();
  trackEvent("replays");
  schedulePersistRuntimeState();
}

function renderStatus() {
  if (state.mode === "hide") {
    if (restartBtn) {
      restartBtn.textContent = "↺";
      restartBtn.setAttribute("aria-label", "Start over");
      restartBtn.title = "Start over";
    }
    modeText.textContent =
      state.hideTool === "eggs" ? "Hide Mode: Place eggs in the scene." : "Hide Mode: Place props in the scene.";
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
    if (restartBtn) {
      restartBtn.textContent = "↺";
      restartBtn.setAttribute("aria-label", "Start over");
      restartBtn.title = "Start over";
    }
    modeText.textContent = "Find Mode: Tap to find eggs.";
    counterText.textContent = `Found: ${state.foundCount}/${state.totalEggs}`;
    nextBtn.disabled = true;
    nextBtn.textContent = "Pass to Finder";
    nextBtn.hidden = true;
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
    if (restartBtn) {
      restartBtn.textContent = "↺";
      restartBtn.setAttribute("aria-label", "Start over");
      restartBtn.title = "Start over";
    }
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

function clearShelfDragState() {
  shelfDragState = null;
  if (dragGhost) {
    dragGhost.hidden = true;
    dragGhost.classList.remove("prop");
    dragGhost.style.backgroundImage = "";
  }
}

function updateDragGhostFromPointer(event) {
  if (!dragGhost) {
    return;
  }
  dragGhost.style.left = `${event.clientX}px`;
  dragGhost.style.top = `${event.clientY}px`;
}

function activateTapPlaceFallback() {
  if (mobileShelfFallbackEnabled) {
    return;
  }
  mobileShelfFallbackEnabled = true;
  showToast("Using tap-then-place mode for shelf items.");
}

function queueTapPlacement(sourceType, index, kind = null) {
  shelfDragState = {
    sourceType,
    index,
    kind,
    stage: "tap-await-scene",
  };
  showToast("Tap the scene to place item.");
}

function beginShelfGhostDrag({ sourceType, index, kind, asset, pointerId, event }) {
  shelfDragState = {
    pointerId,
    sourceType,
    index,
    kind,
    asset,
    stage: "ghost",
    moved: false,
    startX: event.clientX,
    startY: event.clientY,
  };
  if (!dragGhost) {
    activateTapPlaceFallback();
    queueTapPlacement(sourceType, index, kind);
    return;
  }
  dragGhost.hidden = false;
  dragGhost.classList.toggle("prop", sourceType === "prop");
  dragGhost.style.backgroundImage = asset ? `url("${asset}")` : "";
  updateDragGhostFromPointer(event);
}

function attachShelfInteraction(button, config) {
  button.addEventListener("pointerdown", (event) => {
    if (state.mode !== "hide") {
      return;
    }
    event.preventDefault();
    if (mobileShelfFallbackEnabled) {
      queueTapPlacement(config.sourceType, config.getIndex(), config.kind || null);
      return;
    }
    beginShelfGhostDrag({
      ...config,
      pointerId: event.pointerId,
      event,
      index: config.getIndex(),
    });
  });
}

function handleGlobalShelfPointerMove(event) {
  if (!shelfDragState || shelfDragState.pointerId !== event.pointerId || shelfDragState.stage !== "ghost") {
    return;
  }
  const dx = event.clientX - shelfDragState.startX;
  const dy = event.clientY - shelfDragState.startY;
  if (dx * dx + dy * dy > 36) {
    shelfDragState.moved = true;
  }
  updateDragGhostFromPointer(event);
}

function handleGlobalShelfPointerUp(event) {
  if (!shelfDragState || shelfDragState.pointerId !== event.pointerId) {
    return;
  }
  const current = shelfDragState;
  if (current.stage !== "ghost") {
    return;
  }
  const rect = scene.getBoundingClientRect();
  const insideScene =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;
  if (insideScene) {
    const point = sceneCoordsFromClient(event.clientX, event.clientY);
    if (current.sourceType === "egg") {
      placeEggFromShelf(current.index, point);
    } else {
      placePropFromShelf(current.kind, point);
    }
  } else {
    const upDx = event.clientX - current.startX;
    const upDy = event.clientY - current.startY;
    const movedEnough = current.moved || upDx * upDx + upDy * upDy > 36;
    if (!movedEnough) {
      queueTapPlacement(current.sourceType, current.index, current.kind || null);
      if (dragGhost) {
        dragGhost.hidden = true;
      }
      return;
    }
    showToast("Drop inside the scene to place.");
  }
  clearShelfDragState();
}

function renderPropPicker() {
  propPicker.innerHTML = "";
  if (state.mode !== "hide" || state.hideTool !== "props") {
    return;
  }
  propShelfLabel.textContent = "Prop Shelf (press-hold and drop)";

  COMMON_PROP_KINDS.forEach((kind) => {
    const propEl = document.createElement("button");
    propEl.type = "button";
    propEl.className = "shelf-prop";
    propEl.dataset.kind = kind;
    propEl.title = `Press and hold to place ${kind.replace("-", " ")}`;
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
    attachShelfInteraction(propEl, {
      sourceType: "prop",
      kind,
      asset: propAsset,
      getIndex: () => -1,
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
    shelfEgg.dataset.eggIndex = String(index);
    shelfEgg.title = "Press and hold to place in scene";
    if (egg.asset) {
      shelfEgg.style.backgroundImage = `url("${egg.asset}")`;
      shelfEgg.classList.add("image-egg");
    } else {
      shelfEgg.classList.add(`pattern-${egg.pattern ?? 0}`);
    }
    attachShelfInteraction(shelfEgg, {
      sourceType: "egg",
      kind: null,
      asset: egg.asset,
      getIndex: () => index,
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
      schedulePersistRuntimeState();
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
  schedulePersistRuntimeState();
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
  schedulePersistRuntimeState();
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
  schedulePersistRuntimeState();
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
      schedulePersistRuntimeState();
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
      schedulePersistRuntimeState();
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
  schedulePersistRuntimeState();
}

function handleFindTap(event) {
  const point = sceneCoordsFromEvent(event);

  const propMatch = [...state.sceneObjects]
    .reverse()
    .find((prop) => !prop.removing && distance(prop, point) < propHitRadius(prop));
  if (propMatch) {
    playPropTapSfx();
    trackEvent("propHits");
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
        schedulePersistRuntimeState();
      }
    }, 420);
    return;
  }

  const match = state.eggs.find(
    (egg) => !egg.found && distance(egg, point) < (egg.hitRadius ?? 5.5)
  );

  if (!match) {
    playMissTapSfx();
    trackEvent("missTaps");
    return;
  }

  playEggFoundSfx();
  trackEvent("eggHits");
  match.found = true;
  match.foundAt = Date.now();
  state.foundCount += 1;
  renderScene();
  renderStatus();
  spawnFoundBurst(match);
  schedulePersistRuntimeState();

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
  trackEvent("hintsUsed");
  renderStatus();

  const target = remaining[Math.floor(Math.random() * remaining.length)];
  const ring = document.createElement("div");
  ring.className = "hint-ring";
  ring.style.left = `${target.x}%`;
  ring.style.top = `${target.y}%`;
  scene.appendChild(ring);

  setTimeout(() => ring.remove(), 1500);
  schedulePersistRuntimeState();
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
  trackEvent("huntsCompleted");
  schedulePersistRuntimeState();
}

eggMinusBtn.addEventListener("click", () => {
  setEggCount(state.totalEggs - 1);
});

eggPlusBtn.addEventListener("click", () => {
  setEggCount(state.totalEggs + 1);
});

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  localStorage.setItem(SETTINGS_KEYS.sound, state.soundEnabled ? "1" : "0");
  updateSoundButton();
  schedulePersistRuntimeState();
}

function toggleMusic() {
  state.musicEnabled = !state.musicEnabled;
  localStorage.setItem(SETTINGS_KEYS.music, state.musicEnabled ? "1" : "0");
  updateMusicButton();
  syncBackgroundMusic();
  schedulePersistRuntimeState();
}

soundToggleBtn.addEventListener("click", toggleSound);
setupSoundToggleBtn.addEventListener("click", toggleSound);
musicToggleBtn.addEventListener("click", toggleMusic);
setupMusicToggleBtn.addEventListener("click", toggleMusic);

startHideBtn.addEventListener("click", startHideMode);
eggToolBtn.addEventListener("click", () => {
  state.hideTool = "eggs";
  renderStatus();
});
propToolBtn.addEventListener("click", () => {
  state.hideTool = "props";
  renderStatus();
});
nextBtn.addEventListener("click", startFindMode);
hintBtn.addEventListener("click", useHint);
restartBtn.addEventListener("click", () => {
  closeHelpModal();
  resetRound();
});
playAgainBtn.addEventListener("click", replayCurrentHunt);
newHuntBtn.addEventListener("click", resetRound);
helpBtn.addEventListener("click", openHelpModal);
helpCloseBtn.addEventListener("click", closeHelpModal);
helpModal.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeModal === "true") {
    closeHelpModal();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeHelpModal();
  }
});

scene.addEventListener("pointerdown", (event) => {
  if (state.helpOpen) {
    return;
  }
  if (state.mode === "hide") {
    if (shelfDragState && shelfDragState.stage === "tap-await-scene") {
      event.preventDefault();
      const point = sceneCoordsFromEvent(event);
      if (shelfDragState.sourceType === "egg") {
        placeEggFromShelf(shelfDragState.index, point);
      } else if (shelfDragState.sourceType === "prop") {
        const kind = shelfDragState.kind || state.selectedPropKind || COMMON_PROP_KINDS[0];
        placePropFromShelf(kind, point);
      }
      clearShelfDragState();
      return;
    }
    event.preventDefault();
    handleHideTap(event);
  } else if (state.mode === "find") {
    handleFindTap(event);
  }
});
scene.addEventListener("pointermove", (event) => {
  if (state.helpOpen) {
    return;
  }
  if (state.mode !== "hide") {
    return;
  }
  handleHideDrag(event);
});
scene.addEventListener("pointerup", (event) => {
  if (state.helpOpen) {
    return;
  }
  if (state.mode !== "hide") {
    return;
  }
  endHideDrag(event);
});
scene.addEventListener("pointercancel", (event) => {
  if (state.helpOpen) {
    return;
  }
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
window.addEventListener("pointermove", handleGlobalShelfPointerMove);
window.addEventListener("pointerup", handleGlobalShelfPointerUp);
window.addEventListener("pointercancel", handleGlobalShelfPointerUp);

window.addEventListener("visibilitychange", () => {
  handleLifecycleStateChange(!document.hidden);
});
window.addEventListener("pagehide", () => {
  handleLifecycleStateChange(false);
});
window.addEventListener("pageshow", () => {
  handleLifecycleStateChange(true);
});
window.addEventListener("beforeunload", () => {
  persistRuntimeState();
});

const savedSoundEnabled = localStorage.getItem(SETTINGS_KEYS.sound);
const savedMusicEnabled = localStorage.getItem(SETTINGS_KEYS.music);
if (savedSoundEnabled === "0") state.soundEnabled = false;
if (savedMusicEnabled === "0") state.musicEnabled = false;
trackEvent("sessions");
updateMusicButton();
updateSoundButton();
syncBackgroundMusic();
document.addEventListener(
  "pointerdown",
  () => {
    syncBackgroundMusic();
  },
  { once: true }
);

window.addEventListener("resize", updateRotateOverlay);
window.addEventListener("orientationchange", updateRotateOverlay);

async function initializeApp() {
  try {
    restoreRuntimeState();
    renderThemePicker();
    renderPropPicker();
    renderScene();
    renderStatus();
    resetRound();
    showScreen("setup");
    renderThemePicker();
    renderPropPicker();
    renderScene();
    renderStatus();
  } catch {
    resetRound();
    showScreen("setup");
    renderThemePicker();
    renderPropPicker();
    renderScene();
    renderStatus();
  }
}

initializeApp();

window.EggHuntMetrics = {
  read() {
    const raw = localStorage.getItem(SETTINGS_KEYS.metrics);
    return raw ? JSON.parse(raw) : {};
  },
  clear() {
    localStorage.removeItem(SETTINGS_KEYS.metrics);
  },
};
