import { BLACK, WHITE, applyAction, createInitialPosition, getResult } from './rules.js';
import { actionAt, bankSelection, boardSelection, setupActionAt } from './interaction.js';
import { createBoard, renderBoard, renderReserve } from './board-ui.js';
import { tutorialHighlights } from './tutorial.js';
import { difficultyDepth } from './settings.js';

/**
 * The lobby is a board, not a picture of one. A 4×4 game has no setup worth a
 * click, so landing on schness.com means you are already playing: put your
 * king on rank 1 and the game runs.
 *
 * It owns no rules and no search. Legality comes from `rules.js` through the
 * same `interaction.js` helpers every other surface uses, and Black is the
 * same `bot-worker.js` the match page runs — a second implementation of either
 * on the home page is how the two quietly start playing different games.
 *
 * The arena inherits whatever is on this board, which is what makes "take this
 * position further" a true sentence rather than a slogan.
 */
export function initLobbyBoard() {
  const root = document.querySelector('#lobby-play');
  if (!root) return;
  const $ = (selector) => root.querySelector(selector);
  const board = $('#lobby-board');
  const status = $('#lobby-status');
  const worker = new Worker('./src/bot-worker.js', { type: 'module' });

  let position = createInitialPosition();
  let selection = null;
  let thinking = false;
  let request = 0;

  createBoard(board, { onSquare: chooseSquare });
  worker.addEventListener('message', ({ data }) => {
    if (data.request !== request) return;
    thinking = false;
    if (data.action) position = applyAction(position, data.action);
    render();
  });
  $('#lobby-restart').addEventListener('click', () => {
    request += 1;
    thinking = false;
    position = createInitialPosition();
    selection = null;
    render();
  });
  // Carrying the board over is the whole point of the wording on that card.
  document.querySelector('#bot-arena')?.addEventListener('click', handOver);
  render();

  function handOver(event) {
    if (position.phase !== 'play') return;
    try {
      sessionStorage.setItem('schness-arena-position',
        JSON.stringify({ board: position.board, turn: position.turn }));
    } catch {
      return; // Private storage: the plain link still opens the arena.
    }
    event.preventDefault();
    window.location.assign('./watch.html?position=library');
  }

  function chooseSquare(square) {
    if (!canAct()) return;
    const action = position.phase === 'play'
      ? actionAt(position, selection, square)
      : setupActionAt(position, square);
    if (action) return play(action);
    const occupant = position.board[square];
    selection = occupant?.owner === WHITE ? boardSelection(square) : null;
    render();
  }

  function chooseReserve(piece) {
    if (!canAct() || position.phase !== 'play') return;
    selection = selection?.type === 'bank' && selection.piece === piece ? null : bankSelection(piece);
    render();
  }

  function play(action) {
    position = applyAction(position, action);
    selection = null;
    render();
    if (getResult(position)) return;
    thinking = true;
    request += 1;
    render();
    worker.postMessage({ position, depth: difficultyDepth('steady'), repetitionAversion: true, request });
  }

  function canAct() { return !thinking && position.turn === WHITE && !getResult(position); }

  function render() {
    const { targets, placements } = tutorialHighlights(position, selection);
    renderBoard(board, position, {
      selected: selection?.type === 'board' ? selection.square : null,
      targets,
      placements: canAct() ? placements : new Set(),
      disabled: !canAct(),
    });
    renderReserve($('#lobby-white-reserve'), position.banks[WHITE], WHITE, {
      interactive: true,
      selected: selection?.type === 'bank' ? selection.piece : null,
      disabled: !canAct() || position.phase !== 'play',
      onSelect: chooseReserve,
    });
    renderReserve($('#lobby-black-reserve'), position.banks[BLACK], BLACK);
    status.textContent = statusText();
  }

  function statusText() {
    const result = getResult(position);
    if (result?.type === 'win') return result.winner === WHITE ? 'You win by checkmate.' : 'Black wins by checkmate.';
    if (result) return 'A draw. Start again, or take it to the arena.';
    if (thinking) return 'Black is thinking…';
    if (position.phase !== 'play') return 'Place your king on rank 1 and the game runs.';
    return 'Your move.';
  }
}
