import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  resolveKanbanDropStage,
  shouldStartKanbanDrag,
} from '../lib/dashboard-kanban.mjs';

test('detecta início de arraste no kanban', () => {
  assert.equal(shouldStartKanbanDrag(2, 2), false);
  assert.equal(shouldStartKanbanDrag(10, 0), true);
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
