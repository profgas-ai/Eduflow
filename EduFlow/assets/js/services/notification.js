import { getData, persist } from './storage.js';
import { generateId } from '../utils/helper.js';

export class NotificationService {
  constructor() {
    this.permission = 'default';
  }

  async init() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      if (this.permission === 'default') {
        this.permission = await Notification.requestPermission();
      }
    }
    this._checkDeadlines();
    setInterval(() => this._checkDeadlines(), 60000);
  }

  async requestPermission() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
    }
    return this.permission;
  }

  send(title, options = {}) {
    const data = getData();
    const notification = {
      id: generateId(),
      type: options.type || 'general',
      title,
      message: options.message || '',
      read: false,
      createdAt: new Date().toISOString(),
    };
    data.notifications = data.notifications || [];
    data.notifications.unshift(notification);
    persist();
    this._dispatchEvent(notification);
    if (this.permission === 'granted' && !options.silent) {
      new Notification(title, {
        body: options.message,
        icon: '/assets/icons/icon-192.png',
        ...options,
      });
    }
  }

  getNotifications() {
    const data = getData();
    return (data.notifications || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getUnreadCount() {
    return this.getNotifications().filter(n => !n.read).length;
  }

  markAsRead(id) {
    const data = getData();
    const n = (data.notifications || []).find(x => x.id === id);
    if (n) {
      n.read = true;
      persist();
    }
  }

  markAllAsRead() {
    const data = getData();
    (data.notifications || []).forEach(n => { n.read = true; });
    persist();
  }

  clearAll() {
    const data = getData();
    data.notifications = [];
    persist();
  }

  _checkDeadlines() {
    const data = getData();
    const now = new Date();
    const tasks = data.tasks || [];
    tasks.forEach(task => {
      if (task.status === 'completed' || task.status === 'cancelled') return;
      if (!task.deadline) return;
      const deadline = new Date(task.deadline);
      const diffHours = (deadline - now) / 36e5;
      const alreadyNotified = (data.notifications || []).some(
        n => n.type === 'deadline' && n.title === 'Deadline Tugas' && n.message.includes(task.title)
      );
      if (!alreadyNotified && diffHours > 0 && diffHours <= 24 && task.reminder) {
        this.send('Deadline Tugas', {
          type: 'deadline',
          message: `${task.title} akan deadline dalam ${Math.round(diffHours)} jam`,
        });
      }
    });
  }

  _dispatchEvent(notification) {
    const event = new CustomEvent('eduflow-notification', { detail: notification });
    window.dispatchEvent(event);
  }
}

export const notifier = new NotificationService();
