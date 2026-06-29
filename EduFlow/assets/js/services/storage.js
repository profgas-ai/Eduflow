import { CONFIG } from '../config/config.js';
import { createDummyData } from '../data/dummyData.js';

let dataCache = null;
let storageSuffix = '';
let syncCallback = null;

export function setStorageSuffix(suffix) {
  if (suffix === storageSuffix && dataCache) return;
  storageSuffix = suffix || '';
  dataCache = null;
}

function storageKey() {
  return CONFIG.STORAGE_KEY + (storageSuffix ? '_' + storageSuffix : '');
}

function idbStore(mode) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(storageKey(), 1);
    req.onupgradeneeded = () => req.result.createObjectStore('data', { keyPath: 'k' });
    req.onsuccess = () => resolve(req.result.transaction('data', mode).objectStore('data'));
    req.onerror = () => reject(req.error);
  });
}

function idbGet() {
  return idbStore('readonly').then(store => new Promise((resolve, reject) => {
    const r = store.get('main');
    r.onsuccess = () => resolve(r.result?.v);
    r.onerror = () => reject(r.error);
  })).catch(() => null);
}

function idbPut(val) {
  return idbStore('readwrite').then(store => new Promise((resolve, reject) => {
    const r = store.put({ k: 'main', v: val });
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  })).catch(() => {});
}

function idbRemove() {
  return idbStore('readwrite').then(store => new Promise((resolve, reject) => {
    const r = store.delete('main');
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  })).catch(() => {});
}

function idbClearAll() {
  return idbStore('readwrite').then(store => new Promise((resolve, reject) => {
    const r = store.clear();
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  })).catch(() => {});
}

async function loadFromIDB() {
  const raw = await idbGet();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function loadData() {
  if (dataCache) return dataCache;

  let data = await loadFromIDB();
  if (data) {
    dataCache = data;
    localStorage.setItem(storageKey(), JSON.stringify(data));
    return data;
  }

  let raw;
  try { raw = localStorage.getItem(storageKey()); } catch { raw = null; }

  if (raw) {
    try {
      data = JSON.parse(raw);
      dataCache = data;
      idbPut(raw);
      return data;
    } catch { raw = null; }
  }

  const seed = createDummyData();
  dataCache = seed;
  const json = JSON.stringify(seed);
  localStorage.setItem(storageKey(), json);
  idbPut(json);
  return seed;
}

export function saveData(data) {
  dataCache = data;
  const json = JSON.stringify(data);
  try { localStorage.setItem(storageKey(), json); } catch {}
  idbPut(json);
  return true;
}

export function getData() {
  if (!dataCache) {
    try {
      const raw = localStorage.getItem(storageKey());
      if (raw) { dataCache = JSON.parse(raw); return dataCache; }
    } catch {}
    dataCache = createDummyData();
    return dataCache;
  }
  return dataCache;
}

export function persist() {
  if (dataCache) {
    const ret = saveData(dataCache);
    if (syncCallback) syncCallback(dataCache);
    showSaveIndicator();
    return ret;
  }
  return false;
}

function showSaveIndicator() {
  let el = document.getElementById('saveIndicator');
  if (!el) {
    el = document.createElement('div');
    el.id = 'saveIndicator';
    el.style.cssText = 'position:fixed;bottom:5rem;left:50%;transform:translateX(-50%);background:var(--surface-container-high);color:var(--on-surface);padding:0.35rem 0.85rem;border-radius:20px;font-size:12px;font-weight:500;box-shadow:0 2px 8px rgba(0,0,0,0.1);z-index:9999;transition:opacity 0.3s;pointer-events:none';
    el.textContent = 'Tersimpan';
    document.body.appendChild(el);
  }
  el.style.opacity = '1';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.opacity = '0'; }, 1500);
}

export function setSyncCallback(fn) {
  syncCallback = fn;
}

export async function loadFromRemote(loaderFn) {
  const remote = await loaderFn();
  if (remote) {
    dataCache = remote;
    saveData(remote);
    return remote;
  }
  return null;
}

export async function exportData() {
  const data = getData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eduflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.user || !data.subjects) throw new Error('Format data tidak valid');
    saveData(data);
    dataCache = data;
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}

export async function clearData() {
  localStorage.removeItem(storageKey());
  await idbClearAll();
  dataCache = null;
}

export async function getStorageInfo() {
  const data = getData();
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json).length;
  return { keys: Object.keys(data).length, subjects: data.subjects.length, tasks: data.tasks.length, sizeBytes: bytes, sizeKB: (bytes / 1024).toFixed(1) };
}
