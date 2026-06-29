import { getData } from '../services/storage.js';
import { db } from '../services/database.js';
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

  function toggleSubtask(taskId, idx) {
    const t = data.tasks.find(x => x.id === taskId);
    if (!t) return;
    const checklist = t.checklist || [];
    if (checklist[idx]) {
      checklist[idx].done = !checklist[idx].done;
      const doneCount = checklist.filter(s => s.done).length;
      const progress = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;
      if (progress === 100) {
        t.status = 'completed';
        t.completedAt = new Date().toISOString();
      } else if (t.status === 'completed') {
        t.status = 'pending';
        t.completedAt = null;
      }
      t.progress = progress;
      db.update('tasks', { id: taskId }, { checklist, progress, status: t.status, completedAt: t.completedAt });
      render();
    }
  }

  function bindTaskEvents() {
    document.querySelectorAll('.task-checkbox').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        toggleTask(id);
      });
    });
    document.querySelectorAll('.subtask-checkbox').forEach(el => {
      el.addEventListener('change', (e) => {
        const id = e.currentTarget.dataset.id;
        const idx = parseInt(e.currentTarget.dataset.idx);
        toggleSubtask(id, idx);
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
      const updates = t.status === 'completed'
        ? { status: 'pending', completedAt: null }
        : { status: 'completed', completedAt: new Date().toISOString() };
      Object.assign(t, updates);
      db.update('tasks', { id }, updates);
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
    db.delete('tasks', { id });
    render();
  }

  function getSubtaskInputs() {
    const inputs = document.querySelectorAll('.subtask-input');
    return Array.from(inputs).map(i => ({ text: i.value.trim(), done: false })).filter(s => s.text);
  }

  function renderSubtaskInputs(items) {
    const container = document.getElementById('subtaskContainer');
    if (!container) return;
    container.innerHTML = (items.length === 0 ? [{ text: '', done: false }] : items).map((item, i) => `
      <div class="subtask-row" style="display:flex;gap:0.4rem;margin-bottom:0.3rem">
        <input type="text" class="subtask-input" value="${escapeHtml(item.text)}" placeholder="cth: Bab 1" style="flex:1;padding:0.4rem 0.6rem;border:1px solid var(--outline-variant);border-radius:var(--radius-sm);background:var(--surface-container);font-size:13px">
        <button class="icon-action subtask-remove" type="button" style="font-size:16px">×</button>
      </div>
    `).join('');
    container.querySelectorAll('.subtask-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.currentTarget.closest('.subtask-row')?.remove();
      });
    });
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
    const reminderEl = document.getElementById('tReminder');
    if (reminderEl) reminderEl.checked = false;
    renderSubjectOptions('tSubject');
    renderSubtaskInputs([]);
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
    const reminderEl = document.getElementById('tReminder');
    if (reminderEl) reminderEl.checked = !!t.reminder;
    renderSubtaskInputs(t.checklist || []);
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
    const notes = document.getElementById('tNotes')?.value?.trim() || '';
    const reminder = document.getElementById('tReminder')?.checked || false;
    const refs = (document.getElementById('tReference')?.value || '').split(',').map(r => r.trim()).filter(Boolean);
    const checklist = getSubtaskInputs();
    const doneCount = checklist.filter(s => s.done).length;
    const progress = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : Number(document.getElementById('tProgress')?.value) || 0;

    if (!title || !due) { showToast('Lengkapi judul dan tenggat'); return; }

    if (id) {
      const t = data.tasks.find(x => x.id === id);
      if (t) {
        const updates = {
          title, description: desc, deadline: new Date(due).toISOString(),
          deadlineTime: due.includes('T') ? due.split('T')[1] : '23:59',
          subjectId, priority, category, progress, notes, references: refs, checklist, reminder,
        };
        Object.assign(t, updates);
        db.update('tasks', { id }, updates);
        showToast('Tugas diperbarui');
      }
    } else {
      const newTask = {
        id: generateId(), subjectId, title, description: desc,
        deadline: new Date(due).toISOString(),
        deadlineTime: due.includes('T') ? due.split('T')[1] : '23:59',
        priority, status: 'pending', category, progress, notes,
        references: refs, checklist, attachments: [],
        reminder,
        createdAt: new Date().toISOString(), completedAt: null,
      };
      data.tasks.push(newTask);
      db.insert('tasks', newTask);
      showToast('Tugas ditambahkan');
    }
    closeModal('taskModalBackdrop');
    render();
  }

  function init() {
    render();

    document.getElementById('fabBtn')?.addEventListener('click', resetModal);
    document.getElementById('taskSaveBtn')?.addEventListener('click', saveTask);
    document.getElementById('addSubtaskBtn')?.addEventListener('click', () => {
      const container = document.getElementById('subtaskContainer');
      if (container) {
        const div = document.createElement('div');
        div.className = 'subtask-row';
        div.style.cssText = 'display:flex;gap:0.4rem;margin-bottom:0.3rem';
        div.innerHTML = '<input type="text" class="subtask-input" placeholder="cth: Bab 1" style="flex:1;padding:0.4rem 0.6rem;border:1px solid var(--outline-variant);border-radius:var(--radius-sm);background:var(--surface-container);font-size:13px"><button class="icon-action subtask-remove" type="button" style="font-size:16px">×</button>';
        div.querySelector('.subtask-remove').addEventListener('click', () => div.remove());
        container.appendChild(div);
      }
    });

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
