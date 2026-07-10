import { escapeHtml } from '../utils/helper.js';
import { persist } from '../services/storage.js';

const gradeValues = { A: 4.0, 'A-': 3.7, 'B+': 3.3, B: 3.0, 'B-': 2.7, 'C+': 2.3, C: 2.0, D: 1.0, E: 0 };

export function setupGpaCalculator(data) {
  data.gradeRecords = data.gradeRecords || [];

  function loadRowsFromData() {
    data.gradeRecords = data.gradeRecords || [];
  }

  function calcGpa() {
    let totalSks = 0, totalNilai = 0;
    data.gradeRecords.forEach(r => {
      const sks = parseInt(r.sks) || 0;
      const g = gradeValues[r.grade] || 0;
      totalSks += sks;
      totalNilai += sks * g;
    });
    const gpa = totalSks > 0 ? (totalNilai / totalSks) : 0;
    document.getElementById('ipkResult').textContent = gpa.toFixed(2);
  }

  function saveRows() {
    persist();
  }

  function renderIpkRows() {
    const list = document.getElementById('ipkSubjectList');
    if (!list) return;
    loadRowsFromData();
    list.innerHTML = data.gradeRecords.map((r, i) => `
      <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;align-items:center">
        <input type="text" value="${escapeHtml(r.name)}" data-idx="${i}" class="ipk-name" placeholder="Nama MK" style="flex:2;padding:0.5rem;border:1px solid var(--outline-variant);border-radius:var(--radius-sm);background:var(--surface-container);font-size:13px">
        <input type="number" value="${r.sks}" data-idx="${i}" class="ipk-sks" min="1" max="6" style="width:50px;padding:0.5rem;border:1px solid var(--outline-variant);border-radius:var(--radius-sm);background:var(--surface-container);font-size:13px">
        <select data-idx="${i}" class="ipk-grade" style="padding:0.5rem;border:1px solid var(--outline-variant);border-radius:var(--radius-sm);background:var(--surface-container);font-size:13px">
          ${Object.keys(gradeValues).map(g => `<option value="${g}" ${g === r.grade ? 'selected' : ''}>${g}</option>`).join('')}
        </select>
        <button class="icon-action ipk-delete" data-idx="${i}" style="font-size:16px">×</button>
      </div>
    `).join('');

    list.querySelectorAll('.ipk-name').forEach(el => {
      el.addEventListener('change', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        data.gradeRecords[idx].name = e.currentTarget.value;
        calcGpa();
        saveRows();
      });
    });
    list.querySelectorAll('.ipk-sks').forEach(el => {
      el.addEventListener('change', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        data.gradeRecords[idx].sks = parseInt(e.currentTarget.value) || 0;
        calcGpa();
        saveRows();
      });
    });
    list.querySelectorAll('.ipk-grade').forEach(el => {
      el.addEventListener('change', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        data.gradeRecords[idx].grade = e.currentTarget.value;
        calcGpa();
        saveRows();
      });
    });
    list.querySelectorAll('.ipk-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        data.gradeRecords.splice(idx, 1);
        renderIpkRows();
        calcGpa();
        saveRows();
      });
    });
    calcGpa();
  }

  document.getElementById('ipkFabBtn')?.addEventListener('click', () => {
    renderIpkRows();
    document.getElementById('ipkModal').classList.add('open');
  });
  document.getElementById('ipkAddRow')?.addEventListener('click', () => {
    data.gradeRecords.push({ name: '', sks: 3, grade: 'B+' });
    renderIpkRows();
    calcGpa();
    saveRows();
  });
}
