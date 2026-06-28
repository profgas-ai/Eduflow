export const SIDEBAR_LINKS = [
  { page: 'home', href: 'index.html', label: 'Beranda', icon: 'home' },
  { page: 'subjects', href: 'subjects.html', label: 'Mata Kuliah', icon: 'book' },
  { page: 'tasks', href: 'tasks.html', label: 'Tugas', icon: 'check' },
  { page: 'attendance', href: 'attendance.html', label: 'Presensi', icon: 'calendar' },
  { page: 'calendar', href: 'calendar.html', label: 'Kalender', icon: 'calendar-month' },
  { page: 'notes', href: 'notes.html', label: 'Catatan', icon: 'note' },
  { page: 'settings', href: 'settings.html', label: 'Pengaturan', icon: 'settings' },
];

const SVG_ICONS = {
  home: '<path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10h14V10"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  'calendar': '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  'calendar-month': '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  'note': '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  'settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
};

export function renderSidebar(currentPage) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const brandDiv = sidebar.querySelector('.brand');
  if (!brandDiv) {
    const brand = document.createElement('div');
    brand.className = 'brand';
    brand.innerHTML = `
      <div class="brand-avatar" style="background:var(--primary-container);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary-dark);">E</div>
      <span class="brand-name">EduFlow</span>`;
    sidebar.prepend(brand);
  }

  SIDEBAR_LINKS.forEach(link => {
    const existing = sidebar.querySelector(`a[href="${link.href}"]`);
    if (!existing) {
      const a = document.createElement('a');
      a.className = 'sidebar-link' + (link.page === currentPage ? ' active' : '');
      a.href = link.href;
      a.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${SVG_ICONS[link.icon]}</svg>${link.label}`;
      if (link.page === currentPage) {
        a.setAttribute('aria-current', 'page');
      }
      sidebar.insertBefore(a, sidebar.querySelector('.sidebar-foot'));
    } else {
      existing.className = 'sidebar-link' + (link.page === currentPage ? ' active' : '');
      if (link.page === currentPage) {
        existing.setAttribute('aria-current', 'page');
      } else {
        existing.removeAttribute('aria-current');
      }
    }
  });

  let logoutBtn = sidebar.querySelector('#sidebar-logout');
  if (!logoutBtn) {
    logoutBtn = document.createElement('a');
    logoutBtn.id = 'sidebar-logout';
    logoutBtn.className = 'sidebar-link';
    logoutBtn.href = '#';
    logoutBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>Keluar`;
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const { auth } = await import('../services/auth.js');
      await auth.logout();
      window.location.href = 'login.html';
    });
    const foot = sidebar.querySelector('.sidebar-foot');
    if (foot) sidebar.insertBefore(logoutBtn, foot);
    else sidebar.appendChild(logoutBtn);
  }
}
