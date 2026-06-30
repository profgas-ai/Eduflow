import { escapeHtml, getDayName, generateId } from '../utils/helper.js';
import { db } from '../services/database.js';
import { showToast } from '../components/toast.js';

export function renderSchedule(data) {
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
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayDate = now.toISOString().split('T')[0];
  const records = data.attendanceRecords || [];

  function toMin(t) { if (!t) return 0; const [h,m] = t.split(':').map(Number); return h*60+(m||0); }

  el.innerHTML = todaySchedule.slice(0, 4).map(s => {
    const subj = subjects.find(x => x.id === s.subjectId);
    const isPast = s.endTime && toMin(s.endTime) <= currentMinutes;
    const alreadyAttended = subj ? records.some(r => r.subjectId === subj.id && r.date.startsWith(todayDate)) : false;
    return `<div class="class-card ${isPast ? 'class-past' : ''}" data-subject-id="${subj ? subj.id : ''}">
      <div class="accent-bar" style="background:${subj ? subj.color : 'var(--primary)'}"></div>
      <div class="class-info">
        <div class="name">${escapeHtml(subj ? subj.name : 'Unknown')}</div>
        <div class="meta">${s.room} • ${s.lecturer}</div>
      </div>
      <div style="display:flex;align-items:center;gap:0.4rem">
        ${subj && !isPast && !alreadyAttended
          ? `<button class="btn btn-success-outline btn-sm qa-hadir-sch" data-id="${subj.id}" style="font-size:11px;padding:0.2rem 0.5rem">✓ Hadir</button>
             <button class="btn btn-error-outline btn-sm qa-alpha-sch" data-id="${subj.id}" style="font-size:11px;padding:0.2rem 0.5rem">✕</button>`
          : alreadyAttended ? `<span style="font-size:12px;color:var(--secondary);font-weight:600">✓</span>`
          : `<div class="time-pill">${s.startTime}${isPast ? ' ✓' : ''}</div>`
        }
      </div>
    </div>`;
  }).join('');

  el.querySelectorAll('.qa-hadir-sch').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await quickAttendSchedule(data, btn.dataset.id, 'hadir');
      renderSchedule(data);
    });
  });
  el.querySelectorAll('.qa-alpha-sch').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await quickAttendSchedule(data, btn.dataset.id, 'alpha');
      renderSchedule(data);
    });
  });
}

async function quickAttendSchedule(data, subjectId, status) {
  data.attendanceRecords = data.attendanceRecords || [];
  const meeting = data.attendanceRecords.filter(r => r.subjectId === subjectId).length + 1;
  const record = {
    id: generateId(), subjectId, meeting,
    date: new Date().toISOString(), status,
    notes: '', createdAt: new Date().toISOString(),
  };
  data.attendanceRecords.push(record);
  await db.insert('attendance', record);
  showToast(status === 'hadir' ? '✓ Hadir dicatat' : '✕ Alpha dicatat');
}

export function setupTimetable(data) {
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
  function toMinutes(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hours = [];
  for (let h = 7; h <= 20; h++) hours.push(String(h).padStart(2, '0') + ':00');

  let html = '<table style="width:100%;border-collapse:collapse;font-size:12px">';
  html += '<thead><tr><th style="padding:6px;text-align:left;color:var(--on-surface-variant);width:50px">Jam</th>';
  days.forEach(d => { html += `<th style="padding:6px;text-align:center;color:var(--on-surface-variant);font-weight:600">${d}</th>`; });
  html += '</tr></thead><tbody>';

  hours.forEach(hour => {
    const hourMin = toMinutes(hour);
    html += `<tr><td style="padding:4px 6px;color:var(--on-surface-variant);border-bottom:1px solid var(--outline-variant);font-size:11px">${hour}</td>`;
    days.forEach(day => {
      const classes = schedules.filter(s => s.day === day && toMinutes(s.startTime) <= hourMin && toMinutes(s.endTime) > hourMin);
      if (classes.length > 0) {
        const s = classes[0];
        const subj = subjects.find(x => x.id === s.subjectId);
        const color = subj ? subj.color : 'var(--primary)';
        const isStart = toMinutes(s.startTime) === hourMin;
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
