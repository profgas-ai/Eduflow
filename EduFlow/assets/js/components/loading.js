const skeletons = new Map();

export function showBtnLoading(btn, text) {
  if (!btn || btn.disabled) return;
  btn._origText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-sm"></span> ${text || 'Memproses...'}`;
}

export function hideBtnLoading(btn) {
  if (!btn) return;
  btn.disabled = false;
  if (btn._origText) btn.innerHTML = btn._origText;
}

export function showSkeleton(container, count = 3, type = 'card') {
  if (!container) return;
  const id = container.id || container.className || Math.random().toString(36);
  if (skeletons.has(id)) return;
  container._origHTML = container.innerHTML;
  const cards = Array.from({ length: count }, () =>
    type === 'card'
      ? '<div class="skeleton-card"><div class="skeleton-line w-60"></div><div class="skeleton-line w-40"></div><div class="skeleton-line w-80"></div></div>'
      : '<div class="skeleton-row"><div class="skeleton-line w-30"></div><div class="skeleton-line w-50"></div></div>'
  ).join('');
  container.innerHTML = `<div class="skeleton-wrapper">${cards}</div>`;
  skeletons.set(id, true);
}

export function hideSkeleton(container) {
  if (!container) return;
  const id = container.id || container.className || Math.random().toString(36);
  skeletons.delete(id);
  if (container._origHTML) {
    container.innerHTML = container._origHTML;
    delete container._origHTML;
  }
}
