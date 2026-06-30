export function formatDate(date, format = 'medium') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    medium: { day: '2-digit', month: 'short', year: 'numeric' },
    long: { day: '2-digit', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  };

  try {
    return d.toLocaleDateString('id-ID', options[format] || options.medium);
  } catch {
    return d.toLocaleDateString('id-ID');
  }
}

export function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date) {
  return `${formatDate(date, 'medium')} ${formatTime(date)}`;
}

export function formatTimeLeft(dueIso) {
  if (!dueIso) return { text: '', urgent: false };
  const now = new Date();
  const due = new Date(dueIso);
  const diffMs = due - now;

  if (diffMs <= 0) return { text: 'Lewat tenggat', urgent: true };

  const hours = Math.floor(diffMs / 36e5);
  const minutes = Math.floor((diffMs % 36e5) / 60000);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return { text: `${days} hari lagi`, urgent: days <= 2 };
  }
  if (hours > 0) {
    return { text: `${hours}j ${minutes}m lagi`, urgent: true };
  }
  return { text: `${minutes} menit lagi`, urgent: true };
}

export function formatDuration(start, end) {
  if (!start || !end) return '';
  const s = new Date(`2000-01-01T${start}`);
  const e = new Date(`2000-01-01T${end}`);
  const diff = (e - s) / 36e5;
  return `${diff} jam`;
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatPercentage(value) {
  return `${Math.round(value)}%`;
}

export function formatSKS(sks) {
  return `${sks} SKS`;
}

export function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}
