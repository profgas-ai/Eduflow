import { getData, persist } from './storage.js';
import { generateId } from '../utils/helper.js';

export function pushActivity(type, label, details = '') {
  const data = getData();
  data.activities = data.activities || [];
  data.activities.unshift({
    id: generateId(),
    type,
    label,
    details,
    timestamp: new Date().toISOString(),
  });
  if (data.activities.length > 50) data.activities.length = 50;
  persist();
}

export function getRecentActivities(limit = 10) {
  const data = getData();
  return (data.activities || []).slice(0, limit);
}

export function clearActivities() {
  const data = getData();
  data.activities = [];
  persist();
}
