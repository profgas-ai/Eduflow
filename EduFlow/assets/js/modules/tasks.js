import { getData, persist } from '../services/storage.js';
import { escapeHtml, generateId, sanitizeInput, debounce } from '../utils/helper.js';
import { createTaskCard } from '../components/card.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export function initTasks() {
  const data = getData();
  let searchTerm = '';
  let filterPriority = '';
  let filterStatus = '';
  let filterCategory = '';
  let sortBy = 'deadline';

  function renderSubjectOptions(selectId, selectedId = '') {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">Pilih mata kuliah</option>' +
      (data.subjects || []).map(s =>
        `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`
      ).join('');
  }

  function render() {
    const tasks = data.tasks || [];
    const subjects = data.subjects || [];

    let filtered = tasks.filter(t => {
      if (searchTerm) {
        const subj = subjects.find(s => s.id === t.subjectId);
        const hay = (t.title + ' ' + (subj ? subj.name : '')).toLowerCase();
        if (!hay.includes(searchTerm)) return false;
      }
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterCategory && t.category !== filterCategory) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'deadline') return new Date(a.deadline) - new Date(b.deadline);
      if (sortBy === 'priority') {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.priority] || 1) - (order[b.priority] || 1);
      }
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

    const pending = filtered.filter(t => t.status !== 'completed');
    const completed = filtered.filter(t => t.status === 'completed');

    setText('pendingCount', String(pending.length).padStart(2, '0'));
    setText('taskTotal', filtered.length);
    setText('taskPending', pending.length);
    setText('taskCompleted', completed.length);

    const pendingEl = document.getElementById('pendingList');
    if (pendingEl) {
      pendingEl.innerHTML = pending.length === 0
        ? '<div class="empty-state">Tidak ada tugas pending 🎉</div>'
        : pending.map(t => createTaskCard(t, subjects)).join('');
    }

    const completedEl = document.getElementById('completedList');
    if (completedEl) {
      completedEl.innerHTML = completed.length === 0
        ? '<div class="empty-state">Belum ada tugas selesai.</div>'
        : completed.map(t => createTaskCard(t, subjects)).join('');
    }

    bindTaskEvents();
  }

  function bindTaskEvents() {
    document.querySelectorAll('.task-checkbox').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        toggleTask(id);
      });
    });
    document.querySelectorAll('.btn-edit-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        editTask(id);
      });
    });
    document.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        deleteTask(id);
      });
    });
  }

  function toggleTask(id) {
    const t = data.tasks.find(x => x.id === id);
    if (t) {
      if (t.status === 'completed') {
        t.status = 'pending';
        t.completedAt = null;
      } else {
        t.status = 'completed';
        t.completedAt = new Date().toISOString();
      }
      persist();
      render();
    }
  }

  async function deleteTask(id) {
    const { showDialog } = await import('../components/dialog.js');
    const confirmed = await showDialog({
      title: 'Hapus Tugas',
      message: 'Hapus tugas ini?',
      confirmText: 'Hapus',
      danger: true,
    });
    if (!confirmed) return;
    data.tasks = data.tasks.filter(x => x.id !== id);
    persist();
    render();
  }

  function resetModal() {
    setText('taskModalTitle', 'Tambah Tugas');
    document.getElementById('taskId').value = '';
    ['tTitle', 'tDesc', 'tDue', 'tNotes', 'tReference'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    setValue('tPriority', 'medium');
    setValue('tCategory', '');
    setValue('tProgress', 0);
    renderSubjectOptions('tSubject');
    openModal('taskModalBackdrop');
  }

  function editTask(id) {
    const t = data.tasks.find(x => x.id === id);
    if (!t) return;
    setText('taskModalTitle', 'Edit Tugas');
    document.getElementById('taskId').value = t.id;
    renderSubjectOptions('tSubject', t.subjectId);
    setValue('tTitle', t.title);
    setValue('tDesc', t.description || '');
    setValue('tPriority', t.priority || 'medium');
    setValue('tCategory', t.category || '');
    setValue('tProgress', t.progress || 0);
    setValue('tNotes', t.notes || '');
    setValue('tReference', (t.references || []).join(', '));
    if (t.deadline) {
      const d = new Date(t.deadline);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setValue('tDue', d.toISOString().slice(0, 16));
    }
    openModal('taskModalBackdrop');
  }

  function saveTask() {
    const id = document.getElementById('taskId').value;
    const title = sanitizeInput(document.getElementById('tTitle')?.value || '');
    const desc = document.getElementById('tDesc')?.value?.trim() || '';
    const due = document.getElementById('tDue')?.value;
    const subjectId = document.getElementById('tSubject')?.value || '';
    const priority = document.getElementById('tPriority')?.value || 'medium';
    const category = document.getElementById('tCategory')?.value || '';
    const progress = Number(document.getElementById('tProgress')?.value) || 0;
    const notes = document.getElementById('tNotes')?.value?.trim() || '';
    const refs = (document.getElementById('tReference')?.value || '').split(',').map(r => r.trim()).filter(Boolean);

    if (!title || !due) { showToast('Lengkapi judul dan tenggat'); return; }

    if (id) {
      const t = data.tasks.find(x => x.id === id);
      if (t) {
        Object.assign(t, {
          title, description: desc, deadline: new Date(due).toISOString(),
          deadlineTime: due.includes('T') ? due.split('T')[1] : '23:59',
          subjectId, priority, category, progress, notes, references: refs,
        });
        showToast('Tugas diperbarui');
      }
    } else {
      data.tasks.push({
        id: generateId(), subjectId, title, description: desc,
        deadline: new Date(due).toISOString(),
        deadlineTime: due.includes('T') ? due.split('T')[1] : '23:59',
        priority, status: 'pending', category, progress, notes,
        references: refs, checklist: [], attachments: [],
        reminder: false,
        createdAt: new Date().toISOString(), completedAt: null,
      });
      showToast('Tugas ditambahkan');
    }
    persist();
    closeModal('taskModalBackdrop');
    render();
  }

  function init() {
    render();

    document.getElementById('fabBtn')?.addEventListener('click', resetModal);
    document.getElementById('taskSaveBtn')?.addEventListener('click', saveTask);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        searchTerm = e.target.value.toLowerCase();
        render();
      }, 300));
    }

    document.querySelectorAll('.filter-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const key = e.currentTarget.dataset.filter;
        const value = e.currentTarget.value;
        if (key === 'priority') filterPriority = value;
        if (key === 'status') filterStatus = value;
        if (key === 'category') filterCategory = value;
        render();
      });
    });

    document.querySelectorAll('.sort-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        sortBy = e.currentTarget.value;
        render();
      });
    });
  }

  init();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}
