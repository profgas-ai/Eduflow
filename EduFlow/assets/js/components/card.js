import { escapeHtml } from '../utils/helper.js';
import { formatDate, formatTimeLeft } from '../utils/formatter.js';

export function createSubjectCard(subject) {
  const meetingPct = subject.totalSessions > 0
    ? Math.round((subject.currentMeeting / subject.totalMeetings) * 100)
    : 0;
  return `
    <div class="subject-card" data-id="${subject.id}">
      <div class="accent-bar" style="background:${subject.color}"></div>
      <div class="subject-card-inner">
        <span class="sks-pill">${subject.sks} SKS</span>
        <div class="sname">${escapeHtml(subject.name)}</div>
        <div class="scode">${escapeHtml(subject.code)} • ${escapeHtml(subject.lecturer)}</div>
        <div class="subject-progress">
          <div class="progress-track"><div class="progress-fill" style="width:${meetingPct}%;background:${subject.color}"></div></div>
          <span class="progress-label">${subject.currentMeeting}/${subject.totalMeetings} pertemuan</span>
        </div>
        <div class="subject-card-actions">
          <button class="btn btn-outline btn-sm btn-edit-subject" data-id="${subject.id}">Kelola</button>
          <button class="icon-action btn-delete-subject" data-id="${subject.id}" title="Hapus">🗑</button>
        </div>
      </div>
    </div>`;
}

export function createTaskCard(task, subjects) {
  const subj = subjects.find(s => s.id === task.subjectId);
  const color = subj ? subj.color : 'var(--primary)';
  const tl = formatTimeLeft(task.deadline);
  const completed = task.status === 'completed';
  return `
    <div class="task-card ${completed ? 'completed' : ''}" style="border-left-color:${color}" data-id="${task.id}">
      <div class="task-checkbox ${completed ? 'checked' : ''}" data-id="${task.id}">
        ${completed ? '✓' : ''}
      </div>
      <div class="task-body">
        <div class="task-top">
          <span class="task-subject" style="color:${color}">${subj ? escapeHtml(subj.name) : 'Umum'}</span>
          ${completed ? '' : `<span class="time-left ${tl.urgent ? 'urgent' : 'ok'}">${tl.text}</span>`}
        </div>
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="task-due">${formatDate(task.deadline, 'short')}</span>
          ${task.priority ? `<span class="priority-badge priority-${task.priority}">${task.priority}</span>` : ''}
        </div>
        <div class="task-actions">
          ${!completed ? `<button class="icon-action btn-edit-task" data-id="${task.id}" title="Edit">✎</button>` : ''}
          <button class="icon-action btn-delete-task" data-id="${task.id}" title="Hapus">🗑</button>
        </div>
      </div>
    </div>`;
}

export function createAttendanceCard(subject) {
  const pct = subject.totalSessions > 0 ? Math.round((subject.present / subject.totalSessions) * 100) : 0;
  const color = pct >= 85 ? 'var(--secondary)' : pct >= 75 ? 'var(--primary)' : 'var(--error)';
  return `
    <div class="card attendance-subject" data-id="${subject.id}">
      <div class="top-row">
        <div>
          <div class="sname">${escapeHtml(subject.name)}</div>
          <div class="smeta">${escapeHtml(subject.lecturer)} • ${escapeHtml(subject.code)}</div>
        </div>
        <div>
          <div class="ratio">${subject.present}/${subject.totalSessions}</div>
          <div class="pct-right" style="color:${color}">${pct}%</div>
        </div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
      <div class="attendance-actions">
        <button class="btn btn-success-outline btn-sm btn-attend-present" data-id="${subject.id}" style="flex:1">✓ Hadir</button>
        <button class="btn btn-error-outline btn-sm btn-attend-absent" data-id="${subject.id}" style="flex:1">✕ Absen</button>
      </div>
    </div>`;
}

export function createScheduleCard(schedule, subject) {
  return `
    <div class="class-card">
      <div class="accent-bar" style="background:${subject ? subject.color : 'var(--primary)'}"></div>
      <div class="class-info">
        <div class="name">${escapeHtml(subject ? subject.name : 'Unknown')}</div>
        <div class="meta">${schedule.room} • ${schedule.lecturer}</div>
      </div>
      <div class="time-pill">${schedule.startTime}</div>
    </div>`;
}

export function createEmptyState(message, icon = '📋') {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${message}</p></div>`;
}
