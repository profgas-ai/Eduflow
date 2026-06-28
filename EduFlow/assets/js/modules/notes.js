import { getData, persist } from '../services/storage.js';
import { escapeHtml, generateId, sanitizeInput, debounce } from '../utils/helper.js';
import { formatDate } from '../utils/formatter.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';

export function initNotes() {
  const data = getData();
  let activeSubjectId = '';
  let searchTerm = '';

  function getFilteredNotes() {
    let notes = data.notes || [];
    if (activeSubjectId) {
      notes = notes.filter(n => n.subjectId === activeSubjectId);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(term) ||
        n.content.toLowerCase().includes(term) ||
        (n.tags || []).some(t => t.toLowerCase().includes(term))
      );
    }
    return notes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
  }

  function renderSubjectFilter() {
    const container = document.getElementById('notesSubjectFilter');
    if (!container) return;
    const subjects = data.subjects || [];
    container.innerHTML = '<button class="tab' + (!activeSubjectId ? ' active' : '') + '" data-id="">Semua</button>' +
      subjects.map(s =>
        `<button class="tab${s.id === activeSubjectId ? ' active' : ''}" data-id="${s.id}">${escapeHtml(s.name)}</button>`
      ).join('');
    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeSubjectId = tab.dataset.id;
        render();
      });
    });
  }

  function renderNotes() {
    const container = document.getElementById('notesList');
    if (!container) return;
    const notes = getFilteredNotes();

    if (notes.length === 0) {
      container.innerHTML = '<div class="empty-state">Belum ada catatan. Buat catatan pertamamu!</div>';
      return;
    }

    container.innerHTML = notes.map(n => `
      <div class="note-card ${n.pinned ? 'pinned' : ''}" data-id="${n.id}">
        <div class="note-header">
          <h3 class="note-title">${escapeHtml(n.title)}</h3>
          ${n.pinned ? '<span class="note-pin">📌</span>' : ''}
        </div>
        <div class="note-preview">${escapeHtml(n.content?.slice(0, 120))}</div>
        <div class="note-meta">
          <span>${formatDate(n.updatedAt || n.createdAt, 'short')}</span>
          ${(n.tags || []).slice(0, 3).map(t => `<span class="note-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="note-actions">
          <button class="icon-action btn-edit-note" data-id="${n.id}" title="Edit">✎</button>
          <button class="icon-action btn-toggle-pin" data-id="${n.id}" title="Pin">📌</button>
          <button class="icon-action btn-delete-note" data-id="${n.id}" title="Hapus">🗑</button>
        </div>
      </div>
    `).join('');

    bindNoteEvents();
  }

  function bindNoteEvents() {
    document.querySelectorAll('.btn-edit-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        editNote(id);
      });
    });
    document.querySelectorAll('.btn-toggle-pin').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        togglePin(id);
      });
    });
    document.querySelectorAll('.btn-delete-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        deleteNote(id);
      });
    });
    document.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('dblclick', () => {
        const id = card.dataset.id;
        if (id) editNote(id);
      });
    });
  }

  function togglePin(id) {
    const note = (data.notes || []).find(n => n.id === id);
    if (note) {
      note.pinned = !note.pinned;
      note.updatedAt = new Date().toISOString();
      persist();
      render();
    }
  }

  async function deleteNote(id) {
    const { showDialog } = await import('../components/dialog.js');
    const confirmed = await showDialog({
      title: 'Hapus Catatan', message: 'Hapus catatan ini?',
      confirmText: 'Hapus', danger: true,
    });
    if (!confirmed) return;
    data.notes = (data.notes || []).filter(n => n.id !== id);
    persist();
    render();
  }

  function openAddModal() {
    setText('noteModalTitle', 'Buat Catatan');
    document.getElementById('noteId').value = '';
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    document.getElementById('noteTags').value = '';
    renderSubjectSelect('noteSubject');
    openModal('noteModalBackdrop');
  }

  function editNote(id) {
    const note = (data.notes || []).find(n => n.id === id);
    if (!note) return;
    setText('noteModalTitle', 'Edit Catatan');
    document.getElementById('noteId').value = note.id;
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content || '';
    document.getElementById('noteTags').value = (note.tags || []).join(', ');
    renderSubjectSelect('noteSubject', note.subjectId);
    openModal('noteModalBackdrop');
  }

  function renderSubjectSelect(selectId, selectedId = '') {
    const select = document.getElementById(selectId);
    if (!select) return;
    const subjects = data.subjects || [];
    select.innerHTML = '<option value="">Umum</option>' +
      subjects.map(s =>
        `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`
      ).join('');
  }

  function saveNote() {
    const id = document.getElementById('noteId').value;
    const title = sanitizeInput(document.getElementById('noteTitle')?.value || 'Untitled');
    const content = document.getElementById('noteContent')?.value || '';
    const tags = (document.getElementById('noteTags')?.value || '').split(',').map(t => t.trim()).filter(Boolean);
    const subjectId = document.getElementById('noteSubject')?.value || '';

    if (!title) { showToast('Judul catatan wajib diisi'); return; }

    const now = new Date().toISOString();

    if (id) {
      const note = (data.notes || []).find(n => n.id === id);
      if (note) {
        Object.assign(note, { title, content, tags, subjectId, updatedAt: now });
        showToast('Catatan diperbarui');
      }
    } else {
      data.notes = data.notes || [];
      data.notes.push({
        id: generateId(), subjectId, title, content,
        checklist: [], pinned: false, tags,
        createdAt: now, updatedAt: now,
      });
      showToast('Catatan ditambahkan');
    }
    persist();
    closeModal('noteModalBackdrop');
    render();
  }

  function render() {
    renderSubjectFilter();
    renderNotes();
  }

  function init() {
    render();
    document.getElementById('fabBtn')?.addEventListener('click', openAddModal);
    document.getElementById('noteSaveBtn')?.addEventListener('click', saveNote);

    const searchInput = document.getElementById('notesSearch');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        searchTerm = e.target.value;
        renderNotes();
      }, 300));
    }
  }

  init();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
