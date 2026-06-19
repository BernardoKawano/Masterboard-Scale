/** Drag-and-drop do kanban comercial (estágios do pipeline). */

const DRAG_THRESHOLD_PX = 5;

export function shouldStartKanbanDrag(deltaX, deltaY, threshold = DRAG_THRESHOLD_PX) {
  return Math.hypot(deltaX, deltaY) >= threshold;
}

export function resolveKanbanDropStage(target, fallback = '') {
  const column = target?.closest?.('[data-pipeline-stage]');
  return column?.dataset?.pipelineStage || fallback;
}

export function isKanbanDragHandle(target) {
  return Boolean(target?.closest?.('.kanban-drag-handle'));
}

/**
 * Arrastar pelo topo do card; clique no corpo abre o drawer.
 */
export function bindKanbanBoard(board, { onMove, onOpen } = {}) {
  if (!board || board.dataset.kanbanBound === '1') return;
  board.dataset.kanbanBound = '1';

  let pointerDrag = null;
  let suppressCardClick = false;

  const clearDropTargets = () => {
    board.querySelectorAll('.kanban-col.drop-target').forEach((col) => col.classList.remove('drop-target'));
  };

  const finishPointerDrag = (event) => {
    if (!pointerDrag) return;
    pointerDrag.card.classList.remove('dragging');
    clearDropTargets();

    if (pointerDrag.moved) {
      suppressCardClick = true;
      const stage = resolveKanbanDropStage(document.elementFromPoint(event.clientX, event.clientY));
      if (stage && stage !== pointerDrag.fromStage && typeof onMove === 'function') {
        onMove(pointerDrag.leadId, stage);
      }
    }

    pointerDrag = null;
  };

  board.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest('.kanban-drag-handle');
    if (!handle || event.button !== 0) return;

    const card = handle.closest('.kanban-card');
    if (!card) return;

    pointerDrag = {
      card,
      leadId: card.dataset.leadId,
      fromStage: card.closest('[data-pipeline-stage]')?.dataset?.pipelineStage || '',
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      pointerId: event.pointerId,
    };
    handle.setPointerCapture(event.pointerId);
  });

  board.addEventListener('pointermove', (event) => {
    if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
    const deltaX = event.clientX - pointerDrag.startX;
    const deltaY = event.clientY - pointerDrag.startY;
    if (!pointerDrag.moved && shouldStartKanbanDrag(deltaX, deltaY)) {
      pointerDrag.moved = true;
      pointerDrag.card.classList.add('dragging');
    }
    if (!pointerDrag.moved) return;

    clearDropTargets();
    const stage = resolveKanbanDropStage(document.elementFromPoint(event.clientX, event.clientY));
    if (stage) {
      board.querySelector(`[data-pipeline-stage="${stage}"]`)?.classList.add('drop-target');
    }
    event.preventDefault();
  });

  board.addEventListener('pointerup', finishPointerDrag);
  board.addEventListener('pointercancel', finishPointerDrag);

  board.addEventListener('click', (event) => {
    if (suppressCardClick) {
      suppressCardClick = false;
      return;
    }
    const body = event.target.closest('.kanban-card-body');
    if (!body) return;
    const card = body.closest('.kanban-card');
    if (card && typeof onOpen === 'function') onOpen(card.dataset.leadId);
  });

  board.querySelectorAll('.kanban-drag-handle').forEach((handle) => {
    handle.addEventListener('dragstart', (event) => {
      const card = handle.closest('.kanban-card');
      if (!card) return;
      card.classList.add('dragging');
      event.dataTransfer?.setData('text/plain', card.dataset.leadId || '');
      event.dataTransfer?.setData(
        'application/x-pipeline-stage',
        card.closest('[data-pipeline-stage]')?.dataset?.pipelineStage || '',
      );
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    });
    handle.addEventListener('dragend', () => {
      handle.closest('.kanban-card')?.classList.remove('dragging');
      clearDropTargets();
    });
  });

  board.querySelectorAll('.kanban-col').forEach((column) => {
    column.addEventListener('dragover', (event) => {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      column.classList.add('drop-target');
    });
    column.addEventListener('dragleave', (event) => {
      if (!column.contains(event.relatedTarget)) column.classList.remove('drop-target');
    });
    column.addEventListener('drop', (event) => {
      event.preventDefault();
      column.classList.remove('drop-target');
      const leadId = event.dataTransfer?.getData('text/plain');
      const fromStage = event.dataTransfer?.getData('application/x-pipeline-stage');
      const toStage = column.dataset.pipelineStage;
      if (leadId && toStage && toStage !== fromStage && typeof onMove === 'function') {
        onMove(leadId, toStage);
      }
    });
  });
}

export function resetKanbanBoard(board) {
  if (!board) return;
  delete board.dataset.kanbanBound;
}
