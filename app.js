const DEFAULT_FILL = "#eab308";
const DIM_FILL = "#293548";
const HOVER_FILL = "#64748b";
const CORRECT_FILL = "#22c55e";
const WRONG_FILL = "#ef4444";
const FLASH_MS = 500;
const STORAGE_KEY = "map-quiz-review-counts";
const LABEL_OVERRIDE_KEY = "map-quiz-label-overrides"; // { [continent]: { [id]: {x, y, fontSize} } }
const SVG_NS = "http://www.w3.org/2000/svg";

// Region keys are continent-prefixed (e.g. "europe-north", "asia-west",
// "oceania"). continentOf() strips the region down to which SVG file to
// load. Asia and Oceania share the same world map (no dedicated Commons
// file with ISO-coded per-country paths existed for either).
const CONTINENT_SVG = {
  europe: "maps/europe.svg",
  africa: "maps/africa.svg",
  americas: "maps/americas.svg",
  // No Wikimedia Commons file existed with a dedicated Asia-only map using
  // per-country ISO-code ids (the only labeling scheme our click/highlight
  // logic understands) — every candidate found was either a whole-world map
  // or used generic Inkscape-generated ids. asia.svg is generated from the
  // same verified world map data, just with a tight viewBox cropped to
  // Asia's own bounding box, so it doesn't render as a tiny sliver of the
  // whole world.
  asia: "maps/asia.svg"
};
const DATA_FILES = ["data/europe.json", "data/africa.json", "data/americas.json", "data/asia.json"];

// Some continent SVGs cover far more territory than a single region needs
// (americas.svg spans Canada down to Chile) — for those regions, crop to a
// tighter viewBox instead of showing the whole continent. Measured live from
// rendered country bounds, with padding for leader-line labels that extend
// past their country's own edge. Regions not listed here just show the full
// continent (unchanged default behavior).
const REGION_VIEWBOX = {
  "americas-south": "1180 570 1270 1470"
};

function applyRegionViewBox(region) {
  const desired = REGION_VIEWBOX[region] || svgRootEl.dataset.defaultViewBox;
  if (svgRootEl.getAttribute("viewBox") === desired) return;
  svgRootEl.setAttribute("viewBox", desired);
  // Label font sizes/positions were computed against the OLD viewBox's zoom
  // level — force a rebuild so they're sized right for the new one.
  labelsBuilt = false;
  labelsBuiltFor = null;
}

function continentOf(regionKey) {
  return regionKey.split("-")[0];
}

const titleEl = document.querySelector("header h1");
const DEFAULT_TITLE = titleEl.textContent;

function regionLabel(region) {
  const card = document.querySelector(`.region-card[data-region="${region}"] h3`);
  return card ? card.textContent : region;
}

const homeScreenEl = document.getElementById("home-screen");
const promptEl = document.getElementById("prompt");
const progressEl = document.getElementById("progress");
const mapWrapEl = document.getElementById("map-wrap");
const skipBtn = document.getElementById("skip-btn");
const homeBtn = document.getElementById("home-btn");
const learnQuizBtn = document.getElementById("learn-quiz-btn");
const resultsEl = document.getElementById("results");
const resultScoreEl = document.getElementById("result-score");
const rosterListEl = document.getElementById("roster-list");
const retryBtn = document.getElementById("retry-btn");
const resultsHomeBtn = document.getElementById("results-home-btn");
const zoomControlsEl = document.getElementById("zoom-controls");
const zoomInBtn = document.getElementById("zoom-in-btn");
const zoomOutBtn = document.getElementById("zoom-out-btn");
const zoomResetBtn = document.getElementById("zoom-reset-btn");
const saveLabelsBtn = document.getElementById("save-labels-btn");

let countries = [];       // [{id, name, region}] every country across all continents
let active = [];          // countries in the currently selected region
let currentRegion = null; // e.g. "europe-north"
let order = [];           // shuffled indices into `active` for this round
let cursor = 0;
let missed = new Set();
let paths = {};           // id -> [path elements], scoped to the currently-loaded map
let units = {};           // id -> top-level path/g element, scoped to the currently-loaded map
let locked = false;       // true while showing flash feedback
let mode = "idle";        // "idle" | "quiz" | "learn"
let labelsGroup = null;
let labelsBuilt = false;
let labelsBuiltFor = null; // which continent labelsGroup currently holds labels for
let labelBounds = null; // {minX, maxX, minY, maxY} from buildLabels, reused to re-clamp after collision nudging
let zoom = 1;
let svgRootEl = null;      // the currently-loaded inline <svg> root, our map surface
let dragState = null;      // { startX, startY, startScrollLeft, startScrollTop, moved }
let suppressNextClick = false; // set when a drag just happened, so it doesn't also register as an answer
let currentMapSvg = null;  // which maps/*.svg is currently loaded

// Per-country flashcard review count, persisted across sessions.
let reviewCounts = {};
try {
  reviewCounts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
} catch (e) {
  reviewCounts = {};
}

function saveReviewCounts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviewCounts));
}

let labelOverrides = {};
try {
  labelOverrides = JSON.parse(localStorage.getItem(LABEL_OVERRIDE_KEY)) || {};
} catch (e) {
  labelOverrides = {};
}

// A leader line drawn straight to the text's center point runs right
// through the glyphs. Clip it to where it crosses the text's own bounding
// box instead, so it visibly stops at the label's edge.
function trimLineToTextEdge(dotX, dotY, textCx, textCy, halfW, halfH) {
  const vx = dotX - textCx, vy = dotY - textCy;
  const ax = Math.abs(vx), ay = Math.abs(vy);
  if (ax < 1e-6 && ay < 1e-6) return { x: textCx, y: textCy };
  const pad = halfH * 0.25; // small gap so the line doesn't touch the glyphs
  const scale = Math.min(ax > 1e-6 ? (halfW + pad) / ax : Infinity, ay > 1e-6 ? (halfH + pad) / ay : Infinity);
  return { x: textCx + scale * vx, y: textCy + scale * vy };
}

// A filled dot exactly on a micro-state (Monaco, Vatican...) covers the
// entire clickable country underneath it, so nothing can be clicked to hear
// its pronunciation. An arrow is both less visually blocking and, unlike the
// old fixed dot, itself draggable — the user can pull it just off the
// country while it keeps pointing back at the true location.
function createLeaderArrow(id) {
  const arrow = document.createElementNS(SVG_NS, "polygon");
  arrow.setAttribute("points", "0,-5 4,4 -4,4");
  arrow.setAttribute("fill", "#0f172a");
  arrow.setAttribute("stroke", "#ffffff");
  arrow.setAttribute("stroke-width", 1);
  arrow.dataset.id = id;
  arrow.dataset.scaleMult = "1";
  return arrow;
}

function positionArrow(arrow, ax, ay, trueX, trueY, invScale) {
  const dx = trueX - ax, dy = trueY - ay;
  const angleDeg = (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) ? 0 : Math.atan2(dy, dx) * 180 / Math.PI + 90;
  const mult = parseFloat(arrow.dataset.scaleMult || "1");
  arrow.setAttribute("transform", `translate(${ax},${ay}) rotate(${angleDeg}) scale(${invScale * mult})`);
  arrow.dataset.ax = ax;
  arrow.dataset.ay = ay;
}

// Dragging the arrow moves the near end of the leader line with it (x1/y1)
// and keeps the arrow pointed at the country's real anchor point (trueX/Y)
// regardless of where it's dragged; the far end still re-trims to the
// text's edge since the text may have its own independent position.
function makeArrowInteractive(arrow, line, text, trueX, trueY) {
  arrow.style.pointerEvents = "auto";
  arrow.style.cursor = "move";
  let dragging = null;
  arrow.addEventListener("pointerdown", e => {
    if (mode !== "learn") return;
    e.stopPropagation();
    e.preventDefault();
    try { arrow.setPointerCapture(e.pointerId); } catch (err) { /* unsupported */ }
    dragging = { startX: e.clientX, startY: e.clientY, startAx: parseFloat(arrow.dataset.ax), startAy: parseFloat(arrow.dataset.ay) };
  });
  arrow.addEventListener("pointermove", e => {
    if (!dragging) return;
    e.stopPropagation();
    const ctm = svgRootEl.getScreenCTM();
    const ax = dragging.startAx + (e.clientX - dragging.startX) / ctm.a;
    const ay = dragging.startAy + (e.clientY - dragging.startY) / ctm.d;
    positionArrow(arrow, ax, ay, trueX, trueY, 1 / ctm.a);
    line.setAttribute("x1", ax);
    line.setAttribute("y1", ay);
    const halfW = text.getComputedTextLength() / 2;
    const halfH = parseFloat(text.getAttribute("font-size")) * 1.3 / 2;
    const edge = trimLineToTextEdge(ax, ay, parseFloat(text.getAttribute("x")), parseFloat(text.getAttribute("y")), halfW, halfH);
    line.setAttribute("x2", edge.x);
    line.setAttribute("y2", edge.y);
  });
  const endDrag = e => {
    if (!dragging) return;
    dragging = null;
    try { arrow.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
  };
  arrow.addEventListener("pointerup", endDrag);
  arrow.addEventListener("pointercancel", endDrag);
  arrow.addEventListener("wheel", e => {
    if (mode !== "learn") return;
    e.preventDefault();
    e.stopPropagation();
    const cur = parseFloat(arrow.dataset.scaleMult || "1");
    arrow.dataset.scaleMult = Math.max(0.3, Math.min(4, cur * (e.deltaY < 0 ? 1.1 : 0.9)));
    const ctm = svgRootEl.getScreenCTM();
    positionArrow(arrow, parseFloat(arrow.dataset.ax), parseFloat(arrow.dataset.ay), trueX, trueY, 1 / ctm.a);
  }, { passive: false });
}

// Drag-to-reposition and wheel-to-resize for leader-line labels, so the user
// can manually correct the cases the automatic placement search can't
// (dense clusters where every direction lands on some neighbor). Only wired
// up for leader-line text — inline labels stay auto-placed.
function makeLeaderLabelInteractive(text, line) {
  // The labels group has pointer-events:none so inline country-name labels
  // never block clicks on the country path underneath — override it back to
  // "auto" on just this text so it alone stays draggable/scrollable.
  text.style.pointerEvents = "auto";
  text.style.cursor = "move";
  let dragging = null;
  text.addEventListener("pointerdown", e => {
    if (mode !== "learn") return;
    e.stopPropagation();
    e.preventDefault();
    try { text.setPointerCapture(e.pointerId); } catch (err) { /* unsupported */ }
    dragging = {
      startX: e.clientX, startY: e.clientY,
      startTx: parseFloat(text.getAttribute("x")), startTy: parseFloat(text.getAttribute("y"))
    };
  });
  text.addEventListener("pointermove", e => {
    if (!dragging) return;
    e.stopPropagation();
    const ctm = svgRootEl.getScreenCTM();
    const nx = dragging.startTx + (e.clientX - dragging.startX) / ctm.a;
    const ny = dragging.startTy + (e.clientY - dragging.startY) / ctm.d;
    text.setAttribute("x", nx);
    text.setAttribute("y", ny);
    const halfW = text.getComputedTextLength() / 2;
    const halfH = parseFloat(text.getAttribute("font-size")) * 1.3 / 2;
    const edge = trimLineToTextEdge(parseFloat(line.getAttribute("x1")), parseFloat(line.getAttribute("y1")), nx, ny, halfW, halfH);
    line.setAttribute("x2", edge.x);
    line.setAttribute("y2", edge.y);
  });
  const endDrag = e => {
    if (!dragging) return;
    dragging = null;
    try { text.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
  };
  text.addEventListener("pointerup", endDrag);
  text.addEventListener("pointercancel", endDrag);
  text.addEventListener("wheel", e => {
    if (mode !== "learn") return;
    e.preventDefault();
    e.stopPropagation();
    const cur = parseFloat(text.getAttribute("font-size"));
    const next = Math.max(2, cur * (e.deltaY < 0 ? 1.1 : 0.9));
    text.setAttribute("font-size", next);
    text.setAttribute("stroke-width", next * (3 / 22));
    const halfW = text.getComputedTextLength() / 2;
    const halfH = next * 1.3 / 2;
    const tx = parseFloat(text.getAttribute("x")), ty = parseFloat(text.getAttribute("y"));
    const edge = trimLineToTextEdge(parseFloat(line.getAttribute("x1")), parseFloat(line.getAttribute("y1")), tx, ty, halfW, halfH);
    line.setAttribute("x2", edge.x);
    line.setAttribute("y2", edge.y);
  }, { passive: false });
}

// Bakes the current on-screen position/size of every leader-line label into
// localStorage, keyed by continent + country id. buildLabels reads these
// back on every rebuild and uses them verbatim instead of the computed
// anchor, and showLabelsFor's collision resolver skips locked labels so it
// never nudges a manually-placed one again.
saveLabelsBtn.addEventListener("click", () => {
  if (!labelsGroup || !labelsBuiltFor) return;
  const continent = labelsBuiltFor;
  const bucket = labelOverrides[continent] || (labelOverrides[continent] = {});
  labelsGroup.querySelectorAll('line[data-leader-line="1"]').forEach(line => {
    const id = line.dataset.id;
    const text = labelsGroup.querySelector(`text[data-id="${id}"]`);
    const arrow = labelsGroup.querySelector(`polygon[data-id="${id}"]`);
    if (!text) return;
    bucket[id] = {
      x: parseFloat(text.getAttribute("x")),
      y: parseFloat(text.getAttribute("y")),
      fontSize: parseFloat(text.getAttribute("font-size")),
      ax: arrow ? parseFloat(arrow.dataset.ax) : undefined,
      ay: arrow ? parseFloat(arrow.dataset.ay) : undefined,
      scale: arrow ? parseFloat(arrow.dataset.scaleMult) : undefined
    };
    text.dataset.locked = "1";
  });
  localStorage.setItem(LABEL_OVERRIDE_KEY, JSON.stringify(labelOverrides));
  const original = saveLabelsBtn.textContent;
  saveLabelsBtn.textContent = "已固定";
  setTimeout(() => { saveLabelsBtn.textContent = original; }, 1200);
});

function bumpReview(id) {
  reviewCounts[id] = (reviewCounts[id] || 0) + 1;
  saveReviewCounts();
}

function regionCountries(region) {
  return countries.filter(c => c.region === region);
}

// All countries belonging to whichever continent's map is currently loaded —
// used to scope fill/label operations so they don't touch ids that don't
// exist in the current SVG (they'd just be harmless no-ops via setFill's
// guard, but scoping is both correct and avoids wasted work).
function continentCountries(continent) {
  return countries.filter(c => continentOf(c.region) === continent);
}

function refreshHomeProgress() {
  homeScreenEl.querySelectorAll(".region-card").forEach(card => {
    const region = card.dataset.region;
    const list = regionCountries(region);
    // Every country in a region is bumped together, once per completed quiz
    // round (see finishRound), so they always share the same count — this is
    // "how many times this region's quiz has been completed", not coverage.
    const completions = list.length ? Math.max(0, ...list.map(c => reviewCounts[c.id] || 0)) : 0;
    card.querySelector(".region-progress").textContent =
      completions > 0 ? `Completed ${completions}x` : "";
  });
}

Promise.all(DATA_FILES.map(f => fetch(f, { cache: "no-store" }).then(r => r.json())))
  .then(results => {
    countries = results.flat();
    refreshHomeProgress();
  });

// Rebuilds click/hover/drag handling for whichever SVG is currently loaded.
// Runs once per successful ensureMapLoaded() — both on first load and every
// time we switch to a different continent's map.
function setupMap() {
  paths = {};
  units = {};
  labelsGroup = null;
  labelsBuilt = false;
  labelsBuiltFor = null;
  svgRootEl.dataset.defaultViewBox = svgRootEl.getAttribute("viewBox");

  // Drag-to-pan (like Google Maps) once zoomed in. #map-wrap has
  // overflow:auto (needed for the zoom scrollbars), which makes it natively
  // pannable by touch/trackpad — left unchecked, the browser's own
  // scroll-follows-pointer handling fights our manual scrollLeft/scrollTop
  // assignment below and the map visibly judders. touch-action:none hands
  // panning over to us exclusively.
  svgRootEl.style.touchAction = "none";

  svgRootEl.addEventListener("pointerdown", e => {
    dragState = {
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: mapWrapEl.scrollLeft,
      startScrollTop: mapWrapEl.scrollTop,
      pointerId: e.pointerId,
      moved: false
    };
    // Pointer capture is only requested once a real drag starts (see
    // pointermove below), not here on every press — capturing immediately on
    // pointerdown made some browsers retarget the subsequent "click" event
    // away from the country element even for a plain, no-movement click.
  });
  svgRootEl.addEventListener("pointermove", e => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (!dragState.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      dragState.moved = true;
      svgRootEl.style.cursor = "grabbing";
      if (zoom > 1) {
        try { svgRootEl.setPointerCapture(dragState.pointerId); } catch (err) { /* not all pointer sources support capture */ }
      }
    }
    if (dragState.moved && zoom > 1) {
      e.preventDefault();
      mapWrapEl.scrollLeft = dragState.startScrollLeft - dx;
      mapWrapEl.scrollTop = dragState.startScrollTop - dy;
    }
  });
  const endDrag = e => {
    if (!dragState) return;
    // Only a real pan (zoom > 1, where pointermove actually scrolled the map)
    // should eat the click — at zoom 1 there's no panning, so ordinary mouse
    // jitter between press and release must not swallow a normal click.
    if (dragState.moved && zoom > 1) suppressNextClick = true;
    dragState = null;
    svgRootEl.style.cursor = zoom > 1 ? "grab" : "default";
    if (e.pointerId != null) {
      try { svgRootEl.releasePointerCapture(e.pointerId); } catch (err) { /* already released or unsupported */ }
    }
  };
  svgRootEl.addEventListener("pointerup", endDrag);
  svgRootEl.addEventListener("pointercancel", endDrag);

  svgRootEl.querySelectorAll("[id]").forEach(unit => {
    if (!/^[a-z]{2}$/.test(unit.id)) return;
    // A country is either a plain <path id="xx"> or a <g id="xx"> wrapping
    // multiple <path> fragments (e.g. exclaves/islands like ru-main + ru-kaliningrad).
    const fillTargets = unit.tagName === "path" ? [unit] : Array.from(unit.querySelectorAll("path"));
    if (fillTargets.length === 0) return;
    paths[unit.id] = fillTargets;
    units[unit.id] = unit;
    fillTargets.forEach(p => {
      // Fringe territories baked into the base SVG but outside our dataset
      // (e.g. North Africa drawn on the Europe map) never get touched by
      // applyRegionDimming, since that only walks continentCountries(). If
      // this started them at DEFAULT_FILL they'd be stuck showing as
      // "active" (yellow) forever instead of receding into the background.
      p.style.fill = DIM_FILL;
      p.style.stroke = "#0f172a";
      p.style.strokeWidth = "1";
    });
    unit.style.cursor = "pointer";
    unit.addEventListener("mouseenter", () => {
      if (!locked && fillTargets[0].style.fill === DEFAULT_FILL) {
        fillTargets.forEach(p => (p.style.fill = HOVER_FILL));
      }
    });
    unit.addEventListener("mouseleave", () => {
      if (!locked && fillTargets[0].style.fill === HOVER_FILL) {
        fillTargets.forEach(p => (p.style.fill = DEFAULT_FILL));
      }
    });
    unit.addEventListener("click", () => {
      if (mode === "learn") onLearnClick(unit.id);
      else onCountryClick(unit.id);
    });
  });
}

// Fetches the SVG as text and injects it inline into #map-wrap, replacing
// whatever was there before. Resolves once it's ready to use; a no-op when
// the requested continent's map is already loaded (e.g. moving between two
// European regions in a row).
//
// <object data="..."> was tried first (matches how the original Europe map
// was embedded) but setting/changing .data via JS after the element exists
// doesn't reliably fire load/error in any browser — confirmed by direct
// testing, not an automation-only quirk. Inline SVG sidesteps the whole
// nested-document/plugin-activation layer and just becomes normal DOM.
function ensureMapLoaded(svgPath) {
  if (currentMapSvg === svgPath) return Promise.resolve();
  return fetch(svgPath, { cache: "no-store" })
    .then(r => r.text())
    .then(svgText => {
      const parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");
      const newRoot = document.adoptNode(parsed.documentElement);
      newRoot.id = "map";
      mapWrapEl.innerHTML = "";
      mapWrapEl.appendChild(newRoot);
      svgRootEl = newRoot;
      currentMapSvg = svgPath;
      setupMap();
    });
}

function setFill(id, color) {
  const targets = paths[id];
  if (targets) targets.forEach(p => (p.style.fill = color));
}

// Countries in the selected region get the normal default fill; the rest of
// the current continent's countries are dimmed so it's visually clear what's
// in play. Map features outside our dataset (fringe countries baked into the
// base SVG, e.g. unclaimed territories) are left alone.
function applyRegionDimming(activeIds, continent) {
  continentCountries(continent).forEach(c => setFill(c.id, activeIds.has(c.id) ? DEFAULT_FILL : DIM_FILL));
}

document.querySelectorAll(".learn-action").forEach(btn => {
  btn.addEventListener("click", () => startLearn(btn.dataset.region));
});
document.querySelectorAll(".quiz-action").forEach(btn => {
  btn.addEventListener("click", () => startRound(btn.dataset.region));
});
retryBtn.addEventListener("click", () => startRound(currentRegion));
resultsHomeBtn.addEventListener("click", goHome);
skipBtn.addEventListener("click", () => {
  if (locked || order.length === 0) return;
  missed.add(currentTarget().id);
  advance();
});
homeBtn.addEventListener("click", goHome);
learnQuizBtn.addEventListener("click", () => startRound(currentRegion));

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel(); // stop any clip still playing so clicks don't queue up
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  speechSynthesis.speak(utter);
}

const LABEL_ANCHOR_DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071]
];

// Finds a point (in screen coordinates) that's actually inside the given
// path elements and reasonably far from their edges, using the native
// isPointInFill() rather than DOM hit-testing (elementFromPoint can be
// fooled by z-order/overlapping siblings; isPointInFill checks the geometry
// directly). A country's bounding-box center is NOT a safe default — for a
// crescent shape like Norway, that point falls in open water. This is a
// cheap grid-search approximation of the "pole of inaccessibility" technique
// real map labeling uses. Returns null if no grid point landed inside at all
// (extremely thin sliver of a country) so the caller can fall back.
function findLabelAnchor(fillTargets, rect) {
  if (!fillTargets || !fillTargets.length) return null;
  const entries = fillTargets
    .map(p => {
      let inv;
      try { inv = p.getScreenCTM().inverse(); } catch (e) { return null; }
      return inv ? { path: p, inv } : null;
    })
    .filter(Boolean);
  if (!entries.length) return null;

  const probePt = svgRootEl.createSVGPoint();
  function insideAt(screenX, screenY) {
    probePt.x = screenX;
    probePt.y = screenY;
    for (const { path, inv } of entries) {
      const localPt = probePt.matrixTransform(inv);
      try {
        if (path.isPointInFill(localPt)) return true;
      } catch (e) { /* degenerate path, skip */ }
    }
    return false;
  }

  const GRID_N = 9;
  const maxR = Math.min(rect.width, rect.height) / 2;
  const step = Math.max(1, maxR / 4);
  let best = null;
  let bestClearance = -1;
  for (let i = 0; i <= GRID_N; i++) {
    for (let j = 0; j <= GRID_N; j++) {
      const x = rect.left + (rect.width * i) / GRID_N;
      const y = rect.top + (rect.height * j) / GRID_N;
      if (!insideAt(x, y)) continue;
      let clearance = 0;
      radiusLoop:
      for (let r = step; r <= maxR; r += step) {
        for (const [dx, dy] of LABEL_ANCHOR_DIRS) {
          if (!insideAt(x + dx * r, y + dy * r)) break radiusLoop;
        }
        clearance = r;
      }
      if (clearance > bestClearance) {
        bestClearance = clearance;
        best = { screenX: x, screenY: y, clearancePx: Math.max(clearance, step / 2) };
      }
    }
  }
  if (!best) return null;

  // The isotropic clearance above is a good way to CHOOSE a point (most
  // open spot overall), but it's the tightest of 8 directions — for a
  // landscape-shaped country that's much wider than tall, that tightest
  // direction is usually vertical, which would wrongly cap how WIDE we
  // think the available space is too. Measure horizontal and vertical room
  // separately at the chosen point, since text needs width and height
  // independently, not a single isotropic radius.
  const maxExtent = Math.max(rect.width, rect.height);
  const fineStep = Math.max(0.5, maxExtent / 24);
  function extentAlong(dx, dy) {
    let r = 0;
    while (r + fineStep <= maxExtent && insideAt(best.screenX + dx * (r + fineStep), best.screenY + dy * (r + fineStep))) {
      r += fineStep;
    }
    return r;
  }
  best.widthPx = extentAlong(-1, 0) + extentAlong(1, 0);
  best.heightPx = extentAlong(0, -1) + extentAlong(0, 1);
  return best;
}

// Country layers have inconsistent transforms (some countries are drawn as
// <g> with several sub-paths under their own matrix), so plain getBBox()
// isn't a reliable common coordinate space. getBoundingClientRect() +
// getScreenCTM() gives the rendered center regardless of each layer's
// internal transform chain. Labels for the whole current continent are built
// once per loaded map and then shown/hidden per-label depending on the
// selected region, so switching regions within one continent doesn't
// require rebuilding the SVG each time.
function buildLabels(continent) {
  // "already built" must mean "already built for THIS continent's country
  // set" — if two continents ever shared one SVG file again, a plain
  // labelsBuilt flag would let one silently reuse the other's labels.
  if (labelsBuilt && labelsBuiltFor === continent) return;
  if (!svgRootEl || typeof svgRootEl.getScreenCTM !== "function") return;
  const ctm = svgRootEl.getScreenCTM();
  if (!ctm) return; // map not laid out yet, try again next time startLearn runs
  const inverse = ctm.inverse();
  // A country's getBoundingClientRect() covers its full path geometry,
  // including any offshore islands/exclaves — for a country near the edge of
  // the cropped map (e.g. Iceland, Norway on the Europe map), that box's
  // center can land right at or past the visible boundary, clipping the
  // label. Clamp into a margin inside the currently VISIBLE area — this
  // MUST be mapWrapEl's rect, not svgRootEl's: once zoomed in (applyZoom
  // sets width/height > 100%), the <svg> element's own bounding box is the
  // full oversized content, mostly scrolled out of view — mapWrapEl is the
  // actual viewport window onto it.
  const svgRect = mapWrapEl.getBoundingClientRect();
  const toSvgPt = (x, y) => {
    const pt = svgRootEl.createSVGPoint();
    pt.x = x;
    pt.y = y;
    return pt.matrixTransform(inverse);
  };
  const visTL = toSvgPt(svgRect.left, svgRect.top);
  const visBR = toSvgPt(svgRect.right, svgRect.bottom);
  const visX = Math.min(visTL.x, visBR.x);
  const visXEnd = Math.max(visTL.x, visBR.x);
  const visY = Math.min(visTL.y, visBR.y);
  const visYEnd = Math.max(visTL.y, visBR.y);
  const marginX = (visXEnd - visX) * 0.04;
  const marginY = (visYEnd - visY) * 0.04;
  // Stashed so the collision-avoidance pass in showLabelsFor can re-clamp
  // after nudging labels apart, without needing another CTM round-trip.
  labelBounds = { minX: visX + marginX, maxX: visXEnd - marginX, minY: visY + marginY, maxY: visYEnd - marginY };
  if (labelsGroup) labelsGroup.remove(); // stale labels from a different continent sharing this SVG (Asia/Oceania)
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("id", "country-labels");
  g.style.pointerEvents = "none";
  g.style.display = "none";
  // Append the (empty) group before creating any text children, so each
  // text element is live in the rendered document as soon as it's added —
  // getComputedTextLength() below needs that to return real metrics.
  svgRootEl.appendChild(g);
  // Shared by both leader-line code paths below (a fresh auto-placed label
  // and one restored from a saved override) — same arrow + connecting-line
  // construction either way, just fed different source coordinates.
  function placeLeaderMarker(id, ax, ay, trueX, trueY, textEl, fontSize, scaleOverride) {
    const arrow = createLeaderArrow(id);
    g.appendChild(arrow);
    if (scaleOverride != null) arrow.dataset.scaleMult = scaleOverride;
    positionArrow(arrow, ax, ay, trueX, trueY, 1 / ctm.a);

    const textX = parseFloat(textEl.getAttribute("x"));
    const textY = parseFloat(textEl.getAttribute("y"));
    const halfW = textEl.getComputedTextLength() / 2;
    const halfH = fontSize * 1.3 / 2;
    const edge = trimLineToTextEdge(ax, ay, textX, textY, halfW, halfH);
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", ax);
    line.setAttribute("y1", ay);
    line.setAttribute("x2", edge.x);
    line.setAttribute("y2", edge.y);
    line.setAttribute("stroke", "#0f172a");
    line.setAttribute("stroke-width", 1 / ctm.a);
    line.dataset.id = id;
    line.dataset.leaderLine = "1";
    g.appendChild(line);
    return { arrow, line };
  }
  continentCountries(continent).forEach(c => {
    const unit = units[c.id];
    if (!unit) return;
    const rect = unit.getBoundingClientRect();
    // Search only the portion of the country actually on screen — a
    // country's full bounding box can extend well past the viewport (Canada
    // reaches into Arctic islands above the visible crop), and a point found
    // inside that off-screen part would just get shoved somewhere unrelated
    // by the later visible-area clamp instead of staying on the real shape.
    const visibleRect = {
      left: Math.max(rect.left, svgRect.left),
      top: Math.max(rect.top, svgRect.top),
      right: Math.min(rect.right, svgRect.right),
      bottom: Math.min(rect.bottom, svgRect.bottom)
    };
    visibleRect.width = Math.max(0, visibleRect.right - visibleRect.left);
    visibleRect.height = Math.max(0, visibleRect.bottom - visibleRect.top);
    const anchor = visibleRect.width > 0 && visibleRect.height > 0
      ? findLabelAnchor(paths[c.id], visibleRect)
      : null;
    // A country's bounding-box center is not guaranteed to be inside its own
    // shape — Norway is a crescent, so its bbox center falls in open water.
    // findLabelAnchor grid-searches for a point that's actually inside the
    // polygon and reasonably far from its edges (a cheap "pole of
    // inaccessibility" approximation); fall back to the naive bbox center
    // for the rare country too thin for the grid to catch (best effort).
    const anchorScreenX = anchor ? anchor.screenX : visibleRect.left + visibleRect.width / 2;
    const anchorScreenY = anchor ? anchor.screenY : visibleRect.top + visibleRect.height / 2;
    const clearancePx = anchor ? anchor.clearancePx : Math.min(visibleRect.width, visibleRect.height) / 2;
    const widthAvailPx = anchor ? anchor.widthPx : visibleRect.width;
    const heightAvailPx = anchor ? anchor.heightPx : visibleRect.height;
    const pt = svgRootEl.createSVGPoint();
    pt.x = anchorScreenX;
    pt.y = anchorScreenY;
    const svgPt = pt.matrixTransform(inverse);
    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-weight", "600");
    text.setAttribute("fill", "#0f172a");
    text.setAttribute("stroke", "#ffffff");
    text.setAttribute("paint-order", "stroke");
    text.dataset.id = c.id;
    text.textContent = c.name;
    // Measure at a reference size first, since getComputedTextLength()
    // scales linearly with font-size for a given string, then solve for
    // whatever size keeps the text inside the LOCAL space actually
    // available at the anchor point (not the country's overall bounding
    // box, which is far bigger than the usable area for a thin/crescent
    // shape like Norway or Chile).
    const REF_SIZE = 20;
    text.setAttribute("font-size", REF_SIZE);
    g.appendChild(text);
    const refWidth = text.getComputedTextLength();
    const widthAvailUnits = widthAvailPx / ctm.a;
    const heightAvailUnits = heightAvailPx / ctm.a;
    const fitByWidth = refWidth > 0 ? (widthAvailUnits * 0.85 / refWidth) * REF_SIZE : REF_SIZE;
    const fitByHeight = heightAvailUnits * 0.7;
    const rawFitPx = Math.min(fitByWidth, fitByHeight) * ctm.a;
    // Some countries (Monaco, Vatican, Singapore...) are just a few pixels
    // across at this zoom — no font size, however small, fits their name
    // inside their own shape. rawFitPx landing under the readability floor
    // is the signal: rather than force an oversized floor size that
    // guarantees overflow, give these a leader-line label instead (marker
    // dot on the country, name text offset beside it with a connecting
    // line) — the same technique real atlases use for city-state-sized
    // countries.
    // A low isotropic clearance (Uruguay wedged between Argentina/Brazil,
    // Liberia between Ivory Coast/Sierra Leone/Guinea) means the anchor sits
    // right up against the country's own border even though there's enough
    // WIDTH/HEIGHT for the text to fit. That's exactly the profile where a
    // screen<->svg round-trip's sub-pixel rounding can land the label just
    // outside the country after render. Route these to the leader-line path
    // instead — it already does a real elementFromPoint search for open
    // space rather than trusting a single computed point.
    // A generic "low clearance" trigger was tried here to catch tightly-
    // wedged countries, but clearancePx is viewport-size dependent — on a
    // narrower window it pulled in plenty of ordinary countries (Iceland,
    // Estonia, Lithuania...) that don't need leader treatment at all, each
    // starting at the default (large) arrow size since no one had ever saved
    // a fixed size for them. Uruguay is the one confirmed case that needs
    // this unconditionally; the general anchor-clamp safety net below (see
    // "stillInside" check) already covers the same underlying bug for
    // ordinary inline labels without forcing them into leader mode.
    const isLeader = rawFitPx < 3.5 || c.id === "uy";
    const targetPx = isLeader ? 9 : Math.max(6, Math.min(15, rawFitPx));
    const labelFontSize = targetPx / ctm.a;
    text.setAttribute("font-size", labelFontSize);
    text.setAttribute("stroke-width", labelFontSize * (3 / 22));

    const override = isLeader && labelOverrides[continent] && labelOverrides[continent][c.id];
    if (override) {
      // A manually-fixed position from a previous "固定位置" save — use it
      // verbatim instead of re-running the placement search, so the user's
      // correction survives every reload/rebuild.
      text.setAttribute("x", override.x);
      text.setAttribute("y", override.y);
      text.setAttribute("font-size", override.fontSize);
      text.setAttribute("stroke-width", override.fontSize * (3 / 22));
      text.dataset.locked = "1";

      const ax = override.ax != null ? override.ax : svgPt.x;
      const ay = override.ay != null ? override.ay : svgPt.y;
      const { arrow, line } = placeLeaderMarker(c.id, ax, ay, svgPt.x, svgPt.y, text, override.fontSize, override.scale);
      makeLeaderLabelInteractive(text, line);
      makeArrowInteractive(arrow, line, text, svgPt.x, svgPt.y);
    } else if (isLeader) {
      // Offset the text off the marker dot, in screen space (simpler than
      // reasoning about direction in the map's own rotated/scaled coordinate
      // system). Always offsetting straight up broke down for a vertical
      // cluster of small countries (Netherlands/Belgium/Luxembourg): every
      // label shot upward into whatever country was above it, e.g. Belgium's
      // name landing on top of the Netherlands. Try several directions and
      // pick the first whose landing point isn't sitting on a DIFFERENT
      // country — g still has display:none here, so elementFromPoint sees
      // straight through to the base map, ignoring not-yet-placed labels.
      const dotScreenR = 3;
      const gapPx = 5;
      const offsetDist = dotScreenR + gapPx + targetPx / 2;
      const candidates = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        candidates.push([Math.cos(a), Math.sin(a)]);
      }
      function idAt(x, y) {
        const el = document.elementFromPoint(x, y);
        let cur = el;
        while (cur && cur.nodeType === 1) {
          if (cur.id && /^[a-z]{2}$/.test(cur.id)) return cur.id;
          cur = cur.parentElement;
        }
        return null;
      }
      // Checking only the center point missed cases where the text is wide
      // enough that its rendered box still spills onto a neighboring
      // country even though the center landed clear — e.g. "Luxembourg"
      // centered just past the border still overlapped Germany. Sample the
      // left/right edges too (horizontal only — a single line of text is
      // short vertically, so top/bottom corners mostly just re-flag the
      // same border the center point already caught, and were rejecting
      // almost every candidate in dense clusters).
      const textHalfW = text.getComputedTextLength() / 2;
      function badPointCount(x, y) {
        const pts = [[x, y], [x - textHalfW, y], [x + textHalfW, y]];
        let n = 0;
        for (const [px, py] of pts) {
          const id = idAt(px, py);
          if (id && id !== c.id) n++;
        }
        return n;
      }
      // A landlocked micro-state (Luxembourg, Liechtenstein) can be
      // surrounded by other countries on every side at the base offset
      // distance — no direction clears at that range. Push farther out
      // before giving up; distance is preferred over direction, so this
      // still picks the shortest leader line that actually lands clear.
      // If nothing ever lands fully clear, remember the least-bad candidate
      // seen instead of blindly shooting further out (which can overshoot
      // past the immediate neighbor into an unrelated, far-away country).
      let finalDist = offsetDist;
      let dirX = 0, dirY = -1;
      let bestScore = Infinity;
      outer:
      for (const distMult of [1, 1.6, 2.2, 3, 4, 5.2, 6.6]) {
        const dist = offsetDist * distMult;
        for (const [dx, dy] of candidates) {
          const cx = anchorScreenX + dx * dist;
          const cy = anchorScreenY + dy * dist;
          const score = badPointCount(cx, cy);
          if (score < bestScore) {
            bestScore = score; dirX = dx; dirY = dy; finalDist = dist;
          }
          if (score === 0) break outer;
        }
      }
      const textOffsetPt = svgRootEl.createSVGPoint();
      textOffsetPt.x = anchorScreenX + dirX * finalDist;
      textOffsetPt.y = anchorScreenY + dirY * finalDist;
      const textSvgPt = textOffsetPt.matrixTransform(inverse);
      const halfW = Math.min(text.getComputedTextLength() / 2, (visXEnd - visX) / 2 - marginX);
      const halfH = Math.min((labelFontSize * 1.3) / 2, (visYEnd - visY) / 2 - marginY);
      const finalTextX = Math.min(Math.max(textSvgPt.x, visX + marginX + halfW), visXEnd - marginX - halfW);
      const finalTextY = Math.min(Math.max(textSvgPt.y, visY + marginY + halfH), visYEnd - marginY - halfH);
      text.setAttribute("x", finalTextX);
      text.setAttribute("y", finalTextY);

      const { arrow, line } = placeLeaderMarker(c.id, svgPt.x, svgPt.y, svgPt.x, svgPt.y, text, labelFontSize, null);
      makeLeaderLabelInteractive(text, line);
      makeArrowInteractive(arrow, line, text, svgPt.x, svgPt.y);
    } else {
      // Clamping only the label's center point isn't enough — a long name
      // (e.g. "Papua New Guinea") anchored just inside the margin can still
      // have its own rendered width spill past the container edge. Clamp
      // using each label's actual measured half-width/half-height instead
      // of the flat margin, falling back to the flat margin for labels too
      // wide to fit any other way (extreme edge case, best effort).
      const halfW = Math.min(text.getComputedTextLength() / 2, (visXEnd - visX) / 2 - marginX);
      const halfH = Math.min((labelFontSize * 1.3) / 2, (visYEnd - visY) / 2 - marginY);
      let clampedX = Math.min(Math.max(svgPt.x, visX + marginX + halfW), visXEnd - marginX - halfW);
      let clampedY = Math.min(Math.max(svgPt.y, visY + marginY + halfH), visYEnd - marginY - halfH);
      // The margin clamp above only knows the overall visible map bounds,
      // not this specific country's shape — a country whose anchor happens
      // to sit near the map's own crop edge (Uruguay, close to where the
      // Americas-south view is cropped) can get pushed clear off itself and
      // into whatever neighbor is in that direction. findLabelAnchor already
      // guaranteed svgPt was inside the country; if clamping broke that,
      // prefer the unclamped point — a label peeking slightly past the
      // visible edge reads far better than naming the wrong country.
      if ((clampedX !== svgPt.x || clampedY !== svgPt.y) && paths[c.id]) {
        const clampedScreenSrc = svgRootEl.createSVGPoint();
        clampedScreenSrc.x = clampedX; clampedScreenSrc.y = clampedY;
        const clampedScreenPt = clampedScreenSrc.matrixTransform(ctm);
        const stillInside = paths[c.id].some(p => {
          try { return p.isPointInFill(clampedScreenPt.matrixTransform(p.getScreenCTM().inverse())); }
          catch (e) { return false; }
        });
        if (!stillInside) { clampedX = svgPt.x; clampedY = svgPt.y; }
      }
      text.setAttribute("x", clampedX);
      text.setAttribute("y", clampedY);
      // The anchor before any collision-avoidance nudging — always inside
      // the country by construction (via findLabelAnchor). Collision
      // resolution's own drift cap is generous enough that a small country
      // squeezed between two big ones (Uruguay between Argentina/Brazil) can
      // still get pushed across a border; showLabelsFor falls back to this
      // safe position if that happens.
      text.dataset.safeX = clampedX;
      text.dataset.safeY = clampedY;
    }
  });
  labelsGroup = g;
  labelsBuilt = true;
  labelsBuiltFor = continent;
}

function showLabelsFor(activeIds) {
  if (!labelsGroup) return;
  labelsGroup.querySelectorAll("text, polygon, line").forEach(el => {
    el.style.display = activeIds.has(el.dataset.id) ? "" : "none";
  });
  // Manually-fixed labels (dataset.locked, saved via "固定位置") are exempt —
  // the whole point of fixing one is that the auto collision-avoidance never
  // touches it again.
  const inlineTexts = [...labelsGroup.querySelectorAll("text")].filter(t => activeIds.has(t.dataset.id) && t.dataset.locked !== "1" && t.dataset.safeX != null);
  resolveLabelCollisions(inlineTexts);
  // Collision resolution's drift cap is a soft limit tuned for the common
  // case — a country small enough, and squeezed tightly enough between two
  // much larger neighbors (Uruguay between Argentina/Brazil), can still end
  // up pushed across a border into one of them. Hard-verify each label
  // actually landed on its own country and snap back to the pre-collision
  // safe position if not; a little visual overlap beats naming the wrong
  // country.
  inlineTexts.forEach(t => {
    const cx = parseFloat(t.getAttribute("x")), cy = parseFloat(t.getAttribute("y"));
    const pt = svgRootEl.createSVGPoint();
    pt.x = cx; pt.y = cy;
    const screenPt = pt.matrixTransform(svgRootEl.getScreenCTM());
    const el = document.elementFromPoint(screenPt.x, screenPt.y);
    let cur = el, hitId = null;
    while (cur && cur.nodeType === 1) {
      if (cur.id && /^[a-z]{2}$/.test(cur.id)) { hitId = cur.id; break; }
      cur = cur.parentElement;
    }
    if (hitId !== t.dataset.id) {
      t.setAttribute("x", t.dataset.safeX);
      t.setAttribute("y", t.dataset.safeY);
    }
  });
  // Collision resolution just moved some text elements vertically — leader
  // lines (for countries too small to hold inline text) need their far
  // endpoint to follow, or the line ends up pointing at empty space instead
  // of the label it belongs to.
  labelsGroup.querySelectorAll('line[data-leader-line="1"]').forEach(line => {
    const id = line.dataset.id;
    if (!activeIds.has(id)) return;
    const text = labelsGroup.querySelector(`text[data-id="${id}"]`);
    if (text) {
      const halfW = text.getComputedTextLength() / 2;
      const halfH = parseFloat(text.getAttribute("font-size")) * 1.3 / 2;
      const edge = trimLineToTextEdge(
        parseFloat(line.getAttribute("x1")), parseFloat(line.getAttribute("y1")),
        parseFloat(text.getAttribute("x")), parseFloat(text.getAttribute("y")),
        halfW, halfH
      );
      line.setAttribute("x2", edge.x);
      line.setAttribute("y2", edge.y);
    }
  });
}

// Small countries clustered next to a larger neighbor (Liechtenstein beside
// Switzerland, Vatican/San Marino/Monaco/Andorra near their bigger
// neighbors) get their labels placed right on top of each other. getComputedTextLength()
// gives each label's rendered width in the same SVG user-space units as its
// x/y, independent of the current zoom, so this nudges only labels that
// actually overlap apart vertically without needing to know the CTM/zoom.
function resolveLabelCollisions(texts) {
  const boxes = texts.map(t => ({
    el: t,
    x: parseFloat(t.getAttribute("x")),
    y: parseFloat(t.getAttribute("y")),
    origY: parseFloat(t.getAttribute("y")),
    w: t.getComputedTextLength(),
    h: parseFloat(t.getAttribute("font-size")) * 1.3
  }));
  // Push each overlapping pair apart symmetrically by only the amount they
  // actually overlap — NOT snap one directly under the other, which
  // discards its original position and, in a dense cluster (the Balkans:
  // ~10 labels within a small area), cascades into collapsing almost the
  // whole cluster into one vertical stack unrelated to real geography.
  for (let pass = 0; pass < 30; pass++) {
    let moved = false;
    boxes.sort((a, b) => a.y - b.y);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (Math.abs(a.x - b.x) >= (a.w + b.w) / 2) continue; // no x-overlap, can't collide
        const minGap = (a.h + b.h) / 2 + 4;
        const dy = b.y - a.y;
        if (dy >= minGap) continue;
        const push = (minGap - dy) / 2;
        // Cap how far a label can drift from its own country — in a dense
        // cluster (e.g. the Middle East, Balkans), fully resolving every
        // overlap can otherwise walk a label so far it ends up over a
        // completely different country. A little residual overlap reads far
        // better than a label disconnected from what it names.
        const maxDrift = a.h * 3.5;
        if (Math.abs(a.y - push - a.origY) <= maxDrift) { a.y -= push; moved = true; }
        if (Math.abs(b.y + push - b.origY) <= maxDrift) { b.y += push; moved = true; }
      }
    }
    if (!moved) break;
  }
  // Pushing overlapping labels apart can walk some of them back past the
  // visible-area margin from buildLabels (re-clipping at the map edge).
  // Shift the whole stack — not each label individually, which would just
  // collapse them back onto each other at the boundary — so it stays inside
  // bounds while keeping the spacing that resolved the overlaps.
  if (labelBounds && boxes.length) {
    let minTop = Math.min(...boxes.map(b => b.y - b.h / 2));
    let maxBottom = Math.max(...boxes.map(b => b.y + b.h / 2));
    const stackHeight = maxBottom - minTop;
    const available = labelBounds.maxY - labelBounds.minY;
    // A dense cluster (many small countries at high zoom) can need more
    // vertical room than the visible area has at all — shifting alone can't
    // fix that if the stack is simply taller than the space. Compress the
    // spacing around the stack's center first so it actually fits, then
    // shift the (now-fitting) stack into bounds.
    if (stackHeight > available && available > 0) {
      const center = (minTop + maxBottom) / 2;
      const scale = available / stackHeight;
      boxes.forEach(b => (b.y = center + (b.y - center) * scale));
      minTop = Math.min(...boxes.map(b => b.y - b.h / 2));
      maxBottom = Math.max(...boxes.map(b => b.y + b.h / 2));
    }
    let shift = 0;
    if (minTop < labelBounds.minY) shift = labelBounds.minY - minTop;
    else if (maxBottom > labelBounds.maxY) shift = labelBounds.maxY - maxBottom;
    if (shift) boxes.forEach(b => (b.y += shift));
  }
  boxes.forEach(b => b.el.setAttribute("y", b.y));
}

function applyZoom() {
  if (!svgRootEl) return;
  svgRootEl.style.width = `${zoom * 100}%`;
  svgRootEl.style.height = `${zoom * 100}%`;
  svgRootEl.style.cursor = zoom > 1 ? "grab" : "default";
}

function resetZoom() {
  zoom = 1;
  applyZoom();
  mapWrapEl.scrollLeft = 0;
  mapWrapEl.scrollTop = 0;
}

// Zooming via width/height percentages grows the content from its top-left
// corner, so leaving scrollLeft/scrollTop untouched makes the view jump
// toward that corner instead of staying put. This keeps whatever point is
// currently centered in the viewport centered after the resize too.
// anchorX/anchorY are viewport client coordinates to keep fixed under the
// zoom change (e.g. the mouse cursor for wheel-zoom); default to the
// container's own center, which is what the +/- buttons want.
function setZoomAnchored(newZoom, anchorX, anchorY) {
  const containerW = mapWrapEl.clientWidth;
  const containerH = mapWrapEl.clientHeight;
  const wrapRect = mapWrapEl.getBoundingClientRect();
  const anchorLocalX = anchorX != null ? anchorX - wrapRect.left : containerW / 2;
  const anchorLocalY = anchorY != null ? anchorY - wrapRect.top : containerH / 2;
  const oldContentW = containerW * zoom;
  const oldContentH = containerH * zoom;
  const fracX = oldContentW > 0 ? (mapWrapEl.scrollLeft + anchorLocalX) / oldContentW : 0.5;
  const fracY = oldContentH > 0 ? (mapWrapEl.scrollTop + anchorLocalY) / oldContentH : 0.5;

  zoom = newZoom;
  applyZoom();

  const newContentW = containerW * zoom;
  const newContentH = containerH * zoom;
  mapWrapEl.scrollLeft = fracX * newContentW - anchorLocalX;
  mapWrapEl.scrollTop = fracY * newContentH - anchorLocalY;
}

zoomInBtn.addEventListener("click", () => setZoomAnchored(Math.min(3, zoom + 0.5)));
zoomOutBtn.addEventListener("click", () => setZoomAnchored(Math.max(1, zoom - 0.5)));
zoomResetBtn.addEventListener("click", resetZoom);

// Mouse wheel / trackpad zoom, anchored under the cursor so whatever
// country you're pointing at stays put as you zoom in — matches the
// scroll-to-zoom behavior of Google Maps etc.
mapWrapEl.addEventListener("wheel", e => {
  if (mode === "idle") return; // no map session active
  e.preventDefault();
  const step = 0.15 * Math.sign(-e.deltaY);
  const newZoom = Math.min(3, Math.max(1, zoom + step));
  if (newZoom !== zoom) setZoomAnchored(newZoom, e.clientX, e.clientY);
}, { passive: false });

function enterSession() {
  titleEl.textContent = regionLabel(currentRegion);
  homeScreenEl.style.display = "none";
  promptEl.style.display = "flex";
  progressEl.style.display = "block";
  mapWrapEl.style.display = "block";
  zoomControlsEl.style.display = "flex";
  resultsEl.style.display = "none";
  resetZoom();
}

function goHome() {
  mode = "idle";
  titleEl.textContent = DEFAULT_TITLE;
  const continent = currentRegion ? continentOf(currentRegion) : null;
  currentRegion = null;
  speechSynthesis.cancel();
  if (labelsGroup) labelsGroup.style.display = "none";
  if (continent) continentCountries(continent).forEach(c => setFill(c.id, DEFAULT_FILL));
  refreshHomeProgress();
  homeScreenEl.style.display = "block";
  promptEl.style.display = "none";
  progressEl.style.display = "none";
  mapWrapEl.style.display = "none";
  zoomControlsEl.style.display = "none";
  resultsEl.style.display = "none";
  skipBtn.style.display = "none";
  homeBtn.style.display = "none";
  learnQuizBtn.style.display = "none";
  saveLabelsBtn.style.display = "none";
}

async function startLearn(region) {
  const continent = continentOf(region);
  await ensureMapLoaded(CONTINENT_SVG[continent]);
  applyRegionViewBox(region);
  mode = "learn";
  currentRegion = region;
  active = regionCountries(region);
  const activeIds = new Set(active.map(c => c.id));
  enterSession();
  saveLabelsBtn.style.display = "inline-block";
  applyRegionDimming(activeIds, continent);
  skipBtn.style.display = "none";
  homeBtn.style.display = "inline-block";
  learnQuizBtn.style.display = "inline-block";
  promptEl.textContent = "Click a country to hear it";
  progressEl.textContent = "";
  // map-wrap was just switched from display:none to visible above, and the
  // freshly-injected SVG doesn't get a settled layout (valid
  // getBoundingClientRect/getScreenCTM) until the browser has painted at
  // least once after that — building labels synchronously here would silently
  // fail on the very first Learn click. A 0ms timeout defers to the next tick,
  // by which point layout has settled (and unlike requestAnimationFrame, this
  // still fires even if the tab isn't the focused/visible one).
  setTimeout(() => {
    buildLabels(continent);
    if (labelsGroup) {
      labelsGroup.style.display = "";
      showLabelsFor(activeIds);
    }
  }, 0);
}

function onLearnClick(id) {
  if (suppressNextClick) { suppressNextClick = false; return; } // was a drag, not a tap
  const country = active.find(c => c.id === id);
  if (!country) return; // clicked a country outside the selected region
  speak(country.name);
  setFill(id, CORRECT_FILL);
  promptEl.textContent = country.name;
  setTimeout(() => setFill(id, DEFAULT_FILL), FLASH_MS);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function currentTarget() {
  return active[order[cursor]];
}

async function startRound(region) {
  const continent = continentOf(region);
  await ensureMapLoaded(CONTINENT_SVG[continent]);
  applyRegionViewBox(region);
  mode = "quiz";
  currentRegion = region;
  active = regionCountries(region);
  order = shuffle(active.map((_, i) => i));
  cursor = 0;
  missed = new Set();
  locked = false;
  enterSession();
  skipBtn.style.display = "inline-block";
  homeBtn.style.display = "inline-block";
  learnQuizBtn.style.display = "none";
  saveLabelsBtn.style.display = "none";
  if (labelsGroup) labelsGroup.style.display = "none";
  applyRegionDimming(new Set(active.map(c => c.id)), continent);
  showPrompt();
}

function showPrompt() {
  const t = currentTarget();
  promptEl.innerHTML = `Click <span class="target">${t.name}</span>`;
  progressEl.textContent = `${cursor} / ${active.length}`;
}

function onCountryClick(id) {
  if (suppressNextClick) { suppressNextClick = false; return; } // was a drag, not a tap
  if (locked || order.length === 0) return;
  const target = currentTarget();
  if (id === target.id) {
    locked = true;
    setFill(id, CORRECT_FILL);
    setTimeout(() => {
      setFill(id, DEFAULT_FILL);
      locked = false;
      advance();
    }, FLASH_MS);
  } else {
    missed.add(target.id);
    locked = true;
    setFill(id, WRONG_FILL);
    setTimeout(() => {
      setFill(id, active.some(c => c.id === id) ? DEFAULT_FILL : DIM_FILL);
      locked = false;
    }, FLASH_MS);
  }
}

function advance() {
  cursor++;
  if (cursor >= order.length) {
    finishRound();
  } else {
    showPrompt();
  }
}

function finishRound() {
  mode = "idle";
  const continent = continentOf(currentRegion);
  // "Reviewed Nx" / "Completed" counts completed quiz rounds, not individual
  // clicks, so every country in this round gets +1 once, here, on completion.
  active.forEach(c => bumpReview(c.id));
  progressEl.textContent = `${active.length} / ${active.length}`;
  promptEl.textContent = "Done!";
  skipBtn.style.display = "none";
  resultsEl.style.display = "block";
  const correctCount = active.length - missed.size;
  const accuracy = Math.round((correctCount / active.length) * 100);
  resultScoreEl.textContent = `Correct on first try: ${correctCount} / ${active.length} (${accuracy}%)`;
  rosterListEl.innerHTML = "";
  active.forEach(c => {
    const li = document.createElement("li");
    li.className = missed.has(c.id) ? "missed" : "ok";
    li.textContent = c.name;
    rosterListEl.appendChild(li);
  });
  continentCountries(continent).forEach(c => setFill(c.id, DEFAULT_FILL));
}
