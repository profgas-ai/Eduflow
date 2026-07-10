import { getData, persist, exportData, importData, clearData, getStorageInfo } from '../services/storage.js';
import { auth } from '../services/auth.js';
import { showToast } from '../components/toast.js';
import { CONFIG } from '../config/config.js';

export function initSettings() {
  const data = getData();
  const user = data.user || {};

  function loadSettings() {
    setValue('settingsName', user.name || '');
    setValue('settingsEmail', user.email || '');
    setValue('settingsSemester', user.semester || CONFIG.DEFAULT_SEMESTER);
    setValue('settingsStudyProgram', user.studyProgram || '');
    setValue('settingsUniversity', user.university || '');
    setValue('settingsTheme', user.theme || 'system');
    setValue('settingsLanguage', user.language || 'id');

    updateStorageInfo();
    renderAvatar();
  }

  function renderAvatar() {
    const avatarEl = document.getElementById('settingsAvatar');
    if (!avatarEl) return;
    if (user.avatar) {
      avatarEl.innerHTML = `<img src="${user.avatar}" alt="Avatar" style="width:80px;height:80px;border-radius:50%;object-fit:cover;">`;
    } else {
      avatarEl.innerHTML = `<div class="avatar-placeholder">${(user.name || 'U')[0].toUpperCase()}</div>`;
    }
  }

  async function updateStorageInfo() {
    const info = await getStorageInfo();
    setText('storageSubjects', info.subjects);
    setText('storageTasks', info.tasks);
    setText('storageSize', info.sizeKB + ' KB');
  }

  function saveProfile() {
    const name = document.getElementById('settingsName')?.value?.trim();
    const email = document.getElementById('settingsEmail')?.value?.trim();
    const semester = Math.max(1, Number(document.getElementById('settingsSemester')?.value) || 1);
    const studyProgram = document.getElementById('settingsStudyProgram')?.value?.trim();
    const university = document.getElementById('settingsUniversity')?.value?.trim();

    if (!name) { showToast('Nama wajib diisi'); return; }

    Object.assign(user, { name, email, semester, studyProgram, university });
    persist();
    showToast('Profil diperbarui');
  }

  function saveAppearance() {
    const theme = document.getElementById('settingsTheme')?.value || 'system';
    const language = document.getElementById('settingsLanguage')?.value || 'id';
    user.theme = theme;
    user.language = language;
    data.settings = data.settings || {};
    data.settings.theme = theme;
    data.settings.language = language;
    persist();
    applyTheme(theme);
    showToast('Tampilan diperbarui');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme',
      theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme
    );
  }

  async function handleExport() {
    await exportData();
    showToast('Data berhasil diexport');
  }

  async function handleImport() {
    const input = document.getElementById('importFile');
    if (!input || !input.files?.[0]) {
      showToast('Pilih file terlebih dahulu');
      return;
    }
    const text = await input.files[0].text();
    let preview;
    try {
      const d = JSON.parse(text);
      if (!d.user || !Array.isArray(d.subjects)) throw new Error();
      preview = `${d.subjects.length} MK, ${(d.tasks||[]).length} tugas, ${(d.notes||[]).length} catatan`;
    } catch {
      showToast('Format file tidak valid'); return;
    }
    const { showDialog } = await import('../components/dialog.js');
    const confirmed = await showDialog({
      title: 'Import Data',
      message: `Data ini berisi ${preview}. Lanjutkan? Data lama akan ditimpa.`,
      confirmText: 'Import',
    });
    if (!confirmed) return;
    const result = await importData(text);
    if (result) {
      showToast('Data berhasil diimport');
      setTimeout(() => location.reload(), 1000);
    } else {
      showToast('Format file tidak valid');
    }
  }

  async function handleClearData() {
    const { showDialog } = await import('../components/dialog.js');
    const confirmed = await showDialog({
      title: 'Hapus Semua Data',
      message: 'Yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Hapus',
      danger: true,
    });
    if (!confirmed) return;
    await clearData();
    showToast('Data dihapus');
    setTimeout(() => location.reload(), 1000);
  }

  function handleAvatarUpload() {
    const input = document.getElementById('avatarInput');
    if (!input || !input.files?.[0]) return;
    const file = input.files[0];
    auth.uploadAvatar(file).then(url => {
      user.avatar = url;
      renderAvatar();
      showToast('Foto profil diperbarui');
    }).catch(() => {
      showToast('Gagal upload foto');
    });
  }

  function init() {
    loadSettings();
    applyTheme(user.theme || 'system');

    document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);
    document.getElementById('saveAppearanceBtn')?.addEventListener('click', saveAppearance);
    document.getElementById('exportBtn')?.addEventListener('click', handleExport);
    document.getElementById('importBtn')?.addEventListener('click', handleImport);
    document.getElementById('clearDataBtn')?.addEventListener('click', handleClearData);
    document.getElementById('avatarUploadBtn')?.addEventListener('click', () => {
      document.getElementById('avatarInput')?.click();
    });
    document.getElementById('avatarInput')?.addEventListener('change', handleAvatarUpload);

    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const theme = opt.dataset.theme;
        document.getElementById('settingsTheme').value = theme;
        document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
      });
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (user.theme === 'system') {
        applyTheme('system');
      }
    });
  }

  init();
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
