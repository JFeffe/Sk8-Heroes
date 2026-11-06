export function bindDrag(root, {enabled, diceSelection, onDrop}) {
  let drag = null, suppressClick = false;
  function clear() {
    if (!drag) return;
    const previous = drag;
    drag = null;
    previous.ghost?.remove();
    previous.source.classList.remove('drag-source');
    root.querySelectorAll('.drop-ready,.drop-over').forEach(el => el.classList.remove('drop-ready', 'drop-over'));
    if (previous.source.hasPointerCapture(previous.pointerId)) previous.source.releasePointerCapture(previous.pointerId);
  }
  function targetAt(x, y) {
    const el = document.elementFromPoint(x, y)?.closest('[data-drop].drop-ready');
    return el?.classList.contains('drop-ready') ? el : null;
  }
  root.addEventListener('dragstart', e => e.preventDefault());
  root.addEventListener('pointerdown', e => {
    const source = e.target.closest('[data-drag]');
    if (!source || source.disabled || e.button !== 0 || !e.isPrimary || !enabled()) return;
    clear();
    suppressClick = false;
    const kind = source.dataset.drag, id = source.dataset.id;
    drag = {source, kind, id, pointerId: e.pointerId, x: e.clientX, y: e.clientY, indices: kind === 'die' ? diceSelection(Number(id)) : []};
    source.setPointerCapture(e.pointerId);
  });
  root.addEventListener('pointermove', e => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7) return;
    e.preventDefault();
    if (!drag.ghost) {
      const box = drag.source.getBoundingClientRect();
      drag.ghost = drag.source.cloneNode(true);
      drag.ghost.classList.add('drag-ghost');
      drag.ghost.setAttribute('aria-hidden', 'true');
      drag.ghost.style.width = `${box.width}px`;
      drag.ghost.style.height = `${box.height}px`;
      drag.source.parentElement.append(drag.ghost);
      drag.source.classList.add('drag-source');
      root.querySelectorAll('[data-drop]').forEach(el => {
        if ((drag.kind === 'card' && ['combo', 'hand'].includes(el.dataset.drop)) || (drag.kind === 'die' && ['trick', 'dice'].includes(el.dataset.drop))) el.classList.add('drop-ready');
      });
    }
    drag.ghost.style.left = `${e.clientX + 12}px`;
    drag.ghost.style.top = `${e.clientY + 12}px`;
    root.querySelector('.drop-over')?.classList.remove('drop-over');
    targetAt(e.clientX, e.clientY)?.classList.add('drop-over');
  });
  root.addEventListener('pointerup', e => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    const payload = drag, target = drag.ghost && targetAt(e.clientX, e.clientY);
    if (drag.ghost) {
      e.preventDefault();
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    clear();
    if (target) onDrop(payload, target.dataset);
  });
  root.addEventListener('click', e => {
    if (suppressClick) { e.preventDefault(); e.stopImmediatePropagation(); suppressClick = false; }
  }, true);
  root.addEventListener('pointercancel', clear);
  root.addEventListener('lostpointercapture', clear);
  window.addEventListener('blur', clear);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') clear(); });
  return clear;
}
