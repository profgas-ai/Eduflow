import { loadData, setStorageSuffix } from './services/storage.js';
import { auth } from './services/auth.js';
import { db } from './services/database.js';
import { notifier } from './services/notification.js';
import { setupModalBackdropClose } from './components/modal.js';
import { renderSidebar } from './components/sidebar.js';
import { renderBottomNav, setActiveNav } from './components/navbar.js';

(async function init() {
  await auth.init();
  const userSuffix = auth.currentUser?.id === 'local' ? auth.currentUser?.email : (auth.currentUser?.id || '');
  setStorageSuffix(userSuffix);
  if (!auth.isAuthenticated) {
    window.location.href = 'login.html';
    return;
  }
  await loadData();
  await db.init();
  setupModalBackdropClose();

  const page = document.body.dataset.page || 'home';
  renderSidebar(page);
  renderBottomNav(page);
  setActiveNav(page);

  notifier.init();

  const currentPage = page;
  try {
    switch (currentPage) {
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
})();

function applySavedTheme() {
  const data = JSON.parse(localStorage.getItem('eduflow_data_v2') || '{}');
  const theme = data.user?.theme || data.settings?.theme || 'system';
  if (theme === 'system') {
    document.documentElement.setAttribute('data-theme',
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function updateNotificationBadge() {
  const unread = notifier.getUnreadCount();
  document.querySelectorAll('.notification-badge').forEach(el => {
    el.textContent = unread > 9 ? '9+' : unread || '';
    el.style.display = unread > 0 ? 'flex' : 'none';
  });
}
