import { getData } from '../services/storage.js';
import { db } from '../services/database.js';
import { escapeHtml, generateId, sanitizeInput } from '../utils/helper.js';
import { createSubjectCard } from '../components/card.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { CONFIG } from '../config/config.js';

export function initSubjects() {
  const data = getData();
  let activeSemester = null;

  function getSemesters() {
    const set = new Set(data.subjects.map(s => s.semester));
    return [...set].sort((a, b) => b - a);
  }

  function renderTabs() {
    const sems = getSemesters();
    if (activeSemester === null) activeSemester = sems[0] || CONFIG.DEFAULT_SEMESTER;
    const tabsEl = document.getElementById('semesterTabs');
    if (!tabsEl) return;
    tabsEl.innerHTML = sems.length === 0
      ? `<div class="tab active">Semester ${activeSemester}</div>`
      : sems.map(s =>
        `<div class="tab ${s === activeSemester ? 'active' : ''}" data-semester="${s}">Semester ${s}</div>`
      ).join('');
    tabsEl.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeSemester = Number(tab.dataset.semester);
        render();
      });
    });
  }

  function renderStats() {
    const list = data.subjects.filter(s => s.semester === activeSemester);
    const totalSks = list.reduce((a, s) => a + Number(s.sks), 0);
    setText('totalSks', totalSks + ' SKS');
    let totalSessions = 0, totalPresent = 0;
    list.forEach(s => {
      totalSessions += s.totalSessions || 0;
      totalPresent += s.present || 0;
    });
    const pct = totalSessions ? Math.round((totalPresent / totalSessions) * 100) : 0;
    setText('totalProgressPct', pct + '% Selesai');
    const fill = document.getElementById('totalProgressFill');
    if (fill) fill.style.width = pct + '%';
  }

  function renderGrid() {
    const list = data.subjects.filter(s => s.semester === activeSemester);
    const grid = document.getElementById('subjectGrid');
    if (!grid) return;

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          Belum ada mata kuliah. Tambahkan mata kuliah pertamamu!
        </div>
        <div class="subject-add" onclick="document.getElementById('fabBtn')?.click()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Tambah Mata Kuliah
        </div>`;
      return;
    }

    grid.innerHTML = list.map(s => createSubjectCard(s)).join('') +
      `<div class="subject-add" id="addSubjectCard">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Slot tersedia
      </div>`;
    bindSubjectEvents();
  }

  function bindSubjectEvents() {
    document.querySelectorAll('.btn-edit-subject').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        editSubject(id);
      });
    });
    document.querySelectorAll('.btn-delete-subject').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        deleteSubject(id);
      });
    });
    document.getElementById('addSubjectCard')?.addEventListener('click', () => openAddModal());
  }

  function render() {
    renderTabs();
    renderStats();
    renderGrid();
  }

  function openAddModal() {
    setText('subjectModalTitle', 'Tambah Mata Kuliah');
    document.getElementById('subjectId').value = '';
    ['sName', 'sCode', 'sLecturer', 'sLecturerEmail', 'sLecturerPhone', 'sRoom', 'sLinkLms', 'sLinkMeet', 'sLinkWa', 'sNotes'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    setValue('sSks', 3);
    setValue('sSemester', activeSemester || CONFIG.DEFAULT_SEMESTER);
    setValue('sColor', '#4f46e5');
    setValue('sDay', '');
    setValue('sStartTime', '');
    setValue('sEndTime', '');
    openModal('subjectModalBackdrop');
  }

  function editSubject(id) {
    const s = data.subjects.find(x => x.id === id);
    if (!s) return;
    setText('subjectModalTitle', 'Kelola Mata Kuliah');
    document.getElementById('subjectId').value = s.id;
    setValue('sName', s.name);
    setValue('sCode', s.code);
    setValue('sLecturer', s.lecturer);
    setValue('sLecturerEmail', s.lecturerEmail || '');
    setValue('sLecturerPhone', s.lecturerPhone || '');
    setValue('sRoom', s.room || '');
    setValue('sLinkLms', s.linkLms || '');
    setValue('sLinkMeet', s.linkMeet || '');
    setValue('sLinkWa', s.linkWa || '');
    setValue('sNotes', s.notes || '');
    setValue('sSks', s.sks);
    setValue('sSemester', s.semester);
    setValue('sColor', s.color);
    setValue('sDay', s.day || '');
    setValue('sStartTime', s.startTime || '');
    setValue('sEndTime', s.endTime || '');
    openModal('subjectModalBackdrop');
  }

  async function deleteSubject(id) {
    const { showDialog } = await import('../components/dialog.js');
    const s = data.subjects.find(x => x.id === id);
    if (!s) return;
    const relatedTasks = data.tasks.filter(t => t.subjectId === id).length;
    const confirmed = await showDialog({
      title: 'Hapus Mata Kuliah',
      message: `Hapus "${s.name}"?${relatedTasks > 0 ? ` ${relatedTasks} tugas terkait juga akan dihapus.` : ''}`,
      confirmText: 'Hapus',
      danger: true,
    });
    if (!confirmed) return;
    data.subjects = data.subjects.filter(x => x.id !== id);
    data.tasks = data.tasks.filter(t => t.subjectId !== id);
    data.schedules = (data.schedules || []).filter(c => c.subjectId !== id);
    data.attendanceRecords = (data.attendanceRecords || []).filter(a => a.subjectId !== id);
    data.notes = (data.notes || []).filter(n => n.subjectId !== id);
    persist();
    showToast('Mata kuliah dihapus');
    const sems = getSemesters();
    if (!sems.includes(activeSemester)) activeSemester = sems[0] || null;
    render();
  }

  function saveSubject() {
    const id = document.getElementById('subjectId').value;
    const name = sanitizeInput(document.getElementById('sName')?.value || '');
    const code = sanitizeInput(document.getElementById('sCode')?.value || '');
    const lecturer = sanitizeInput(document.getElementById('sLecturer')?.value || '');
    const sks = Number(document.getElementById('sSks')?.value) || 3;
    const semester = Number(document.getElementById('sSemester')?.value) || CONFIG.DEFAULT_SEMESTER;
    const color = document.getElementById('sColor')?.value || '#4f46e5';
    if (!name) { showToast('Nama mata kuliah wajib diisi'); return; }

    const extra = {
      lecturerEmail: document.getElementById('sLecturerEmail')?.value || '',
      lecturerPhone: document.getElementById('sLecturerPhone')?.value || '',
      room: document.getElementById('sRoom')?.value || '',
      linkLms: document.getElementById('sLinkLms')?.value || '',
      linkMeet: document.getElementById('sLinkMeet')?.value || '',
      linkWa: document.getElementById('sLinkWa')?.value || '',
      notes: document.getElementById('sNotes')?.value || '',
      day: document.getElementById('sDay')?.value || '',
      startTime: document.getElementById('sStartTime')?.value || '',
      endTime: document.getElementById('sEndTime')?.value || '',
    };

    if (id) {
      const s = data.subjects.find(x => x.id === id);
      if (s) {
        const updates = { name, code, lecturer, sks, semester, color, ...extra, updatedAt: new Date().toISOString() };
        Object.assign(s, updates);
        db.update('subjects', { id }, updates);
        showToast('Mata kuliah diperbarui');
      }
    } else {
      const newSubject = {
        id: generateId(), name, code, lecturer, sks, semester, color,
        ...extra, category: '', icon: '', active: true,
        totalSessions: 0, present: 0, currentMeeting: 0, totalMeetings: 16,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      data.subjects.push(newSubject);
      db.insert('subjects', newSubject);
      if (extra.day && extra.startTime) {
        data.schedules = data.schedules || [];
        const newSchedule = {
          id: generateId(), subjectId: newSubject.id,
          day: extra.day, startTime: extra.startTime, endTime: extra.endTime,
          room: extra.room, lecturer, linkMeet: extra.linkMeet,
        };
        data.schedules.push(newSchedule);
        db.insert('schedules', newSchedule);
      }
      showToast('Mata kuliah ditambahkan');
      activeSemester = semester;
    }
    closeModal('subjectModalBackdrop');
    closeModal('subjectModalBackdrop');
    render();
  }

  function init() {
    render();
    document.getElementById('fabBtn')?.addEventListener('click', openAddModal);
    document.getElementById('subjectSaveBtn')?.addEventListener('click', saveSubject);
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
