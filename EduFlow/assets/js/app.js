import { loadData, setStorageSuffix, getData } from './services/storage.js';
import { auth } from './services/auth.js';
import { db } from './services/database.js';
import { notifier } from './services/notification.js';
import { setupSync } from './services/sync.js';
import { setupModalBackdropClose } from './components/modal.js';
import { renderSidebar } from './components/sidebar.js';
import { renderBottomNav, setActiveNav } from './components/navbar.js';
import { updateNotificationBadge, setupNotificationPanel } from './components/notification-panel.js';
import { setupGlobalSearch } from './components/global-search.js';

(async function init() {
  try {
  document.body.classList.remove('auth-loading');

  await auth.init();
  const userSuffix = auth.currentUser?.email || '';
  setStorageSuffix(userSuffix);
  if (!auth.isAuthenticated) {
    window.location.href = 'login.html';
    return;
  }
  await db.init();
  await loadData();
  await setupSync();
  setupModalBackdropClose();

  const page = document.body.dataset.page || 'home';
  renderSidebar(page);
  renderBottomNav(page);
  setActiveNav(page);

  notifier.init();

  try {
    switch (page) {
      case 'home':
        const { initDashboard } = await import('./modules/dashboard.js');
        initDashboard();
        break;
      case 'subjects':
        const { initSubjects } = await import('./modules/subjects.js');
        initSubjects();
        break;
      case 'tasks':
        const { initTasks } = await import('./modules/tasks.js');
        initTasks();
        break;
      case 'attendance':
        const { initAttendance } = await import('./modules/attendance.js');
        initAttendance();
        break;
      case 'calendar':
        const { initCalendar } = await import('./modules/calendar.js');
        initCalendar();
        break;
      case 'notes':
        const { initNotes } = await import('./modules/notes.js');
        initNotes();
        break;
      case 'settings':
        const { initSettings } = await import('./modules/settings.js');
        initSettings();
        break;
    }
  } catch (e) {
    console.error('Failed to initialize page module:', e);
  }

  applySavedTheme();
  updateNotificationBadge();
  setupNotificationPanel();
  setupGlobalSearch();

  const loadingEl = document.getElementById('appLoading');
  if (loadingEl) {
    loadingEl.style.opacity = '0';
    setTimeout(() => loadingEl.remove(), 400);
  }

  if ('serviceWorker' in navigator) {
    const swUrl = new URL('../../service-worker.js', import.meta.url).pathname;
    navigator.serviceWorker.register(swUrl).catch(e => console.warn('SW registration failed:', e));
  }
  } catch (e) { console.error('App init failed:', e); }
})();

function applySavedTheme() {
  const data = getData();
  const theme = data.user?.theme || data.settings?.theme || 'system';
  if (theme === 'system') {
    document.documentElement.setAttribute('data-theme',
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
