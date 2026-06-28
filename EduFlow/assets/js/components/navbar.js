export const NAV_ITEMS = [
  { page: 'home', href: 'index.html', label: 'Beranda', icon: 'home' },
  { page: 'subjects', href: 'subjects.html', label: 'Mata Kuliah', icon: 'book' },
  { page: 'tasks', href: 'tasks.html', label: 'Tugas', icon: 'check' },
  { page: 'attendance', href: 'attendance.html', label: 'Presensi', icon: 'calendar' },
  { page: 'more', href: '#', label: 'Lainnya', icon: 'more' },
];

const SVG_ICONS = {
  home: '<path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10h14V10"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  'calendar': '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  more: '<circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/>',
};

export function setActiveNav(page) {
  document.querySelectorAll('.bottom-nav .nav-item').forEach((a) => {
    const pageAttr = a.getAttribute('data-page');
    const isActive = pageAttr === page;
    a.classList.toggle('active', isActive);
    const dot = a.querySelector('.nav-dot');
    if (dot) dot.classList.toggle('hidden', !isActive);
    if (isActive) {
      a.setAttribute('aria-current', 'page');
    } else {
      a.removeAttribute('aria-current');
    }
  });
}

export function renderBottomNav(currentPage) {
  const nav = document.querySelector('.bottom-nav');
  if (!nav) return;

  nav.innerHTML = '';
  NAV_ITEMS.forEach(item => {
    const a = document.createElement('a');
    a.className = 'nav-item' + (item.page === currentPage ? ' active' : '');
    a.href = item.href;
    a.setAttribute('data-page', item.page);
    a.setAttribute('aria-label', item.label);
    if (item.page === currentPage) {
      a.setAttribute('aria-current', 'page');
    }
    a.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${SVG_ICONS[item.icon]}</svg>
      ${item.label}<span class="nav-dot ${item.page === currentPage ? '' : 'hidden'}"></span>`;
    nav.appendChild(a);
  });

  const moreBtn = nav.querySelector('[data-page="more"]');
  if (moreBtn) {
    moreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMoreMenu(currentPage);
    });
  }

  let menuEl = document.getElementById('nav-more-menu');
  if (!menuEl) {
    menuEl = document.createElement('div');
    menuEl.id = 'nav-more-menu';
    menuEl.style.cssText = `
      display:none; position:fixed; bottom:70px; right:12px;
      background:var(--surface-container); border-radius:var(--radius-lg);
      box-shadow:0 4px 20px rgba(0,0,0,0.15); padding:0.4rem 0;
      z-index:60; min-width:160px;
    `;
    menuEl.addEventListener('click', (e) => e.stopPropagation());
    document.body.appendChild(menuEl);
  }
}

function toggleMoreMenu(currentPage) {
  const menu = document.getElementById('nav-more-menu');
  if (!menu) return;

  if (menu.style.display === 'block') {
    menu.style.display = 'none';
    return;
  }

  const items = [
    { page: 'calendar', href: 'calendar.html', label: 'Kalender', icon: 'calendar-month' },
    { page: 'notes', href: 'notes.html', label: 'Catatan', icon: 'note' },
    { page: 'settings', href: 'settings.html', label: 'Pengaturan', icon: 'settings' },
    { page: 'logout', href: '#', label: 'Keluar', icon: 'logout' },
  ];

  const SVG = {
    'calendar-month': '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    note: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  };

  menu.innerHTML = items.map(item => `
    <a href="${item.href}"
       data-nav-action="${item.page}"
       style="display:flex;align-items:center;gap:0.65rem;padding:0.6rem 1rem;text-decoration:none;font-size:14px;color:var(--on-surface);transition:background .15s;"
       onmouseenter="this.style.background='var(--surface-container-high)'"
       onmouseleave="this.style.background='transparent'"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;flex-shrink:0">${SVG[item.icon]}</svg>
      ${item.label}
    </a>
  `).join('');

  menu.style.display = 'block';

  menu.querySelector('[data-nav-action="logout"]')?.addEventListener('click', async (e) => {
    e.preventDefault();
    menu.style.display = 'none';
    const { auth } = await import('../services/auth.js');
    await auth.logout();
    window.location.href = 'login.html';
  });
}
