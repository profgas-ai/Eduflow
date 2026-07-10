import { escapeHtml } from '../utils/helper.js';
import { getData } from '../services/storage.js';

let overlay = null;

export function initGlobalSearch() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape' && overlay) closeSearch();
  });
}

function ensureOverlay() {
  if (overlay && document.body.contains(overlay)) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'globalSearchOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:99999;display:none;align-items:flex-start;justify-content:center;padding-top:10vh;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)';
  overlay.innerHTML = `
    <div style="background:var(--surface-container-lowest);border-radius:var(--radius-xl);width:100%;max-width:520px;box-shadow:0 16px 48px rgba(0,0,0,0.2);overflow:hidden">
      <div style="display:flex;align-items:center;gap:0.5rem;padding:0.75rem 1rem;border-bottom:1px solid var(--outline-variant)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" id="globalSearchInput" placeholder="Cari mata kuliah, tugas, catatan, jadwal..." style="flex:1;border:none;outline:none;background:transparent;font-size:15px;color:var(--on-surface)">
        <span style="font-size:11px;color:var(--on-surface-variant);background:var(--surface-container);padding:0.2rem 0.4rem;border-radius:4px">ESC</span>
      </div>
      <div id="globalSearchResults" style="max-height:400px;overflow-y:auto"></div>
    </div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });
  document.body.appendChild(overlay);
  return overlay;
}

function openSearch() {
  const el = ensureOverlay();
  el.style.display = 'flex';
  const input = document.getElementById('globalSearchInput');
  if (input) { input.value = ''; input.focus(); }
  document.getElementById('globalSearchResults').innerHTML = '<div style="padding:2rem;text-align:center;color:var(--on-surface-variant);font-size:14px">Ketik untuk mencari...</div>';
}

function closeSearch() {
  if (overlay) overlay.style.display = 'none';
}

function navigateTo(url) {
  closeSearch();
  window.location.href = url;
}

export function setupGlobalSearch() {
  initGlobalSearch();

  const input = document.getElementById('globalSearchInput');
  if (!input) return;

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => performSearch(input.value.trim()), 200);
  });
}

function performSearch(query) {
  const resultsEl = document.getElementById('globalSearchResults');
  if (!resultsEl) return;
  if (!query) {
    resultsEl.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--on-surface-variant);font-size:14px">Ketik untuk mencari...</div>';
    return;
  }
  const data = getData();
  const q = query.toLowerCase();
  const maxResults = 6;

  const subjects = (data.subjects || []).filter(s => s.name.toLowerCase().includes(q)).slice(0, maxResults);
  const tasks = (data.tasks || []).filter(t => t.title.toLowerCase().includes(q)).slice(0, maxResults);
  const notes = (data.notes || []).filter(n => n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)).slice(0, maxResults);
  const schedules = (data.schedules || []).filter(s => {
    const subj = (data.subjects || []).find(x => x.id === s.subjectId);
    return subj && subj.name.toLowerCase().includes(q);
  }).slice(0, maxResults);

  const total = subjects.length + tasks.length + notes.length + schedules.length;
  if (total === 0) {
    resultsEl.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--on-surface-variant);font-size:14px">Tidak ditemukan hasil untuk "' + escapeHtml(query) + '"</div>';
    return;
  }

  let html = '';
  if (subjects.length > 0) {
    html += '<div style="padding:0.5rem 1rem 0.25rem;font-size:11px;font-weight:700;color:var(--on-surface-variant);text-transform:uppercase;letter-spacing:0.5px">Mata Kuliah</div>';
    html += subjects.map(s => `<div class="gs-result" data-url="subjects.html" style="padding:0.5rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.5rem;transition:background 0.15s"><span style="font-size:16px">📚</span><span>${escapeHtml(s.name)}</span><span style="font-size:12px;color:var(--on-surface-variant)">SKS ${s.sks}</span></div>`).join('');
  }
  if (tasks.length > 0) {
    html += '<div style="padding:0.5rem 1rem 0.25rem;font-size:11px;font-weight:700;color:var(--on-surface-variant);text-transform:uppercase;letter-spacing:0.5px">Tugas</div>';
    html += tasks.map(t => `<div class="gs-result" data-url="tasks.html" style="padding:0.5rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.5rem;transition:background 0.15s"><span style="font-size:16px">📝</span><span>${escapeHtml(t.title)}</span></div>`).join('');
  }
  if (notes.length > 0) {
    html += '<div style="padding:0.5rem 1rem 0.25rem;font-size:11px;font-weight:700;color:var(--on-surface-variant);text-transform:uppercase;letter-spacing:0.5px">Catatan</div>';
    html += notes.map(n => `<div class="gs-result" data-url="notes.html" style="padding:0.5rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.5rem;transition:background 0.15s"><span style="font-size:16px">📄</span><span>${escapeHtml(n.title)}</span></div>`).join('');
  }
  if (schedules.length > 0) {
    html += '<div style="padding:0.5rem 1rem 0.25rem;font-size:11px;font-weight:700;color:var(--on-surface-variant);text-transform:uppercase;letter-spacing:0.5px">Jadwal</div>';
    html += schedules.map(sc => {
      const subj = (data.subjects || []).find(x => x.id === sc.subjectId);
      return `<div class="gs-result" data-url="index.html" style="padding:0.5rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.5rem;transition:background 0.15s"><span style="font-size:16px">📅</span><span>${escapeHtml(subj?.name || '')} — ${sc.day} ${sc.startTime}</span></div>`;
    }).join('');
  }
  resultsEl.innerHTML = html;
  resultsEl.querySelectorAll('.gs-result').forEach(el => {
    el.addEventListener('mouseenter', () => el.style.background = 'var(--surface-container)');
    el.addEventListener('mouseleave', () => el.style.background = '');
    el.addEventListener('click', () => navigateTo(el.dataset.url));
  });
}
