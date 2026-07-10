import { getData, persist } from '../services/storage.js';
import { db } from '../services/database.js';
import { escapeHtml, getGreeting, getDayName, generateId } from '../utils/helper.js';
import { formatDate } from '../utils/formatter.js';
import { chartManager } from '../components/chart.js';
import { showToast } from '../components/toast.js';
import { showSkeleton, hideSkeleton } from '../components/loading.js';
import { renderSchedule, setupTimetable } from './timetable.js';
import { setupGpaCalculator } from './gpa.js';
import { getRecentActivities, pushActivity } from '../services/activity.js';
import { archiveSemester, getArchivedSemesters } from '../services/semester.js';

export function initDashboard() {
  const data = getData();

  ['upcomingTasks', 'weeklyDeadlineList', 'classList', 'dashboardNotesList', 'activityFeed', 'enhancedStats'].forEach(id => {
    const el = document.getElementById(id);
    if (el) showSkeleton(el, 3, 'row');
  });

  renderGreeting(data.user);
  renderClock();
  renderStats(data);
  renderMomentum(data);
  renderWeeklySummary(data);
  renderSchedule(data);
  renderEnhancedStats(data);
  setupTimetable(data);
  renderUpcomingTasks(data);
  initCharts(data);
  setupQuickAdd(data);
  setupSemesterSwitcher(data);
  renderPinnedNotes(data);
  renderWeeklyDeadline(data);
  renderActivityFeed(data);
  renderNextClass(data);
  setupClickableStats();
  setupQuickAttend(data);
  setupGpaCalculator(data);
  showOnboarding(data);
  requestAnimationFrame(() => {
    ['upcomingTasks', 'weeklyDeadlineList', 'classList', 'dashboardNotesList', 'activityFeed', 'enhancedStats'].forEach(id => {
      const el = document.getElementById(id);
      if (el) hideSkeleton(el);
    });
  });
}

function renderGreeting(user) {
  const el = document.getElementById('greeting');
  if (el) el.textContent = `${getGreeting()}, ${(user.name || 'Pengguna').toUpperCase()}`;
  const title = document.getElementById('greetingTitle');
  if (title) {
    const hour = new Date().getHours();
    const messages = { morning: 'Siap untuk fokus?', afternoon: 'Tetap semangat!', evening: 'Selamat beristirahat', night: 'Selamat malam' };
    title.textContent = hour < 11 ? messages.morning : hour < 15 ? messages.afternoon : hour < 18 ? messages.evening : messages.night;
  }
}

function renderClock() {
  const el = document.getElementById('realtimeClock');
  if (!el) return;
  function update() {
    el.textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  update();
  setInterval(update, 1000);
  const dateEl = document.getElementById('currentDate');
  if (dateEl) dateEl.textContent = formatDate(new Date(), 'full');
}

function renderStats(data) {
  const tasks = data.tasks || [];
  const allSubjects = data.subjects || [];
  const activeSemester = data.user?.semester || data.settings?.semesterActive || (allSubjects.length > 0 ? Math.max(...allSubjects.map(s => s.semester || 1)) : 1);
  const subjects = allSubjects.filter(s => (s.semester || 1) === activeSemester);
  const today = new Date(); today.setHours(23, 59, 59, 999);
  const dueToday = tasks.filter(t => t.status !== 'completed' && new Date(t.deadline) <= today);
  const totalSessions = subjects.reduce((a, s) => a + (s.totalSessions || 0), 0);
  const totalPresent = subjects.reduce((a, s) => a + (s.present || 0), 0);
  const attendancePct = totalSessions ? Math.round((totalPresent / totalSessions) * 100) : 0;
  const totalSks = subjects.reduce((a, s) => a + (s.sks || 0), 0);

  setText('tasksDueToday', dueToday.length);
  setText('attendancePct', attendancePct + '%');
  setText('totalSubjects', subjects.length);
  setText('totalSksDisplay', totalSks + ' SKS');
  setText('tasksPending', tasks.filter(t => t.status !== 'completed').length);
  setText('tasksCompleted', tasks.filter(t => t.status === 'completed').length);
  setText('currentSemester', 'Semester ' + activeSemester);
}

function renderMomentum(data) {
  const el = document.getElementById('momentumText');
  if (!el) return;
  const tasks = data.tasks || [];
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  setText('momentumPct', pct + '%');
  const fillEl = document.getElementById('momentumFill');
  if (fillEl) fillEl.style.width = pct + '%';
  el.textContent = total ? `Kamu sudah menyelesaikan ${pct}% target tugas. Lanjutkan!` : 'Belum ada tugas. Tambahkan tugas pertamamu!';
}

function renderWeeklySummary(data) {
  const el = document.getElementById('weeklySummary');
  if (!el) return;
  const tasks = data.tasks || [];
  const subjects = data.subjects || [];
  const schedules = data.schedules || [];
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  const weekDeadlines = tasks.filter(t => {
    if (t.status === 'completed') return false;
    const d = new Date(t.deadline);
    return d >= now && d <= endOfWeek;
  }).length;

  const today = getDayName(new Date(), false);
  const todayClasses = schedules.filter(s => s.day === today).length;
  const notStarted = tasks.filter(t => t.status === 'pending' && new Date(t.deadline) <= endOfWeek).length;
  const overdue = tasks.filter(t => t.status !== 'completed' && new Date(t.deadline) < now).length;

  const parts = [];
  if (weekDeadlines > 0) parts.push(`${weekDeadlines} tugas deadline`);
  if (todayClasses > 0) parts.push(`${todayClasses} kelas hari ini`);
  if (notStarted > 0) parts.push(`${notStarted} tugas belum mulai`);
  if (overdue > 0) parts.push(`${overdue} tugas lewat`);
  if (subjects.length > 0) parts.push(`${subjects.length} mata kuliah aktif`);

  el.textContent = parts.length > 0
    ? 'Minggu ini: ' + parts.join(', ') + '.'
    : 'Belum ada aktivitas minggu ini. Yuk tambah mata kuliah!';
}

function renderUpcomingTasks(data) {
  const el = document.getElementById('upcomingTasks');
  if (!el) return;
  const tasks = data.tasks || [];
  const subjects = data.subjects || [];
  const pending = tasks.filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4);
  if (pending.length === 0) {
    el.innerHTML = '<div class="empty-state">Tidak ada tugas mendatang. Mantap!</div>';
    return;
  }
  el.innerHTML = pending.map(t => {
    const subj = subjects.find(s => s.id === t.subjectId);
    const color = subj ? subj.color : 'var(--primary)';
    return `<div class="task-card" style="border-left-color:${color}" data-id="${t.id}">
      <div class="task-checkbox" data-task-id="${t.id}" style="cursor:pointer"></div>
      <div class="task-body" style="cursor:pointer" onclick="window.location.href='tasks.html'">
        <div class="task-top">
          <span class="task-subject" style="color:${color}">${subj ? escapeHtml(subj.name) : 'Umum'}</span>
        </div>
        <div class="task-title">${escapeHtml(t.title)}</div>
        <div class="task-meta">
          <span class="task-due">${formatDate(t.deadline, 'short')}</span>
          ${t.priority ? `<span class="priority-badge priority-${t.priority}">${t.priority}</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
  el.querySelectorAll('.task-checkbox').forEach(cb => {
    cb.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = cb.dataset.taskId;
      const task = pending.find(t => t.id === taskId);
      if (!task) return;
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      db.update('tasks', { id: taskId }, { status: 'completed', completedAt: task.completedAt });
      persist();
      showToast('Tugas selesai!');
      renderUpcomingTasks(data);
    });
  });
}

function renderPinnedNotes(data) {
  const section = document.getElementById('dashboardNotesSection');
  const list = document.getElementById('dashboardNotesList');
  if (!section || !list) return;
  const notes = (data.notes || []).filter(n => n.pinned);
  if (notes.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = notes.slice(0, 3).map(n => `
    <div class="note-mini-card" style="padding:0.6rem 0.75rem;background:var(--surface-container-lowest);border:1px solid var(--outline-variant);border-radius:var(--radius-md);margin-bottom:0.4rem;cursor:pointer" onclick="window.location.href='notes.html'">
      <div style="font-weight:600;font-size:14px;margin-bottom:0.2rem">${escapeHtml(n.title)}</div>
      <div style="font-size:12px;color:var(--on-surface-variant);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml((n.content || '').slice(0, 100))}</div>
    </div>
  `).join('');
}

function renderWeeklyDeadline(data) {
  const el = document.getElementById('weeklyDeadlineList');
  const countEl = document.getElementById('weeklyDeadlineCount');
  if (!el) return;
  const tasks = data.tasks || [];
  const subjects = data.subjects || [];
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);
  const thisWeek = tasks.filter(t => {
    if (t.status === 'completed') return false;
    const d = new Date(t.deadline);
    return d >= now && d <= endOfWeek;
  }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  if (countEl) countEl.textContent = thisWeek.length;
  if (thisWeek.length === 0) {
    el.innerHTML = '<div class="empty-state" style="padding:0.75rem 0">Tidak ada deadline minggu ini. Santai dulu!</div>';
    return;
  }
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  el.innerHTML = thisWeek.map(t => {
    const subj = subjects.find(s => s.id === t.subjectId);
    const d = new Date(t.deadline);
    const dayLabel = dayNames[d.getDay()];
    const dateStr = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    return `
      <div class="deadline-item" style="display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0.75rem;background:var(--surface-container-lowest);border:1px solid var(--outline-variant);border-radius:var(--radius-md);margin-bottom:0.4rem">
        <div style="display:flex;align-items:center;gap:0.6rem;flex:1;min-width:0">
          <span style="font-size:12px;font-weight:700;color:var(--primary);white-space:nowrap">${dayLabel}</span>
          <div style="min-width:0">
            <div style="font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(t.title)}</div>
            ${subj ? `<div style="font-size:12px;color:var(--on-surface-variant)">${escapeHtml(subj.name)}</div>` : ''}
          </div>
        </div>
        <span style="font-size:12px;color:var(--on-surface-variant);white-space:nowrap">${dateStr}</span>
      </div>`;
  }).join('');
}

async function initCharts(data) {
  await chartManager.loadChart();
  const tasks = data.tasks || [];
  const subjects = data.subjects || [];
  const pending = tasks.filter(t => t.status !== 'completed').length;
  const completed = tasks.filter(t => t.status === 'completed').length;

  if (document.getElementById('taskChart')) {
    await chartManager.createTaskChart('taskChart', pending, completed, tasks.length);
  }

  const totalSessions = subjects.reduce((a, s) => a + (s.totalSessions || 0), 0);
  const totalPresent = subjects.reduce((a, s) => a + (s.present || 0), 0);
  if (document.getElementById('attendanceChart')) {
    await chartManager.createAttendanceChart('attendanceChart', totalPresent, totalSessions - totalPresent);
  }

  if (document.getElementById('productivityChart')) {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const weekData = days.map((_, i) => {
      const dayIdx = (i + 1) % 7;
      return tasks.filter(t => {
        if (t.status !== 'completed') return false;
        const d = new Date(t.completedAt || t.updatedAt);
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return d >= weekStart && d.getDay() === dayIdx;
      }).length;
    });
    await chartManager.createWeeklyActivityChart('productivityChart', days, weekData);
  }
}

function setupQuickAdd(data) {
  const fab = document.getElementById('fabBtn');
  const menu = document.getElementById('fabMenu');
  if (fab && menu) {
    fab.addEventListener('click', () => {
      menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    });
    document.addEventListener('click', (e) => {
      if (!fab.contains(e.target) && !menu.contains(e.target)) menu.style.display = 'none';
    });
    menu.querySelectorAll('.fab-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        menu.style.display = 'none';
        const action = item.dataset.action;
        if (action === 'task') openQuickTask(data);
        else if (action === 'subject') openQuickSubject(data);
        else if (action === 'note') openQuickNote(data);
      });
    });
  }
}

function openQuickTask(data) {
  const backdrop = document.getElementById('quickAddBackdrop');
  if (!backdrop) return;
  backdrop.classList.add('open');
  const select = document.getElementById('qaSubject');
  if (select) select.innerHTML = (data.subjects || []).map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
  const saveBtn = document.getElementById('qaSaveBtn');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const title = document.getElementById('qaTitle')?.value?.trim();
      const due = document.getElementById('qaDue')?.value;
      const subjectId = document.getElementById('qaSubject')?.value;
      if (!title || !due) { showToast('Lengkapi judul dan tenggat'); return; }
      if (!subjectId) { showToast('Pilih mata kuliah'); return; }
      data.tasks = data.tasks || [];
      const newTask = {
        id: generateId(), subjectId, title, description: '',
        deadline: new Date(due).toISOString(), deadlineTime: due.split('T')[1] || '23:59',
        priority: 'medium', status: 'pending', category: '', progress: 0,
        checklist: [], attachments: [], references: [], notes: '', reminder: false,
        createdAt: new Date().toISOString(), completedAt: null,
      };
      data.tasks.push(newTask);
      await db.insert('tasks', newTask);
      pushActivity('task_add', 'Menambah tugas', title);
      backdrop.classList.remove('open');
      showToast('Tugas ditambahkan');
      renderUpcomingTasks(data);
    };
  }
}

function openQuickSubject(data) {
  const backdrop = document.getElementById('qaSubjectBackdrop');
  if (!backdrop) return;
  document.getElementById('qaSubjectName').value = '';
  backdrop.classList.add('open');
  const saveBtn = document.getElementById('qaSubjectSaveBtn');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const name = document.getElementById('qaSubjectName')?.value?.trim();
      const sks = Number(document.getElementById('qaSubjectSks')?.value || 3);
      const semester = Number(document.getElementById('qaSubjectSemester')?.value || 1);
      if (!name) { showToast('Nama MK wajib diisi'); return; }
      const newSubject = {
        id: generateId(), name, code: '', lecturer: '', sks, semester, color: '#4f46e5',
        lecturerEmail: '', lecturerPhone: '', room: '', linkLms: '', linkMeet: '', linkWa: '', notes: '',
        day: '', startTime: '', endTime: '', category: '', icon: '', active: true,
        totalSessions: 0, present: 0, currentMeeting: 0, totalMeetings: 16,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      data.subjects.push(newSubject);
      await db.insert('subjects', newSubject);
      pushActivity('subject_add', 'Menambah MK', name);
      backdrop.classList.remove('open');
      showToast('MK ditambahkan');
      renderStats(data);
    };
  }
}

function openQuickNote(data) {
  const backdrop = document.getElementById('qaNoteBackdrop');
  if (!backdrop) return;
  document.getElementById('qaNoteTitle').value = '';
  document.getElementById('qaNoteContent').value = '';
  backdrop.classList.add('open');
  const saveBtn = document.getElementById('qaNoteSaveBtn');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const title = document.getElementById('qaNoteTitle')?.value?.trim();
      const content = document.getElementById('qaNoteContent')?.value?.trim() || '';
      if (!title) { showToast('Judul wajib diisi'); return; }
      const now = new Date().toISOString();
      data.notes = data.notes || [];
      const newNote = { id: generateId(), subjectId: '', title, content, checklist: [], pinned: false, tags: [], createdAt: now, updatedAt: now };
      data.notes.push(newNote);
      await db.insert('notes', newNote);
      pushActivity('note_add', 'Menambah catatan', title);
      backdrop.classList.remove('open');
      showToast('Catatan ditambahkan');
    };
  }
}

function setupSemesterSwitcher(data) {
  const semesterSelect = document.getElementById('semesterSelect');
  const saveBtn = document.getElementById('semesterSaveBtn');
  if (!semesterSelect || !saveBtn) return;

  const current = data.user?.semester || data.settings?.semesterActive || 1;
  semesterSelect.value = current;

  saveBtn.addEventListener('click', async () => {
    const semester = parseInt(semesterSelect.value);
    const prev = data.user?.semester || data.settings?.semesterActive || 1;
    if (semester !== prev) {
      const { showDialog } = await import('../components/dialog.js');
      const archive = await showDialog({ title: 'Arsip Semester', message: `Arsipkan data Semester ${prev} sebelum beralih?`, confirmText: 'Arsipkan', cancelText: 'Langsung Ganti' });
      if (archive) archiveSemester(prev);
    }
    data.user.semester = semester;
    data.settings = data.settings || {};
    data.settings.semesterActive = semester;
    persist();
    document.getElementById('semesterModal').classList.remove('open');
    showToast('Semester diubah ke ' + semester);
    setTimeout(() => location.reload(), 300);
  });

  const copyBtn = document.getElementById('copySemesterBtn');
  const copySelect = document.getElementById('copySemesterSelect');
  if (copyBtn && copySelect) {
    copyBtn.addEventListener('click', async () => {
      const targetSemester = parseInt(copySelect.value);
      if (targetSemester === current) { showToast('Pilih semester yang berbeda'); return; }
      const { showDialog } = await import('../components/dialog.js');
      const confirmed = await showDialog({
        title: 'Copy Jadwal',
        message: `Salin semua mata kuliah dan jadwal ke Semester ${targetSemester}?`,
        confirmText: 'Copy',
      });
      if (!confirmed) return;
      const subjects = data.subjects || [];
      const schedules = data.schedules || [];
      const now = new Date().toISOString();
      subjects.forEach(s => {
        if (s.semester === current) {
          const newId = generateId();
          data.subjects.push({
            ...s, id: newId, semester: targetSemester,
            totalSessions: 0, present: 0, currentMeeting: 0,
            createdAt: now, updatedAt: now,
          });
          schedules.forEach(sc => {
            if (sc.subjectId === s.id) {
              data.schedules.push({
                ...sc, id: generateId(), subjectId: newId,
              });
            }
          });
        }
      });
      persist();
      showToast(`Jadwal dicopy ke Semester ${targetSemester}`);
      setTimeout(() => location.reload(), 300);
    });
  }
}

function setupQuickAttend(data) {
  function renderQuickAttend() {
    const list = document.getElementById('quickAttendList');
    if (!list) return;
    const subjects = data.subjects || [];
    if (subjects.length === 0) {
      list.innerHTML = '<div class="empty-state">Belum ada mata kuliah.</div>';
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const records = data.attendanceRecords || [];
    list.innerHTML = subjects.map(s => {
      const alreadyAttended = records.some(r => r.subjectId === s.id && r.date.startsWith(today));
      return `
        <div class="card" style="margin-bottom:0.5rem;padding:0.75rem;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-weight:600;font-size:14px">${escapeHtml(s.name)}</div>
            <div style="font-size:12px;color:var(--on-surface-variant)">${escapeHtml(s.code)}</div>
          </div>
          <div style="display:flex;gap:0.4rem">
            ${alreadyAttended
              ? '<span style="font-size:13px;color:var(--secondary);font-weight:600">✓ Hadir</span>'
              : `<button class="btn btn-success-outline btn-sm qa-hadir" data-id="${s.id}" style="font-size:12px">✓ Hadir</button>
                 <button class="btn btn-error-outline btn-sm qa-alpha" data-id="${s.id}" style="font-size:12px">✕ Alpha</button>`
            }
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.qa-hadir').forEach(btn => {
      btn.addEventListener('click', () => quickAttend(btn.dataset.id, 'hadir'));
    });
    list.querySelectorAll('.qa-alpha').forEach(btn => {
      btn.addEventListener('click', () => quickAttend(btn.dataset.id, 'alpha'));
    });
  }

  async function quickAttend(subjectId, status) {
    data.attendanceRecords = data.attendanceRecords || [];
    const meeting = data.attendanceRecords.filter(r => r.subjectId === subjectId).length + 1;
    const record = {
      id: generateId(), subjectId, meeting,
      date: new Date().toISOString(), status,
      notes: '', createdAt: new Date().toISOString(),
    };
    data.attendanceRecords.push(record);
    await db.insert('attendance', record);
    showToast(status === 'hadir' ? 'Ditandai Hadir' : 'Ditandai Alpha');
    renderQuickAttend();
  }

  document.getElementById('attendanceStatCard')?.addEventListener('click', () => {
    renderQuickAttend();
    document.getElementById('quickAttendBackdrop')?.classList.add('open');
  });
}

function renderEnhancedStats(data) {
  const el = document.getElementById('enhancedStats');
  if (!el) return;
  const subjects = data.subjects || [];
  const tasks = data.tasks || [];
  const attendance = data.attendanceRecords || [];

  const subjectTaskCount = subjects.map(s => ({
    name: s.name,
    count: tasks.filter(t => t.subjectId === s.id).length,
    color: s.color,
  })).sort((a, b) => b.count - a.count);

  const subjectAttendance = subjects.map(s => {
    const recs = attendance.filter(a => a.subjectId === s.id);
    const present = recs.filter(a => a.status === 'hadir').length;
    return { name: s.name, pct: recs.length ? Math.round((present / recs.length) * 100) : 0, total: recs.length, color: s.color };
  }).sort((a, b) => b.pct - a.pct);

  const totalSks = subjects.reduce((a, s) => a + (s.sks || 0), 0);
  let html = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.5rem">
    <div style="background:var(--surface-container);border-radius:var(--radius-md);padding:0.6rem 0.75rem;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--primary)">${totalSks}</div><div style="font-size:12px;color:var(--on-surface-variant)">Total SKS</div></div>
    <div style="background:var(--surface-container);border-radius:var(--radius-md);padding:0.6rem 0.75rem;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--tertiary)">${subjects.length}</div><div style="font-size:12px;color:var(--on-surface-variant)">MK Aktif</div></div>
  </div>`;

  if (subjectTaskCount.length > 0) {
    const top = subjectTaskCount[0];
    html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0.75rem;background:var(--surface-container);border-radius:var(--radius-md);margin-bottom:0.4rem">
      <span style="font-size:13px">📊 MK dengan tugas terbanyak</span>
      <span style="font-weight:600;font-size:14px">${escapeHtml(top.name)} (${top.count})</span>
    </div>`;
  }

  if (subjectAttendance.length > 0) {
    const best = subjectAttendance[0];
    const worst = subjectAttendance[subjectAttendance.length - 1];
    html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0.75rem;background:var(--surface-container);border-radius:var(--radius-md);margin-bottom:0.4rem">
      <span style="font-size:13px">✅ Kehadiran terbaik</span>
      <span style="font-weight:600;font-size:14px">${escapeHtml(best.name)} (${best.pct}%)</span>
    </div>`;
    if (worst.total > 0 && worst.pct < 100) {
      html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0.75rem;background:var(--surface-container);border-radius:var(--radius-md);margin-bottom:0.4rem">
        <span style="font-size:13px">⚠️ Kehadiran perlu diperbaiki</span>
        <span style="font-weight:600;font-size:14px">${escapeHtml(worst.name)} (${worst.pct}%)</span>
      </div>`;
    }
  }
  el.innerHTML = html;
}

function renderActivityFeed(data) {
  const el = document.getElementById('activityFeed');
  if (!el) return;
  const activities = getRecentActivities(8);
  if (activities.length === 0) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  const icons = { subject_add: '📚', subject_update: '✏️', subject_delete: '🗑️', task_add: '📝', task_update: '📋', task_delete: '🗑️', note_add: '📄', note_update: '📃', note_delete: '🗑️', attendance: '✅' };
  el.innerHTML = activities.map(a => `
    <div style="display:flex;align-items:center;gap:0.6rem;padding:0.45rem 0;border-bottom:1px solid var(--outline-variant);font-size:13px">
      <span style="font-size:16px">${icons[a.type] || '📌'}</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.label}</div>
        ${a.details ? `<div style="font-size:11px;color:var(--on-surface-variant)">${a.details}</div>` : ''}
      </div>
      <span style="font-size:11px;color:var(--on-surface-variant);white-space:nowrap">${timeAgo(a.timestamp)}</span>
    </div>
  `).join('');
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j`;
  const days = Math.floor(hrs / 24);
  return `${days}h`;
}

function renderNextClass(data) {
  const el = document.getElementById('nextClassInfo');
  if (!el) return;
  const schedules = data.schedules || [];
  const subjects = data.subjects || [];
  const now = new Date();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const today = dayNames[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const todayClasses = schedules.filter(s => s.day === today)
    .map(s => {
      const subj = subjects.find(x => x.id === s.subjectId);
      const [h, m] = (s.startTime || '0:0').split(':').map(Number);
      return { ...s, subjectName: subj?.name || 'MK', startMin: h * 60 + m, color: subj?.color || 'var(--primary)' };
    })
    .filter(s => !isNaN(s.startMin))
    .sort((a, b) => a.startMin - b.startMin);
  const next = todayClasses.find(s => s.startMin > currentTime);
  if (!next) {
    if (todayClasses.length > 0) { el.innerHTML = `<span style="font-size:13px;color:var(--on-surface-variant)">✅ Semua kelas hari ini selesai</span>`; }
    else { el.innerHTML = `<span style="font-size:13px;color:var(--on-surface-variant)">📅 Tidak ada kelas hari ini</span>`; }
    return;
  }
  const diffMin = next.startMin - currentTime;
  const hrs = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  const countdown = hrs > 0 ? `${hrs}j ${mins}m` : `${mins}m`;
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.6rem">
      <span style="font-size:24px">⏰</span>
      <div>
        <div style="font-weight:600;font-size:14px">${escapeHtml(next.subjectName)}</div>
        <div style="font-size:12px;color:var(--on-surface-variant)">${next.startTime} · ${next.room || '-'} · Mulai dalam ${countdown}</div>
      </div>
    </div>`;
}

function setupClickableStats() {
  const links = {
    tasksDueToday: 'tasks.html',
    totalSubjects: 'subjects.html',
    tasksPending: 'tasks.html',
    tasksCompleted: 'tasks.html',
    totalSksDisplay: 'subjects.html',
  };
  Object.entries(links).forEach(([id, url]) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => { window.location.href = url; });
    }
  });
}

function showOnboarding(data) {
  if (localStorage.getItem('eduflow_onboarded')) return;
  const hasSubjects = (data.subjects || []).length > 0;
  const hasTasks = (data.tasks || []).length > 0;
  if (hasSubjects || hasTasks) { localStorage.setItem('eduflow_onboarded', '1'); return; }

  const backdrop = document.getElementById('onboardingBackdrop');
  if (!backdrop) return;
  backdrop.classList.add('open');

  let step = 0;
  const steps = [
    { title: 'Selamat Datang di EduFlow!', desc: 'Aplikasi pengelola mata kuliah, tugas, presensi, dan catatan untuk mahasiswa.', btn: 'Mulai' },
    { title: 'Tambahkan Mata Kuliah', desc: 'Mulai dengan menambahkan mata kuliah yang kamu ambil semester ini.', btn: 'Ke Mata Kuliah', link: 'subjects.html' },
    { title: 'Catat Jadwal Kuliah', desc: 'Atur jadwal perkuliahan setiap mata kuliah dengan hari, jam, dan ruang.', btn: 'Ke Mata Kuliah', link: 'subjects.html' },
    { title: 'Kelola Tugas & Presensi', desc: 'Pantau tenggat tugas dan catat kehadiran setiap pertemuan.', btn: 'Mulai Belajar!' },
  ];

  function dismiss() {
    backdrop.classList.remove('open');
    localStorage.setItem('eduflow_onboarded', '1');
  }

  function renderStep() {
    const s = steps[step];
    backdrop.querySelector('.onboarding-title').textContent = s.title;
    backdrop.querySelector('.onboarding-desc').textContent = s.desc;
    const btn = backdrop.querySelector('.onboarding-btn');
    btn.textContent = s.btn;
    btn.dataset.link = s.link || '';
    backdrop.querySelector('.onboarding-step').textContent = `${step + 1}/${steps.length}`;
  }

  backdrop.querySelector('.onboarding-btn').addEventListener('click', () => {
    const link = backdrop.querySelector('.onboarding-btn').dataset.link;
    if (link) { dismiss(); window.location.href = link; return; }
    step++;
    if (step >= steps.length) { dismiss(); return; }
    renderStep();
  });

  backdrop.querySelector('.onboarding-skip')?.addEventListener('click', dismiss);

  renderStep();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
