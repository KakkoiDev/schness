import test from 'node:test';
import assert from 'node:assert/strict';
import { BLACK, WHITE, applyAction, legalActions } from '../src/rules.js';
import { lessonPosition } from '../src/tutorial.js';

test('every tutorial opens as a legal position with White able to act', () => {
  for (const lesson of ['kings', 'deploy', 'capture']) {
    const position = lessonPosition(lesson);
    assert.equal(position.turn, WHITE);
    assert.ok(legalActions(position).length > 0, lesson);
  }
});

test('the capture tutorial demonstrates a piece returning to its owner', () => {
  const position = lessonPosition('capture');
  const capture = legalActions(position).find((action) => action.type === 'move' && action.from === 9 && action.to === 5);
  assert.ok(capture);
  const after = applyAction(position, capture);
  assert.ok(after.banks[BLACK].includes('knight'));
  assert.equal(after.board[5].owner, WHITE);
  assert.equal(after.board[5].piece, 'rook');
});
