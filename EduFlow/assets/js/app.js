import { loadData, setStorageSuffix, setSyncCallback, loadFromRemote, getData, persist } from './services/storage.js';
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
  await db.init();
  await loadData();
  setupSync();
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

  const loadingEl = document.getElementById('appLoading');
  if (loadingEl) {
    loadingEl.style.opacity = '0';
    setTimeout(() => loadingEl.remove(), 400);
  }

  if ('serviceWorker' in navigator) {
    const swUrl = new URL('../service-worker.js', import.meta.url).pathname;
    navigator.serviceWorker.register(swUrl).catch(e => console.warn('SW registration failed:', e));
  }
})();

function applySavedTheme() {
  const key = 'eduflow_data_v2' + (auth.currentUser?.id ? '_' + auth.currentUser.id : '');
  const raw = localStorage.getItem(key);
  const data = raw ? JSON.parse(raw) : {};
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

async function setupSync() {
  if (!db.isOnline() || !auth.currentUser?.email) return;

  try {
    const remote = await loadFromRemote(async () => {
      const { data, error } = await db.supabase
        .from('user_data')
        .select('data')
        .eq('user_email', auth.currentUser.email)
        .single();
      if (error || !data) return null;
      return typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
    });
    if (remote) console.log('Data loaded from Supabase');
    else console.log('No remote data, using local');
  } catch (e) {
    console.warn('Supabase load failed:', e.message);
  }

  setSyncCallback(async (data) => {
    try {
      const json = JSON.stringify(data);
      await db.supabase.from('user_data').upsert(
        { user_email: auth.currentUser.email, data: json, updated_at: new Date().toISOString() },
        { onConflict: 'user_email' }
      );
    } catch (e) {
      console.warn('Supabase sync failed:', e.message);
    }
  });

  const currentData = getData();
  if (currentData.subjects?.length || currentData.tasks?.length) {
    persist();
  }
}
