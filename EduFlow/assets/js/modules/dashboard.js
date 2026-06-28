import { getData, persist } from '../services/storage.js';
import { escapeHtml, getGreeting, getDayName, generateId } from '../utils/helper.js';
import { formatDate } from '../utils/formatter.js';
import { chartManager } from '../components/chart.js';
import { createTaskCard, createScheduleCard } from '../components/card.js';
import { showToast } from '../components/toast.js';

export function initDashboard() {
  const data = getData();

  renderGreeting(data.user);
  renderClock();
  renderStats(data);
  renderMomentum(data);
  renderSchedule(data);
  renderUpcomingTasks(data);
  initCharts(data);
  setupQuickAdd(data);
  setupSemesterSwitcher(data);
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
  const subjects = data.subjects || [];
  const activeSemester = data.user?.semester || data.settings?.semesterActive || 1;
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

function renderSchedule(data) {
  const el = document.getElementById('classList');
  if (!el) return;
  const schedules = data.schedules || [];
  const subjects = data.subjects || [];
  const today = getDayName(new Date(), false);
  const todaySchedule = schedules.filter(s => s.day === today);
  if (todaySchedule.length === 0) {
    el.innerHTML = '<div class="empty-state">Tidak ada jadwal hari ini. Nikmati harimu!</div>';
    return;
  }
  el.innerHTML = todaySchedule.slice(0, 4).map(s => {
    const subj = subjects.find(x => x.id === s.subjectId);
    return createScheduleCard(s, subj);
  }).join('');
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
  el.innerHTML = pending.map(t => createTaskCard(t, subjects)).join('');
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
    const weekData = days.map(() => Math.floor(Math.random() * 5));
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
      data.tasks.push({
        id: generateId(), subjectId, title, description: '',
        deadline: new Date(due).toISOString(), deadlineTime: due.split('T')[1] || '23:59',
        priority: 'medium', status: 'pending', category: '', progress: 0,
        checklist: [], attachments: [], references: [], notes: '', reminder: false,
        createdAt: new Date().toISOString(), completedAt: null,
      });
      persist();
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
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
