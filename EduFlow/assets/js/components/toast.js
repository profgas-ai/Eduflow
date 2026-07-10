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
  el.classList.remove('toast-undo');
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

export function showUndoToast(message, onUndo, duration = 5000) {
  const el = getOrCreateToast();
  el.classList.add('toast-undo');
  el.innerHTML = `<span>${message}</span><button class="btn btn-ghost btn-sm toast-undo-btn">Undo</button>`;
  el.classList.add('show');
  clearTimeout(timeoutId);
  const btn = el.querySelector('.toast-undo-btn');
  const cleanup = () => {
    el.classList.remove('show');
    btn.removeEventListener('click', handler);
  };
  const handler = () => { onUndo(); cleanup(); };
  btn.addEventListener('click', handler);
  timeoutId = setTimeout(cleanup, duration);
}
