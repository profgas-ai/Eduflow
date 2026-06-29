import { getData, persist } from '../services/storage.js';
import { db } from '../services/database.js';
import { escapeHtml, getGreeting, getDayName, generateId } from '../utils/helper.js';
import { formatDate } from '../utils/formatter.js';
import { chartManager } from '../components/chart.js';
import { showToast } from '../components/toast.js';
import { renderSchedule, setupTimetable } from './timetable.js';
import { setupGpaCalculator } from './gpa.js';

export function initDashboard() {
  const data = getData();

  renderGreeting(data.user);
  renderClock();
  renderStats(data);
  renderMomentum(data);
  renderWeeklySummary(data);
  renderSchedule(data);
  setupTimetable(data);
  renderUpcomingTasks(data);
  initCharts(data);
  setupQuickAdd(data);
  setupSemesterSwitcher(data);
  renderPinnedNotes(data);
  renderWeeklyDeadline(data);
  setupClickableStats();
  setupQuickAttend(data);
  setupGpaCalculator(data);
  showOnboarding(data);
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
  const activeSemester = data.user?.semester || data.settings?.semesterActive || 1;
  const subjects = (data.subjects || []).filter(s => (s.semester || 1) === activeSemester);
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
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  const weekDeadlines = tasks.filter(t => {
    if (t.status === 'completed') return false;
    const d = new Date(t.deadline);
    return d >= now && d <= endOfWeek;
  }).length;

  const today = getDayName(now, false);
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
    return `<div class="task-card" style="border-left-color:${color};cursor:pointer" onclick="window.location.href='tasks.html'" data-id="${t.id}">
      <div class="task-checkbox" style="pointer-events:none"></div>
      <div class="task-body">
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
  const now = new Date();
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
  if (fab) {
    fab.addEventListener('click', () => {
      const backdrop = document.getElementById('quickAddBackdrop');
      if (backdrop) {
        backdrop.classList.add('open');
        const select = document.getElementById('qaSubject');
        if (select) {
          select.innerHTML = (data.subjects || []).map(s =>
            `<option value="${s.id}">${escapeHtml(s.name)}</option>`
          ).join('');
        }
      }
    });
  }

  const saveBtn = document.getElementById('qaSaveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const title = document.getElementById('qaTitle')?.value?.trim();
      const due = document.getElementById('qaDue')?.value;
      const subjectId = document.getElementById('qaSubject')?.value;
      if (!title || !due) { showToast('Lengkapi judul dan tenggat'); return; }
      data.tasks = data.tasks || [];
      const newTask = {
        id: generateId(), subjectId, title, description: '',
        deadline: new Date(due).toISOString(), deadlineTime: due.split('T')[1] || '23:59',
        priority: 'medium', status: 'pending', category: '', progress: 0,
        checklist: [], attachments: [], references: [], notes: '', reminder: false,
        createdAt: new Date().toISOString(), completedAt: null,
      };
      data.tasks.push(newTask);
      db.insert('tasks', newTask);
      document.getElementById('quickAddBackdrop')?.classList.remove('open');
      showToast('Tugas ditambahkan');
      setTimeout(() => location.reload(), 500);
    });
  }
}

function setupSemesterSwitcher(data) {
  const semesterSelect = document.getElementById('semesterSelect');
  const saveBtn = document.getElementById('semesterSaveBtn');
  if (!semesterSelect || !saveBtn) return;

  const current = data.user?.semester || data.settings?.semesterActive || 1;
  semesterSelect.value = current;

  saveBtn.addEventListener('click', () => {
    const semester = parseInt(semesterSelect.value);
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

  function quickAttend(subjectId, status) {
    data.attendanceRecords = data.attendanceRecords || [];
    const meeting = data.attendanceRecords.filter(r => r.subjectId === subjectId).length + 1;
    const record = {
      id: generateId(), subjectId, meeting,
      date: new Date().toISOString(), status,
      notes: '', createdAt: new Date().toISOString(),
    };
    data.attendanceRecords.push(record);
    db.insert('attendance', record);
    showToast(status === 'hadir' ? 'Ditandai Hadir' : 'Ditandai Alpha');
    renderQuickAttend();
  }

  document.getElementById('attendanceStatCard')?.addEventListener('click', () => {
    renderQuickAttend();
    document.getElementById('quickAttendBackdrop')?.classList.add('open');
  });
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
  const hasSubjects = (data.subjects || []).length > 0;
  const hasTasks = (data.tasks || []).length > 0;
  if (hasSubjects || hasTasks) return;

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
    if (link) { window.location.href = link; return; }
    step++;
    if (step >= steps.length) {
      backdrop.classList.remove('open');
      return;
    }
    renderStep();
  });

  backdrop.querySelector('.onboarding-skip')?.addEventListener('click', () => {
    backdrop.classList.remove('open');
  });

  renderStep();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
