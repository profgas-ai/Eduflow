let toastEl = null;
let timeoutId = null;

const ICONS = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px;flex-shrink:0"><path d="M20 6L9 17l-5-5"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px;flex-shrink:0"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
};

function getOrCreateToast() {
  if (!toastEl || !document.body.contains(toastEl)) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  return toastEl;
}

export function showToast(message, duration = 2500) {
  const el = getOrCreateToast();
  el.classList.remove('toast-undo', 'toast-success', 'toast-error');
  el.innerHTML = `<span>${message}</span>`;
  el.classList.add('show');
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => el.classList.remove('show'), duration);
}

export function showSuccess(message) {
  const el = getOrCreateToast();
  el.classList.remove('toast-undo', 'toast-error');
  el.classList.add('toast-success');
  el.innerHTML = `${ICONS.success}<span>${message}</span>`;
  el.classList.add('show');
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => el.classList.remove('show'), 2500);
}

export function showError(message) {
  const el = getOrCreateToast();
  el.classList.remove('toast-undo', 'toast-success');
  el.classList.add('toast-error');
  el.innerHTML = `${ICONS.error}<span>${message}</span>`;
  el.classList.add('show');
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => el.classList.remove('show'), 3500);
}

export function showUndoToast(message, onUndo, duration = 5000) {
  const el = getOrCreateToast();
  el.classList.remove('toast-success', 'toast-error');
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
  return cleanup;
}
