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
}
