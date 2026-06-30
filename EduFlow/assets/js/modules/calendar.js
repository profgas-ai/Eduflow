import { getData } from '../services/storage.js';
import { getDayName, getMonthName, isSameDay, escapeHtml } from '../utils/helper.js';
import { formatDate, formatTime } from '../utils/formatter.js';

export function initCalendar() {
  const data = getData();
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();

  function getMonthEvents() {
    const events = data.events || [];
    const tasks = data.tasks || [];
    const schedules = data.schedules || [];
    const subjects = data.subjects || [];
    const combined = [];

    events.forEach(e => {
      const eventDate = new Date(e.date);
      if (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear) {
        combined.push({ ...e, type: e.type || 'event', dateObj: eventDate });
      }
    });

    tasks.forEach(t => {
      if (!t.deadline) return;
      const d = new Date(t.deadline);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const subj = subjects.find(s => s.id === t.subjectId);
        combined.push({
          id: t.id,
          title: t.title,
          date: t.deadline,
          type: 'deadline',
          description: subj ? subj.name : '',
          dateObj: d,
          subjectColor: subj ? subj.color : '#ef4444',
        });
      }
    });

    const dayMap = { Minggu:0, Senin:1, Selasa:2, Rabu:3, Kamis:4, Jumat:5, Sabtu:6 };
    schedules.forEach(s => {
      const subj = subjects.find(x => x.id === s.subjectId);
      if (!subj) return;
      const dayNum = typeof s.day === 'number' ? s.day : (dayMap[s.day] ?? -1);
      if (dayNum < 0) return;
      const now = new Date(); now.setHours(0,0,0,0);
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(currentYear, currentMonth, d);
        if (date.getDay() === dayNum && date >= now) {
          combined.push({
            id: s.id + '_' + d,
            title: subj.name,
            date: date.toISOString(),
            type: 'class',
            description: 'Kelas: ' + subj.name + (s.room ? ' · ' + s.room : '') + (s.startTime ? ' · ' + s.startTime : ''),
            dateObj: date,
            subjectColor: subj.color || '#4f46e5',
          });
        }
      }
    });

    return combined;
  }

  function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    document.getElementById('currentMonthYear').textContent =
      `${getMonthName(currentMonth)} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    const events = getMonthEvents();

    let html = '';
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="cal-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = isSameDay(date, today);
      const dayEvents = events.filter(e => isSameDay(e.dateObj, date));
      const hasEvent = dayEvents.length > 0;
      const typeCounts = {};
      dayEvents.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });
      const dotColors = { deadline: '#ef4444', quiz: '#f59e0b', uts: '#3b82f6', uas: '#8b5cf6', presentation: '#10b981', holiday: '#6b7280', class: '#4f46e5', event: '#ec4899' };
      const dots = Object.entries(typeCounts).map(([t, c]) =>
        `<div class="cal-dot" style="background:${dotColors[t] || '#4f46e5'}${c > 1 ? ';position:relative' : ''}"></div>`
      ).join('');

      html += `
        <div class="cal-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}"
             data-date="${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}">
          <span class="cal-day-num">${day}</span>
          ${hasEvent ? `<div class="cal-dots">${dots}</div>` : ''}
          ${hasEvent && dayEvents.length > 1 ? `<div class="cal-day-event-count">+${dayEvents.length}</div>` : ''}
        </div>`;
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.cal-day:not(.empty)').forEach(el => {
      el.addEventListener('click', () => {
        const dateStr = el.dataset.date;
        showDayDetail(dateStr, events);
      });
    });
  }

  function showDayDetail(dateStr, events) {
    const detailEl = document.getElementById('dayDetail');
    if (!detailEl) return;
    const parts = dateStr.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    const dayEvents = events.filter(e =>
      isSameDay(e.dateObj, d)
    );

    const subtitle = document.getElementById('dayDetailSubtitle');
    if (subtitle) subtitle.textContent = formatDate(dateStr, 'full');

    const list = document.getElementById('dayDetailList');
    if (!list) return;

    if (dayEvents.length === 0) {
      list.innerHTML = '<div class="empty-state">Tidak ada acara pada tanggal ini</div>';
    } else {
      list.innerHTML = dayEvents.map(e => `
        <div class="day-event" style="border-left-color: ${getEventColor(e.type, e)}">
          <div class="day-event-type">${getEventTypeLabel(e.type)}</div>
          <div class="day-event-title">${escapeHtml(e.title)}</div>
          ${e.description ? `<div class="day-event-desc">${escapeHtml(e.description)}</div>` : ''}
        </div>
      `).join('');
    }

    detailEl.classList.add('visible');
  }

  function navigate(direction) {
    currentMonth += direction;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
    document.getElementById('dayDetail')?.classList.remove('visible');
  }

  function init() {
    renderCalendar();

    document.getElementById('prevMonth')?.addEventListener('click', () => navigate(-1));
    document.getElementById('nextMonth')?.addEventListener('click', () => navigate(1));
    document.getElementById('todayBtn')?.addEventListener('click', () => {
      const now = new Date();
      currentMonth = now.getMonth();
      currentYear = now.getFullYear();
      renderCalendar();
    });

    document.getElementById('closeDayDetail')?.addEventListener('click', () => {
      document.getElementById('dayDetail')?.classList.remove('visible');
    });
  }

  init();
}

function getEventColor(type, event) {
  const colors = {
    deadline: '#ef4444', quiz: '#f59e0b', uts: '#3b82f6',
    uas: '#8b5cf6', presentation: '#10b981', holiday: '#6b7280',
    class: '#4f46e5', event: '#ec4899',
  };
  return event.subjectColor || colors[type] || '#4f46e5';
}

function getEventTypeLabel(type) {
  const labels = {
    deadline: 'Deadline', quiz: 'Quiz', uts: 'UTS',
    uas: 'UAS', presentation: 'Presentasi', holiday: 'Libur',
    class: 'Kuliah', event: 'Event',
  };
  return labels[type] || type || 'Event';
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
