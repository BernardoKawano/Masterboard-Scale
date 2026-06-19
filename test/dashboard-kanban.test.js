import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isKanbanDragHandle,
  resolveKanbanDropStage,
  shouldStartKanbanDrag,
} from '../lib/dashboard-kanban.mjs';

test('detecta início de arraste no kanban', () => {
  assert.equal(shouldStartKanbanDrag(2, 2), false);
  assert.equal(shouldStartKanbanDrag(10, 0), true);
});

test('identifica alça de arraste do card', () => {
  const handle = { closest: (sel) => (sel === '.kanban-drag-handle' ? handle : null) };
  const body = { closest: (sel) => (sel === '.kanban-drag-handle' ? null : null) };
  assert.equal(isKanbanDragHandle(handle), true);
  assert.equal(isKanbanDragHandle(body), false);
});

test('resolve coluna de destino pelo data-pipeline-stage', () => {
  const card = {
    closest(selector) {
      if (selector === '[data-pipeline-stage]') {
        return { dataset: { pipelineStage: 'negociacao' } };
      }
      return null;
    },
  };
  assert.equal(resolveKanbanDropStage(card), 'negociacao');
});
