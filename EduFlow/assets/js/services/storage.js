import { CONFIG } from '../config/config.js';
import { createDummyData } from '../data/dummyData.js';

let dataCache = null;

export function loadData() {
  if (dataCache) return dataCache;

  let raw;
  try {
    raw = localStorage.getItem(CONFIG.STORAGE_KEY);
  } catch {
    raw = null;
  }

  if (!raw) {
    const seed = createDummyData();
    saveData(seed);
    dataCache = seed;
    return seed;
  }

  try {
    dataCache = JSON.parse(raw);
    return dataCache;
  } catch {
    const seed = createDummyData();
    saveData(seed);
    dataCache = seed;
    return seed;
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    dataCache = data;
    return true;
  } catch {
    console.warn('Failed to save data to localStorage');
    return false;
  }
}

export function getData() {
  if (!dataCache) return loadData();
  return dataCache;
}

export function persist() {
  if (dataCache) {
    return saveData(dataCache);
  }
  return false;
}

export function exportData() {
  const data = getData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eduflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.user || !data.subjects) {
      throw new Error('Format data tidak valid');
    }
    saveData(data);
    dataCache = data;
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}

export function clearData() {
  localStorage.removeItem(CONFIG.STORAGE_KEY);
  dataCache = null;
}

export function getStorageInfo() {
  const data = getData();
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json).length;
  return {
    keys: Object.keys(data).length,
    subjects: data.subjects.length,
    tasks: data.tasks.length,
    sizeBytes: bytes,
    sizeKB: (bytes / 1024).toFixed(1),
  };
}
