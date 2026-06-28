let toastEl = null;
let timeoutId = null;

function getOrCreateToast() {
  if (!toastEl || !document.body.contains(toastEl)) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  return toastEl;
}

export function showToast(message, duration = 2000) {
  const el = getOrCreateToast();
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => el.classList.remove('show'), duration);
}

export function showSuccess(message) {
  showToast('✓ ' + message);
}

export function showError(message) {
  showToast('✕ ' + message, 3000);
}
