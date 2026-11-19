// Vice City Nights — the GTA VI trophy guide and tracker.
// One module, no dependencies, no network at run time beyond loading the local
// data/trophies.json. Progress is saved in localStorage; filters, spoiler mode
// and the open trophy are deep-linked through the URL hash.
const CHECKLIST_KEY = 'gta6-trophy-checklist';
const SPOILER_KEY = 'gta6-trophy-spoilers';
const SOURCE_LINE = 'Sources: name, description and grade — official PlayStation 5 trophy list, published 2026-11-18. Guide — written in our own words from that description for this entry; exact locations are still being mapped by the community.';

// The roadmap to the platinum, built from the official descriptions: six phases
// in order, each listing the trophy ids it covers.
const ROADMAP_PHASES = [
  { n: 1, title: 'Story playthrough', blurb: 'Play the story in order. Grab the partner and story-moment missables while you are here.', ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 45, 48] },
  { n: 2, title: 'Side missions & stranger strands', blurb: 'Finish the stranger strands — five named ones plus three more make the silver.', ids: [20, 22, 23, 24, 25, 26, 27, 29] },
  { n: 3, title: 'Activities & challenges', blurb: 'Races, ranges, drones, stunts and the activity menu — the skill grind.', ids: [15, 16, 17, 18, 19, 21, 32, 36, 46, 51] },
  { n: 4, title: 'Collectibles & exploration', blurb: 'Cards, meditation spots, WAiNK It locations, vehicles and all 52 areas.', ids: [28, 30, 31, 35, 42, 44, 50, 54] },
  { n: 5, title: 'Combat & misc cleanup', blurb: 'Robberies, gangs, wanted levels and the money trophies.', ids: [33, 34, 37, 38, 39, 40, 41, 43, 47, 49, 52, 53, 55] },
  { n: 6, title: '100% completion & platinum', blurb: 'The last gold, then the platinum pops on its own.', ids: [14, 1] },
];

const KIND_LABELS = { story: 'Story', mission: 'Mission', side: 'Side', collectible: 'Collectible', combat: 'Combat', exploration: 'Exploration', misc: 'Misc' };
const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const searchEl = $('search');
const gradeEl = $('gradeFilter');
const kindEl = $('kindFilter');
const statusEl = $('statusFilter');
const missableEl = $('missableOnly');
const spoilerEl = $('spoilerToggle');

let trophies = [];
let byId = new Map();
let earned = new Set(loadStoredIds());
let spoilers = localStorage.getItem(SPOILER_KEY) === 'on';
let expandedId = null;

const filters = { grade: 'all', kind: 'all', status: 'all', q: '', missableOnly: false };

function loadStoredIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(CHECKLIST_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((x) => Number.isInteger(x)) : [];
  } catch {
    return [];
  }
}

function saveEarned() {
  localStorage.setItem(CHECKLIST_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function saveSpoilers() {
  localStorage.setItem(SPOILER_KEY, spoilers ? 'on' : 'off');
}

// ---- URL hash: #grade=silver&kind=collectible&q=text&status=earned&missable=1&spoilers=on&trophy=17 ----
function parseHash() {
  const out = {};
  for (const part of location.hash.slice(1).split('&')) {
    if (!part) continue;
    const [k, v] = part.split('=');
    if (k === 'roadmap') { out.roadmap = true; continue; }
    if (v !== undefined) out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return out;
}

function applyHashToState() {
  const h = parseHash();
  if (GRADE_ORDER.includes(h.grade) || h.grade === 'all') filters.grade = h.grade;
  if (Object.keys(KIND_LABELS).includes(h.kind) || h.kind === 'all') filters.kind = h.kind;
  if (['all', 'earned', 'unearned'].includes(h.status)) filters.status = h.status;
  if (typeof h.q === 'string') filters.q = h.q;
  filters.missableOnly = h.missable === '1';
  if (h.spoilers === 'on' || h.spoilers === 'off') spoilers = h.spoilers === 'on';
  const tid = Number(h.trophy);
  expandedId = Number.isInteger(tid) && byId.has(tid) ? tid : null;
  syncControlsFromState();
}

function writeHashFromState() {
  const parts = [];
  if (filters.grade !== 'all') parts.push(`grade=${filters.grade}`);
  if (filters.kind !== 'all') parts.push(`kind=${filters.kind}`);
  if (filters.status !== 'all') parts.push(`status=${filters.status}`);
  if (filters.q) parts.push(`q=${encodeURIComponent(filters.q)}`);
  if (filters.missableOnly) parts.push('missable=1');
  if (spoilers) parts.push('spoilers=on');
  if (expandedId !== null) parts.push(`trophy=${expandedId}`);
  const hash = parts.length ? `#${parts.join('&')}` : '';
  history.replaceState(null, '', hash ? `${location.pathname}${hash}` : location.pathname);
}

function syncControlsFromState() {
  searchEl.value = filters.q;
  gradeEl.value = filters.grade;
  kindEl.value = filters.kind;
  statusEl.value = filters.status;
  missableEl.checked = filters.missableOnly;
  spoilerEl.checked = spoilers;
}

// ---- progress header ----
function renderProgress() {
  const total = trophies.length;
  $('earnedCount').textContent = String(earned.size);
  $('progressFill').style.width = total ? `${Math.round((earned.size / total) * 100)}%` : '0%';
  $('gradeCounts').innerHTML = GRADE_ORDER.map((g) => {
    const ofGrade = trophies.filter((t) => t.grade === g);
    const got = ofGrade.filter((t) => earned.has(t.id)).length;
    return `<span style="white-space:nowrap"><b>${got}/${ofGrade.length}</b> ${g}</span>`;
  }).join(' &middot; ');
  const left = total - earned.size;
  $('progressNote').textContent = left === 0
    ? 'Every trophy earned — Leonida Legend. The platinum is yours.'
    : `${left} to go. Tick a trophy off and it stays ticked — saved in this browser.`;
}

// ---- roadmap + missables ----
function renderRoadmap() {
  const grid = $('phaseGrid');
  grid.replaceChildren();
  for (const phase of ROADMAP_PHASES) {
    const card = document.createElement('article');
    card.className = 'phase';
    const got = phase.ids.filter((id) => earned.has(id)).length;
    const head = document.createElement('h3');
    const num = document.createElement('span');
    num.className = 'phase-num';
    num.textContent = String(phase.n);
    head.append(num, document.createTextNode(phase.title));
    const blurb = document.createElement('p');
    blurb.textContent = phase.blurb;
    const chips = document.createElement('div');
    chips.className = 'phase-chips';
    for (const id of phase.ids) {
      const t = byId.get(id);
      if (!t) continue;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `phase-chip${earned.has(id) ? ' earned' : ''}`;
      // In spoiler mode, a story trophy's name stays hidden until it is earned.
      chip.textContent = (spoilers && t.kind === 'story' && !earned.has(id)) ? 'Story trophy' : t.name;
      chip.addEventListener('click', () => jumpToTrophy(id));
      chips.append(chip);
    }
    const prog = document.createElement('p');
    prog.className = 'phase-progress';
    prog.textContent = `Phase ${phase.n}: ${got} of ${phase.ids.length} earned`;
    card.append(head, blurb, chips, prog);
    grid.append(card);
  }
}

function renderMissables() {
  const ul = $('missableList');
  ul.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.className = 'miss-name';
    // In spoiler mode, a story trophy's name stays hidden until it is earned.
    name.textContent = (spoilers && t.kind === 'story' && !earned.has(t.id)) ? 'Story trophy — hidden until earned' : t.name;
    const grade = document.createElement('span');
    grade.className = 'miss-grade';
    grade.textContent = t.grade;
    const note = document.createElement('p');
    note.textContent = t.missable_note;
    li.append(name, grade, note);
    ul.append(li);
  }
}

// ---- checklist ----
function trophyMatches(t) {
  if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
  if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
  if (filters.status === 'earned' && !earned.has(t.id)) return false;
  if (filters.status === 'unearned' && earned.has(t.id)) return false;
  if (filters.missableOnly && !t.missable) return false;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    if (!`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
  }
  return true;
}

function isSpoilerHidden(t) {
  return spoilers && t.kind === 'story' && !earned.has(t.id);
}

function renderChecklist() {
  const visible = trophies.filter(trophyMatches);
  $('resultCount').textContent = `Showing ${visible.length} of ${trophies.length} trophies` +
    (filters.q ? ` for “${filters.q}”` : '') + '.';
  listEl.replaceChildren();
  if (!visible.length) {
    const p = document.createElement('p');
    p.className = 'empty-note';
    p.textContent = 'No trophies match those filters. Clear the search or a filter to see the full list.';
    listEl.append(p);
    return;
  }
  for (const t of visible) renderTrophyRow(t);
}

function renderTrophyRow(t) {
  const hidden = isSpoilerHidden(t);
  const article = document.createElement('article');
  article.className = `trophy${earned.has(t.id) ? ' earned' : ''}`;
  article.id = `trophy-${t.id}`;
  article.dataset.trophyId = String(t.id);

  const head = document.createElement('div');
  head.className = 'trophy-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.setAttribute('aria-label', `Mark ${hidden ? 'story trophy' : t.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id);
    else earned.delete(t.id);
    saveEarned();
    renderProgress();
    renderRoadmap();
    renderMissables();
    article.classList.toggle('earned', box.checked);
    // Earning a hidden story trophy reveals it.
    if (hidden) renderChecklist();
  });
  box.addEventListener('click', (e) => e.stopPropagation());

  const main = document.createElement('div');
  main.className = 'trophy-main';
  const name = document.createElement('div');
  name.className = 'trophy-name';
  name.textContent = hidden ? 'Story trophy — hidden until earned' : t.name;
  const desc = document.createElement('div');
  desc.className = 'trophy-desc';
  desc.textContent = hidden ? 'Hidden until earned.' : t.description;
  main.append(name, desc);

  const tags = document.createElement('div');
  tags.className = 'trophy-tags';
  const gradeTag = document.createElement('span');
  gradeTag.className = `tag grade-${t.grade}`;
  gradeTag.textContent = t.grade;
  tags.append(gradeTag);
  if (!hidden) {
    const kindTag = document.createElement('span');
    kindTag.className = 'tag';
    kindTag.textContent = KIND_LABELS[t.kind];
    tags.append(kindTag);
  }
  if (t.missable) {
    const missTag = document.createElement('span');
    missTag.className = 'tag missable';
    missTag.textContent = 'Missable';
    tags.append(missTag);
  }
  if (hidden) {
    const spoilTag = document.createElement('span');
    spoilTag.className = 'tag hidden-spoiler';
    spoilTag.textContent = 'Spoiler hidden';
    tags.append(spoilTag);
  }
  main.append(tags);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'trophy-toggle';
  toggle.textContent = hidden ? 'Hidden' : (expandedId === t.id ? 'Hide guide' : 'Guide');
  toggle.disabled = hidden;
  head.append(box, main, toggle);

  head.addEventListener('click', (e) => {
    if (e.target === box || hidden) return;
    expandedId = expandedId === t.id ? null : t.id;
    writeHashFromState();
    renderChecklist();
  });

  article.append(head);
  if (!hidden && expandedId === t.id) article.append(buildTrophyDetail(t));
  listEl.append(article);
}

function buildTrophyDetail(t) {
  const detail = document.createElement('div');
  detail.className = 'trophy-detail';
  const guide = document.createElement('p');
  guide.textContent = t.guide;
  detail.append(guide);

  if (t.tips && t.tips.length) {
    const h = document.createElement('h4');
    h.textContent = 'Tips';
    const ul = document.createElement('ul');
    for (const tip of t.tips) {
      const li = document.createElement('li');
      li.textContent = tip;
      ul.append(li);
    }
    detail.append(h, ul);
  }

  const meta = document.createElement('p');
  meta.className = 'trophy-meta';
  meta.textContent = `Kind: ${KIND_LABELS[t.kind]} · Missable: ${t.missable ? 'Yes — ' + t.missable_note : 'No — ' + t.missable_note}`;
  const source = document.createElement('p');
  source.className = 'trophy-source';
  source.textContent = SOURCE_LINE;
  detail.append(meta, source);
  return detail;
}

function jumpToTrophy(id) {
  filters.grade = 'all';
  filters.kind = 'all';
  filters.status = 'all';
  filters.q = '';
  filters.missableOnly = false;
  expandedId = id;
  syncControlsFromState();
  writeHashFromState();
  renderChecklist();
  document.getElementById(`trophy-${id}`)?.scrollIntoView({ block: 'start' });
}

// ---- export / import ----
function exportProgress() {
  const payload = { game: 'Grand Theft Auto VI', platform: 'PlayStation 5', exported: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importProgress(file) {
  if (!file) return;
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    alert('That file is not valid JSON.');
    return;
  }
  const raw = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(raw)) {
    alert('That file does not hold trophy progress.');
    return;
  }
  const next = new Set();
  for (const entry of raw) {
    if (Number.isInteger(entry) && byId.has(entry)) next.add(entry);
    else if (typeof entry === 'string') {
      const hit = trophies.find((t) => t.name === entry);
      if (hit) next.add(hit.id);
    }
  }
  earned = next;
  saveEarned();
  renderProgress();
  renderRoadmap();
  renderChecklist();
}

// ---- wiring ----
function bindControls() {
  searchEl.addEventListener('input', () => { filters.q = searchEl.value.trim(); writeHashFromState(); renderChecklist(); });
  gradeEl.addEventListener('change', () => { filters.grade = gradeEl.value; writeHashFromState(); renderChecklist(); });
  kindEl.addEventListener('change', () => { filters.kind = kindEl.value; writeHashFromState(); renderChecklist(); });
  statusEl.addEventListener('change', () => { filters.status = statusEl.value; writeHashFromState(); renderChecklist(); });
  missableEl.addEventListener('change', () => { filters.missableOnly = missableEl.checked; writeHashFromState(); renderChecklist(); });
  spoilerEl.addEventListener('change', () => {
    spoilers = spoilerEl.checked;
    saveSpoilers();
    writeHashFromState();
    renderRoadmap();
    renderMissables();
    renderChecklist();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', (e) => {
    importProgress(e.target.files[0]);
    e.target.value = '';
  });
  window.addEventListener('hashchange', () => {
    applyHashToState();
    renderChecklist();
  });
}

// ---- boot ----
async function loadTrophies() {
  const response = await fetch('data/trophies.json');
  const doc = await response.json();
  trophies = doc.trophies;
  byId = new Map(trophies.map((t) => [t.id, t]));
}

await loadTrophies();
applyHashToState();
bindControls();
renderProgress();
renderRoadmap();
renderMissables();
renderChecklist();
if (parseHash().roadmap) document.getElementById('roadmap')?.scrollIntoView();
if (expandedId !== null) document.getElementById(`trophy-${expandedId}`)?.scrollIntoView({ block: 'start' });
