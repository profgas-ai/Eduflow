import { escapeHtml } from '../utils/helper.js';
import { notifier } from '../services/notification.js';

export function updateNotificationBadge() {
  const unread = notifier.getUnreadCount();
  document.querySelectorAll('.notification-badge').forEach(el => {
    el.textContent = unread > 9 ? '9+' : unread || '';
    el.style.display = unread > 0 ? 'flex' : 'none';
  });
}

export function setupNotificationPanel() {
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

export function renderNotifications() {
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
