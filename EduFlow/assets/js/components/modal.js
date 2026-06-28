export function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    const firstInput = el.querySelector('input, select, textarea, button');
    if (firstInput) firstInput.focus();
  }
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
  }
}

export function setupModalBackdropClose() {
  document.addEventListener('click', (e) => {
    const backdrop = e.target.closest('.modal-backdrop.open');
    if (backdrop && !e.target.closest('.modal')) {
      backdrop.classList.remove('open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(el => {
        el.classList.remove('open');
        el.setAttribute('aria-hidden', 'true');
      });
    }
  });
}

export function createModal(id, content) {
  const existing = document.getElementById(id);
  if (existing) return existing;

  const backdrop = document.createElement('div');
  backdrop.id = id;
  backdrop.className = 'modal-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = content;
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  return backdrop;
}
