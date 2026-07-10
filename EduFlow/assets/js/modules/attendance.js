import { getData, persist } from '../services/storage.js';
import { db } from '../services/database.js';
import { escapeHtml, generateId } from '../utils/helper.js';
import { createAttendanceCard } from '../components/card.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { CONFIG } from '../config/config.js';
import { chartManager } from '../components/chart.js';
import { formatDate as fmtDate } from '../utils/formatter.js';

export function initAttendance() {
  const data = getData();

  function pctColor(p) {
    if (p >= 85) return 'var(--secondary)';
    if (p >= CONFIG.ATTENDANCE_MINIMUM) return 'var(--primary)';
    return 'var(--error)';
  }

  async function render() {
    const subjects = data.subjects || [];
    recalcAttendance(subjects);

    let totalSessions = 0, totalPresent = 0;
    subjects.forEach(s => {
      totalSessions += s.totalSessions || 0;
      totalPresent += s.present || 0;
    });
    const overallPct = totalSessions ? Math.round((totalPresent / totalSessions) * 100) : 0;
    const missed = totalSessions - totalPresent;

    setText('overallPct', overallPct + '%');
    const fill = document.getElementById('overallFill');
    if (fill) {
      fill.style.width = overallPct + '%';
      fill.style.background = pctColor(overallPct);
    }
    setText('overallNote', totalSessions
      ? `Kamu sudah melewatkan ${missed} sesi semester ini. ${overallPct >= 85 ? 'Pertahankan!' : overallPct >= CONFIG.ATTENDANCE_MINIMUM ? 'Cukup, bisa ditingkatkan!' : 'Perlu ditingkatkan!'}`
      : 'Belum ada data sesi. Tandai kehadiran di mata kuliahmu.');

    const sorted = [...subjects].filter(s => (s.totalSessions || 0) > 0)
      .sort((a, b) => ((a.present || 0) / (a.totalSessions || 1)) - ((b.present || 0) / (b.totalSessions || 1)));
    const lowest = sorted[0];
    setText('tipText', lowest
      ? `Jaga kehadiran minimal ${CONFIG.ATTENDANCE_MINIMUM}% di ${escapeHtml(lowest.name)} agar tetap memenuhi syarat ujian akhir.`
      : `Jaga kehadiran minimal ${CONFIG.ATTENDANCE_MINIMUM}% di setiap mata kuliah untuk memenuhi syarat ujian akhir.`);

    const listEl = document.getElementById('attendanceList');
    if (!listEl) return;

    if (subjects.length === 0) {
      listEl.innerHTML = '<div class="empty-state">Belum ada mata kuliah. Tambahkan di halaman Mata Kuliah.</div>';
      return;
    }

    listEl.innerHTML = subjects.map(s => {
      const card = createAttendanceCard(s);
      return card.replace('</div>', '<button class="btn btn-ghost btn-sm btn-history" data-id="' + s.id + '" style="margin-top:0.5rem;width:100%;">📋 Riwayat Presensi</button></div>');
    }).join('');
    bindAttendanceEvents();

    const absent = totalSessions - totalPresent;
    if (document.getElementById('attendanceChart')) {
      await chartManager.createAttendanceChart('attendanceChart', totalPresent, absent);
    }
  }

  function recalcAttendance(subjects) {
    const records = data.attendanceRecords || [];
    let changed = false;
    subjects.forEach(s => {
      const subjectRecords = records.filter(r => r.subjectId === s.id);
      const newTotal = subjectRecords.length;
      const newPresent = subjectRecords.filter(r => r.status === 'hadir').length;
      if (s.totalSessions !== newTotal || s.present !== newPresent) changed = true;
      s.totalSessions = newTotal;
      s.present = newPresent;
    });
    if (changed) persist();
  }

  function bindAttendanceEvents() {
    document.querySelectorAll('.btn-attend-present').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); markAttendance(e.currentTarget.dataset.id, 'hadir'); });
    });
    document.querySelectorAll('.btn-attend-absent').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); markAttendance(e.currentTarget.dataset.id, 'alpha'); });
    });
    document.querySelectorAll('.btn-history').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); showHistory(e.currentTarget.dataset.id); });
    });
  }

  function markAttendance(id, status) {
    const s = data.subjects.find(x => x.id === id);
    if (!s) return;
    data.attendanceRecords = data.attendanceRecords || [];
    const today = new Date().toISOString().split('T')[0];
    if (data.attendanceRecords.some(r => r.subjectId === id && r.date.startsWith(today))) {
      showToast('Hari ini sudah dicatat'); return;
    }
    const meeting = data.attendanceRecords.filter(r => r.subjectId === id).length + 1;
    const record = {
      id: generateId(), subjectId: id, meeting,
      date: new Date().toISOString(), status,
      notes: '', createdAt: new Date().toISOString(),
    };
    data.attendanceRecords.push(record);
    db.insert('attendance', record);
    showToast(status === 'hadir' ? 'Ditandai Hadir' : 'Ditandai Absen');
    render();
  }

  function showHistory(subjectId) {
    const s = data.subjects.find(x => x.id === subjectId);
    if (!s) return;
    const records = (data.attendanceRecords || []).filter(r => r.subjectId === subjectId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const container = document.getElementById('historyContainer');
    const title = document.getElementById('historyTitle');
    if (!container || !title) return;

    title.textContent = 'Riwayat Presensi - ' + s.name;

    if (records.length === 0) {
      container.innerHTML = '<div class="empty-state">Belum ada riwayat presensi.</div>';
    } else {
      container.innerHTML = records.map(r => `
        <div class="history-item" data-id="${r.id}">
          <div class="history-info">
            <div class="history-meeting">Pertemuan ${r.meeting}</div>
            <div class="history-date">${fmtDate(r.date, 'datetime')}</div>
          </div>
          <select class="history-status" data-id="${r.id}">
            <option value="hadir" ${r.status === 'hadir' ? 'selected' : ''}>Hadir</option>
            <option value="izin" ${r.status === 'izin' ? 'selected' : ''}>Izin</option>
            <option value="sakit" ${r.status === 'sakit' ? 'selected' : ''}>Sakit</option>
            <option value="alpha" ${r.status === 'alpha' ? 'selected' : ''}>Alpha</option>
          </select>
          <button class="icon-action btn-delete-record" data-id="${r.id}" title="Hapus">🗑</button>
        </div>
      `).join('');
    }

    container.querySelectorAll('.history-status').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const recordId = e.currentTarget.dataset.id;
        const newStatus = e.currentTarget.value;
        const record = data.attendanceRecords.find(r => r.id === recordId);
        if (record) {
          record.status = newStatus;
          db.update('attendance', { id: recordId }, { status: newStatus });
          showToast('Status diubah ke ' + newStatus);
          closeModal('historyModal');
          render();
        }
      });
    });

    container.querySelectorAll('.btn-delete-record').forEach(btn => {
      btn.addEventListener('click', () => {
        const recordId = btn.dataset.id;
        data.attendanceRecords = data.attendanceRecords.filter(r => r.id !== recordId);
        db.delete('attendance', { id: recordId });
        showToast('Record dihapus');
        closeModal('historyModal');
        render();
      });
    });

    openModal('historyModal');
  }

  render().catch(e => console.warn('Attendance render failed:', e));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
