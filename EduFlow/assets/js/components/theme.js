import { getData } from '../services/storage.js';

export function applySavedTheme() {
  const data = getData();
  const theme = data.user?.theme || data.settings?.theme || 'system';
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
