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
const eggCountInput = document.getElementById("eggCount");
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
const playAgainBtn = document.getElementById("playAgainBtn");
const newHuntBtn = document.getElementById("newHuntBtn");
const winSummary = document.getElementById("winSummary");
const completePanel = document.getElementById("completePanel");

function showScreen(name) {
  setupScreen.classList.toggle("active", name === "setup");
  gameScreen.classList.toggle("active", name === "game");
}

function resetRound() {
  state.mode = "setup";
  state.totalEggs = Number(eggCountInput.value);
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
  state.mode = "hide";
  state.totalEggs = Number(eggCountInput.value);
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
    nextBtn.disabled = true;
    nextBtn.textContent = "Pass to Finder";
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
    return;
  }

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
  renderStatus();

  const target = remaining[Math.floor(Math.random() * remaining.length)];
  const ring = document.createElement("div");
  ring.className = "hint-ring";
  ring.style.left = `${target.x}%`;
  ring.style.top = `${target.y}%`;
  scene.appendChild(ring);

  setTimeout(() => ring.remove(), 1200);
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
}

eggCountInput.addEventListener("input", () => {
  eggCountValue.textContent = eggCountInput.value;
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
nextBtn.addEventListener("click", startFindMode);
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

renderThemePicker();
resetRound();
