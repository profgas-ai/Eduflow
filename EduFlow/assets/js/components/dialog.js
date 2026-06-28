import { createModal, openModal, closeModal } from './modal.js';

let dialogResolve = null;

export function showDialog(options) {
  const {
    title = 'Konfirmasi',
    message = '',
    confirmText = 'Ya',
    cancelText = 'Batal',
    variant = 'default',
    danger = false,
  } = options;

  const id = 'dialog-' + Date.now();
  const backdrop = createModal(id, `
    <div class="dialog">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="dialog-actions">
        <button class="btn btn-ghost dialog-cancel">${cancelText}</button>
        <button class="btn ${danger ? 'btn-error' : 'btn-primary'} dialog-confirm">${confirmText}</button>
      </div>
    </div>
  `);

  return new Promise((resolve) => {
    dialogResolve = resolve;
    backdrop.querySelector('.dialog-cancel').addEventListener('click', () => {
      closeModal(id);
      resolve(false);
    });
    backdrop.querySelector('.dialog-confirm').addEventListener('click', () => {
      closeModal(id);
      resolve(true);
    });
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(id);
        resolve(false);
      }
    });
    openModal(id);
  });
}
