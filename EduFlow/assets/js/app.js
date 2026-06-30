import { escapeHtml } from './utils/helper.js';
import { loadData, setStorageSuffix, setSyncCallback, getData, saveData, persist } from './services/storage.js';
import { auth } from './services/auth.js';
import { db } from './services/database.js';
import { notifier } from './services/notification.js';
import { setupModalBackdropClose } from './components/modal.js';
import { renderSidebar } from './components/sidebar.js';
import { renderBottomNav, setActiveNav } from './components/navbar.js';

(async function init() {
  try {
  await auth.init();
  const userSuffix = auth.currentUser?.id === 'local' ? auth.currentUser?.email : (auth.currentUser?.id || '');
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
  setupNotificationPanel();

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

function updateNotificationBadge() {
  const unread = notifier.getUnreadCount();
  document.querySelectorAll('.notification-badge').forEach(el => {
    el.textContent = unread > 9 ? '9+' : unread || '';
    el.style.display = unread > 0 ? 'flex' : 'none';
  });
}

function setupNotificationPanel() {
  const btn = document.querySelector('.icon-btn[aria-label="Notifikasi"]');
  if (!btn) return;
  let modal = document.getElementById('notifModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'notifModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = '<div class="modal" style="max-width:420px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><h3 style="margin:0">Notifikasi</h3><button class="btn btn-ghost btn-sm" id="markAllReadBtn" style="font-size:12px">Baca Semua</button></div><div id="notifList" style="max-height:400px;overflow-y:auto;margin-bottom:1rem"></div><div class="modal-actions"><button class="btn btn-ghost" onclick="this.closest(\'.modal-backdrop\').classList.remove(\'open\')">Tutup</button></div></div>';
    document.body.appendChild(modal);
  }
  btn.addEventListener('click', () => {
    renderNotifications();
    modal.classList.add('open');
  });
  document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
    notifier.markAllAsRead();
    renderNotifications();
    updateNotificationBadge();
  });
}

function renderNotifications() {
  const list = document.getElementById('notifList');
  if (!list) return;
  const notifs = notifier.getNotifications();
  if (notifs.length === 0) {
    list.innerHTML = '<div class="empty-state">Belum ada notifikasi</div>';
    return;
  }
  list.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" style="padding:0.6rem 0.75rem;border-bottom:1px solid var(--outline-variant);${n.read ? 'opacity:0.6' : ''}" data-id="${n.id}">
      <div style="font-weight:${n.read ? '400' : '600'};font-size:14px">${escapeHtml(n.title)}</div>
      ${n.message ? `<div style="font-size:12px;color:var(--on-surface-variant);margin-top:0.15rem">${escapeHtml(n.message)}</div>` : ''}
      <div style="font-size:11px;color:var(--on-surface-variant);margin-top:0.2rem">${new Date(n.createdAt).toLocaleDateString('id-ID', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `).join('');
  list.querySelectorAll('.notif-item.unread').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      notifier.markAsRead(id);
      el.classList.remove('unread');
      el.style.opacity = '0.6';
      el.querySelector('div:first-child').style.fontWeight = '400';
      updateNotificationBadge();
    });
  });
}

async function setupSync() {
  if (!db.isOnline() || !auth.currentUser?.email) return;

  setSyncCallback(async (data) => {
    try {
      const json = JSON.stringify(data);
      const ts = new Date(data.user?.updatedAt || Date.now()).toISOString();
      await db.supabase.from('user_data').upsert(
        { user_email: auth.currentUser.email, data: json, updated_at: ts },
        { onConflict: 'user_email' }
      );
    } catch (e) {
      console.warn('Supabase sync failed:', e.message);
    }
  });

  try {
    const { data: row, error } = await db.supabase
      .from('user_data')
      .select('data, updated_at')
      .eq('user_email', auth.currentUser.email)
      .single();

    if (!error && row) {
      const remoteData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      const localData = getData();
      const localT = localData.user?.updatedAt || 0;
      const remoteT = new Date(row.updated_at).getTime();

      if (remoteT > localT) {
        dataCache = remoteData;
        saveData(remoteData);
        console.log('Menggunakan data dari cloud (lebih baru)');
      } else {
        persist();
        console.log('Data lokal lebih baru, push ke cloud');
      }
    } else {
      persist();
      console.log('Tidak ada data remote, push data lokal');
    }
  } catch (e) {
    console.warn('Supabase load failed:', e.message);
  }
}
