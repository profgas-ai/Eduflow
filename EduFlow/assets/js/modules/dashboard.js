import { getData } from '../services/storage.js';
import { db } from '../services/database.js';
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
  setupTimetable(data);
  renderUpcomingTasks(data);
  initCharts(data);
  setupQuickAdd(data);
  setupSemesterSwitcher(data);
  renderWeeklyDeadline(data);
  setupClickableStats();
  setupQuickAttend(data);
  setupGpaCalculator(data);
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

function setupTimetable(data) {
  const btn = document.getElementById('showTimetableBtn');
  const container = document.getElementById('timetableContainer');
  if (!btn || !container) return;
  let visible = false;
  btn.addEventListener('click', () => {
    visible = !visible;
    container.style.display = visible ? 'block' : 'none';
    btn.textContent = visible ? 'Jadwal Hari Ini' : 'Tampilan Jadwal';
    if (visible) renderTimetable(data);
  });
}

function renderTimetable(data) {
  const grid = document.getElementById('timetableGrid');
  if (!grid) return;
  const schedules = data.schedules || [];
  const subjects = data.subjects || [];
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hours = [];
  for (let h = 7; h <= 20; h++) hours.push(String(h).padStart(2, '0') + ':00');

  let html = '<table style="width:100%;border-collapse:collapse;font-size:12px">';
  html += '<thead><tr><th style="padding:6px;text-align:left;color:var(--on-surface-variant);width:50px">Jam</th>';
  days.forEach(d => { html += `<th style="padding:6px;text-align:center;color:var(--on-surface-variant);font-weight:600">${d}</th>`; });
  html += '</tr></thead><tbody>';

  hours.forEach(hour => {
    html += `<tr><td style="padding:4px 6px;color:var(--on-surface-variant);border-bottom:1px solid var(--outline-variant);font-size:11px">${hour}</td>`;
    days.forEach(day => {
      const classes = schedules.filter(s => s.day === day && s.startTime <= hour && s.endTime > hour);
      if (classes.length > 0) {
        const s = classes[0];
        const subj = subjects.find(x => x.id === s.subjectId);
        const color = subj ? subj.color : 'var(--primary)';
        const isStart = s.startTime === hour;
        html += `<td style="padding:0;border-bottom:1px solid var(--outline-variant);vertical-align:middle;text-align:center;background:${isStart ? color + '18' : 'transparent'}">
          ${isStart ? `<div style="padding:2px 4px;font-weight:600;color:${color};font-size:11px">${subj ? subj.name : ''}</div><div style="font-size:10px;color:var(--on-surface-variant)">${s.room || ''}</div>` : ''}
        </td>`;
      } else {
        html += `<td style="padding:0;border-bottom:1px solid var(--outline-variant)"></td>`;
      }
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  grid.innerHTML = html;
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

function setupGpaCalculator(data) {
  const gradeValues = { A: 4.0, 'A-': 3.7, 'B+': 3.3, B: 3.0, 'B-': 2.7, 'C+': 2.3, C: 2.0, D: 1.0, E: 0 };
  let rows = [];

  function calcGpa() {
    let totalSks = 0, totalNilai = 0;
    rows.forEach(r => {
      const sks = parseInt(r.sks) || 0;
      const grade = gradeValues[r.grade] || 0;
      totalSks += sks;
      totalNilai += sks * grade;
    });
    const gpa = totalSks > 0 ? (totalNilai / totalSks) : 0;
    document.getElementById('ipkResult').textContent = gpa.toFixed(2);
  }

  function renderIpkRows() {
    const list = document.getElementById('ipkSubjectList');
    if (!list) return;
    if (rows.length === 0) {
      (data.subjects || []).forEach(s => {
        rows.push({ name: s.name, sks: s.sks, grade: 'B+' });
      });
    }
    list.innerHTML = rows.map((r, i) => `
      <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;align-items:center">
        <input type="text" value="${escapeHtml(r.name)}" data-idx="${i}" class="ipk-name" placeholder="Nama MK" style="flex:2;padding:0.5rem;border:1px solid var(--outline-variant);border-radius:var(--radius-sm);background:var(--surface-container);font-size:13px">
        <input type="number" value="${r.sks}" data-idx="${i}" class="ipk-sks" min="1" max="6" style="width:50px;padding:0.5rem;border:1px solid var(--outline-variant);border-radius:var(--radius-sm);background:var(--surface-container);font-size:13px">
        <select data-idx="${i}" class="ipk-grade" style="padding:0.5rem;border:1px solid var(--outline-variant);border-radius:var(--radius-sm);background:var(--surface-container);font-size:13px">
          ${Object.keys(gradeValues).map(g => `<option value="${g}" ${g === r.grade ? 'selected' : ''}>${g}</option>`).join('')}
        </select>
        <button class="icon-action ipk-delete" data-idx="${i}" style="font-size:16px">×</button>
      </div>
    `).join('');

    list.querySelectorAll('.ipk-name, .ipk-sks, .ipk-grade').forEach(el => {
      el.addEventListener('change', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        if (e.currentTarget.classList.contains('ipk-name')) rows[idx].name = e.currentTarget.value;
        if (e.currentTarget.classList.contains('ipk-sks')) rows[idx].sks = parseInt(e.currentTarget.value) || 0;
        if (e.currentTarget.classList.contains('ipk-grade')) rows[idx].grade = e.currentTarget.value;
        calcGpa();
      });
    });
    list.querySelectorAll('.ipk-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        rows.splice(idx, 1);
        renderIpkRows();
        calcGpa();
      });
    });
    calcGpa();
  }

  document.getElementById('ipkFabBtn')?.addEventListener('click', () => {
    renderIpkRows();
    document.getElementById('ipkModal').classList.add('open');
  });
  document.getElementById('ipkAddRow')?.addEventListener('click', () => {
    rows.push({ name: '', sks: 3, grade: 'B+' });
    renderIpkRows();
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

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
