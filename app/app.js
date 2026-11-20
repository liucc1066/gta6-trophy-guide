// Leonida Ledger — GTA 6 trophy tracker.
// Plain ES module, no dependencies, no network: the trophy data comes from
// ./data/trophies.json (a JSON module), progress lives in localStorage only.

import data from './data/trophies.json' with { type: 'json' };

const TROPHIES = data.trophies;
const ROADMAP = data.roadmap;
const BY_ID = new Map(TROPHIES.map((t) => [t.id, t]));
const PHASE_BY_ID = new Map();
for (const phase of ROADMAP) for (const id of phase.trophies) PHASE_BY_ID.set(id, phase);
const STORAGE_KEY = 'leonida-ledger-v1';

const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = { story: 'Story', collectible: 'Collectible', activity: 'Activity', meta: 'Meta', misc: 'Odd one' };

// ---------- saved progress ----------

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { earned: {}, counts: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { earned: {}, counts: {} };
    return {
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
    };
  } catch {
    return { earned: {}, counts: {} };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function isEarned(id) {
  return state.earned[id] === true;
}

function setEarned(id, value) {
  if (value) state.earned[id] = true;
  else delete state.earned[id];
  saveState();
}

function getCount(id) {
  const n = Number(state.counts[id]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function setCount(id, value) {
  const trophy = BY_ID.get(id);
  const max = trophy && trophy.target ? trophy.target : 0;
  const clamped = Math.max(0, Math.min(max || value, value));
  if (clamped > 0) state.counts[id] = clamped;
  else delete state.counts[id];
  saveState();
}

// ---------- filters ----------

const filters = { search: '', grade: 'all', status: 'all', kind: 'all', spoiler: false };

function trophyMatches(trophy) {
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.status === 'earned' && !isEarned(trophy.id)) return false;
  if (filters.status === 'remaining' && isEarned(trophy.id)) return false;
  if (filters.kind === 'missable' && !trophy.missable) return false;
  if (filters.kind !== 'all' && filters.kind !== 'missable' && trophy.kind !== filters.kind) return false;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const hay = (trophy.name + ' ' + trophy.description + ' ' + trophy.guide).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function spoilerHidden(trophy) {
  return filters.spoiler && trophy.kind === 'story' && !isEarned(trophy.id);
}

// ---------- rendering ----------

const listEl = document.getElementById('trophyList');
const emptyNote = document.getElementById('emptyNote');
const resultLine = document.getElementById('resultLine');

function gradeBadge(trophy) {
  return '<span class="medal medal-' + trophy.grade + '" title="' + GRADE_LABEL[trophy.grade] + '">' +
    GRADE_LABEL[trophy.grade][0] + '</span>';
}

function renderList() {
  const shown = TROPHIES.filter(trophyMatches);
  listEl.innerHTML = '';
  for (const trophy of shown) {
    const li = document.createElement('li');
    li.className = 'trophy-card grade-' + trophy.grade + (isEarned(trophy.id) ? ' earned' : '');
    li.dataset.id = trophy.id;

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'earn-check';
    check.checked = isEarned(trophy.id);
    check.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
    check.addEventListener('change', () => {
      setEarned(trophy.id, check.checked);
      renderAll();
    });

    const body = document.createElement('button');
    body.type = 'button';
    body.className = 'trophy-body';
    body.addEventListener('click', () => openDetail(trophy.id));

    const hidden = spoilerHidden(trophy);
    const name = hidden ? 'Hidden story trophy' : trophy.name;
    const desc = hidden ? 'Spoiler mode hides this story trophy until you earn it.' : trophy.description;
    const tags = [];
    const phase = PHASE_BY_ID.get(trophy.id);
    if (phase) tags.push('<span class="tag tag-phase">Phase ' + phase.phase + '</span>');
    if (trophy.missable) tags.push('<span class="tag tag-missable">Missable</span>');
    tags.push('<span class="tag">' + KIND_LABEL[trophy.kind] + '</span>');
    if (trophy.target) {
      tags.push('<span class="tag tag-count">' + getCount(trophy.id) + ' / ' + trophy.target + ' ' + (trophy.target_unit || '') + '</span>');
    }
    body.innerHTML =
      '<span class="trophy-head">' + gradeBadge(trophy) +
      '<span class="trophy-name">' + escapeHtml(name) + '</span></span>' +
      '<span class="trophy-desc">' + escapeHtml(desc) + '</span>' +
      '<span class="trophy-tags">' + tags.join('') + '</span>';

    li.append(check, body);
    listEl.append(li);
  }
  emptyNote.hidden = shown.length !== 0;
  resultLine.textContent = shown.length + ' of 55 trophies shown · ' +
    TROPHIES.filter((t) => isEarned(t.id)).length + ' earned';
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderProgress() {
  const earned = TROPHIES.filter((t) => isEarned(t.id));
  document.getElementById('earnedCount').textContent = earned.length;
  document.getElementById('progressBar').style.width = (earned.length / TROPHIES.length * 100) + '%';
  const byGrade = (g) => TROPHIES.filter((t) => t.grade === g && isEarned(t.id)).length;
  document.getElementById('gradeLine').textContent =
    'Platinum ' + byGrade('platinum') + '/1 · Gold ' + byGrade('gold') + '/2 · ' +
    'Silver ' + byGrade('silver') + '/6 · Bronze ' + byGrade('bronze') + '/46';
  renderNextUp();
}

function roadmapOrder() {
  const order = [];
  for (const phase of ROADMAP) for (const id of phase.trophies) order.push(id);
  return order;
}

function renderNextUp() {
  const next = roadmapOrder().map((id) => BY_ID.get(id)).find((t) => t && !isEarned(t.id));
  const el = document.getElementById('nextUp');
  if (!next) {
    el.textContent = 'All 55 earned — you are a Leonida Legend.';
    return;
  }
  const phase = ROADMAP.find((p) => p.trophies.includes(next.id));
  if (spoilerHidden(next)) {
    el.textContent = 'Next up: a hidden story trophy in phase ' + phase.phase + ' — ' + phase.title + '.';
  } else {
    el.textContent = 'Next up: ' + next.name + ' (phase ' + phase.phase + ' — ' + phase.title + ').';
  }
}

function renderRoadmap() {
  const list = document.getElementById('phaseList');
  list.innerHTML = '';
  for (const phase of ROADMAP) {
    const done = phase.trophies.filter((id) => isEarned(id)).length;
    const li = document.createElement('li');
    li.className = 'phase';
    const chips = phase.trophies.map((id) => {
      const t = BY_ID.get(id);
      const label = spoilerHidden(t) ? '???' : t.name;
      return '<span class="chip' + (isEarned(id) ? ' chip-done' : '') + '" data-id="' + id + '">' + escapeHtml(label) + '</span>';
    }).join('');
    li.innerHTML =
      '<h3>Phase ' + phase.phase + ' — ' + escapeHtml(phase.title) + '</h3>' +
      '<p>' + escapeHtml(phase.summary) + '</p>' +
      '<p class="phase-count">' + done + ' / ' + phase.trophies.length + ' earned</p>' +
      '<p class="chips">' + chips + '</p>';
    list.append(li);
  }
  list.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => openDetail(Number(chip.dataset.id)));
  });
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderList();
}

// ---------- detail dialog ----------

const dialog = document.getElementById('detailDialog');
const detailBody = document.getElementById('detailBody');

function openDetail(id) {
  const trophy = BY_ID.get(id);
  if (!trophy) return;
  const hidden = spoilerHidden(trophy);
  const sourceLinks = trophy.sources.map((s) => '<li>' + escapeHtml(s) + '</li>').join('');
  let counterHtml = '';
  if (trophy.target) {
    counterHtml =
      '<div class="counter"><span>Your progress</span>' +
      '<button type="button" id="countDown" aria-label="Decrease count">−</button>' +
      '<strong id="countValue">' + getCount(id) + ' / ' + trophy.target + ' ' + escapeHtml(trophy.target_unit || '') + '</strong>' +
      '<button type="button" id="countUp" aria-label="Increase count">+</button></div>';
  }
  detailBody.innerHTML =
    '<p class="detail-grade">' + gradeBadge(trophy) + ' ' + GRADE_LABEL[trophy.grade] + ' trophy</p>' +
    '<h2>' + escapeHtml(hidden ? 'Hidden story trophy' : trophy.name) + '</h2>' +
    '<p class="detail-phase"><strong>Roadmap:</strong> phase ' + PHASE_BY_ID.get(id).phase + ' — ' + escapeHtml(PHASE_BY_ID.get(id).title) + '</p>' +
    '<p class="detail-desc"><strong>Official description:</strong> ' + escapeHtml(hidden ? 'Hidden until earned.' : trophy.description) + '</p>' +
    (trophy.missable ? '<p class="detail-missable"><strong>Missable:</strong> ' + escapeHtml(trophy.missable_note || 'Flagged from the official description.') + '</p>' : '') +
    '<h3>Guide</h3><p class="detail-guide">' + escapeHtml(trophy.guide) + '</p>' +
    counterHtml +
    '<h3>Sources</h3><ul class="detail-sources">' + sourceLinks +
    '<li><a href="https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/">Exophase — the official trophy list</a></li>' +
    '<li><a href="https://psnprofiles.com/trophies/43531-grand-theft-auto-vi">PSNProfiles — PSN progress targets</a></li></ul>' +
    '<label class="detail-earned"><input type="checkbox" id="detailEarned"' + (isEarned(id) ? ' checked' : '') + '> Earned</label>';

  const down = detailBody.querySelector('#countDown');
  const up = detailBody.querySelector('#countUp');
  const value = detailBody.querySelector('#countValue');
  const bump = (delta) => {
    setCount(id, getCount(id) + delta);
    value.textContent = getCount(id) + ' / ' + trophy.target + ' ' + (trophy.target_unit || '');
    renderAll();
  };
  if (down) down.addEventListener('click', () => bump(-1));
  if (up) up.addEventListener('click', () => bump(1));
  detailBody.querySelector('#detailEarned').addEventListener('change', (event) => {
    setEarned(id, event.target.checked);
    renderAll();
  });
  dialog.showModal();
}

// ---------- toolbar wiring ----------

document.getElementById('searchInput').addEventListener('input', (event) => {
  filters.search = event.target.value.trim();
  renderList();
});
document.getElementById('gradeFilter').addEventListener('change', (event) => {
  filters.grade = event.target.value;
  renderList();
});
document.getElementById('statusFilter').addEventListener('change', (event) => {
  filters.status = event.target.value;
  renderList();
});
document.getElementById('kindRow').addEventListener('click', (event) => {
  const btn = event.target.closest('[data-kind]');
  if (!btn) return;
  filters.kind = btn.dataset.kind;
  document.querySelectorAll('#kindRow .kind-btn').forEach((b) => b.classList.toggle('active', b === btn));
  renderList();
});
document.getElementById('spoilerToggle').addEventListener('change', (event) => {
  filters.spoiler = event.target.checked;
  renderAll();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const payload = {
    app: 'leonida-ledger',
    exportedAt: new Date().toISOString(),
    earned: TROPHIES.filter((t) => isEarned(t.id)).map((t) => t.id),
    counts: state.counts,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophies-progress.json';
  a.click();
  URL.revokeObjectURL(url);
});

const importFile = document.getElementById('importFile');
document.getElementById('importBtn').addEventListener('click', () => importFile.click());
importFile.addEventListener('change', async () => {
  const file = importFile.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const earned = Array.isArray(parsed.earned) ? parsed.earned : [];
    const next = { earned: {}, counts: {} };
    for (const id of earned) if (BY_ID.has(Number(id))) next.earned[Number(id)] = true;
    if (parsed.counts && typeof parsed.counts === 'object') {
      for (const [key, value] of Object.entries(parsed.counts)) {
        if (BY_ID.has(Number(key))) next.counts[Number(key)] = Math.max(0, Math.floor(Number(value) || 0));
      }
    }
    state = next;
    saveState();
    renderAll();
    resultLine.textContent = 'Progress imported: ' + earned.length + ' trophies earned.';
  } catch {
    resultLine.textContent = 'That file could not be read as a progress export.';
  }
  importFile.value = '';
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!window.confirm('Clear all earned trophies and counters?')) return;
  state = { earned: {}, counts: {} };
  saveState();
  renderAll();
});

renderAll();
