import { squareName } from './notation.js';

function describeAction(action) {
  return action.type === 'drop' ? `${action.piece} to ${squareName(action.to)}`
    : `${squareName(action.from)}→${squareName(action.to)}`;
}

/** Independent disposable search: a new board position kills the old worker. */
export function attachAnalysis({ toggles, bar, fill, scoreLabel, warning, getPosition, enabled, showRisks = () => false }) {
  let worker;
  let timeout;
  let queued;
  let request = 0;
  function stop() {
    clearTimeout(timeout);
    clearTimeout(queued);
    worker?.terminate();
    worker = null;
  }
  function refresh() {
    stop();
    const mate = Boolean(toggles.mate?.checked && enabled());
    const advantage = Boolean(toggles.advantage?.checked && enabled());
    bar.hidden = !advantage;
    scoreLabel.hidden = !advantage;
    warning.hidden = !mate;
    if (!mate && !advantage) return;
    const position = getPosition();
    const current = ++request;
    scoreLabel.textContent = advantage ? 'Analyzing…' : '';
    warning.textContent = mate ? 'Checking both sides for forced mates…' : '';
    warning.dataset.state = 'searching';
    let mateResolved = false;
    let checkedDepth = 0;
    let riskText = '';
    // The display must never claim no mate on timeout or worker failure.
    queued = setTimeout(() => {
      worker = new Worker('./src/analysis-worker.js?v=71', { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (data.request !== current) return;
        if (data.kind === 'advantage') {
          const score = data.score;
          const percent = Number.isFinite(score) ? Math.max(8, Math.min(92, 50 + 42 * Math.tanh(score / 550))) : 50;
          fill.style.height = `${percent}%`;
          bar.setAttribute('aria-valuenow', String(Math.round(percent * 2 - 100)));
          scoreLabel.textContent = Math.abs(score) >= 1_000_000
            ? (score > 0 ? 'White has mate' : 'Black has mate')
            : `${score > 0 ? 'White' : score < 0 ? 'Black' : 'Even'} advantage · ${Math.abs(score / 100).toFixed(1)} (estimate)`;
          bar.setAttribute('aria-valuetext', scoreLabel.textContent);
        } else if (data.kind === 'mate') {
          mateResolved = true;
          const result = data.result;
          warning.dataset.state = result?.kind === 'threat' ? 'danger' : result ? 'opportunity' : riskText ? 'caution' : 'clear';
          warning.textContent = result?.kind === 'threat'
            ? `Danger: ${result.side === 'white' ? 'White' : 'Black'} can force mate in ${result.moves} despite every defense.`
            : result ? `${result.side === 'white' ? 'White' : 'Black'} can force mate in ${result.moves}.`
              : riskText || 'No forced mate within four moves for either side.';
        } else if (data.kind === 'risk' && !mateResolved && !riskText) {
          const samples = data.actions.slice(0, 3).map(describeAction).join(', ');
          riskText = `Caution: ${data.actions.length} move${data.actions.length === 1 ? '' : 's'} allow an opponent mate in ${data.depth}: ${samples}${data.actions.length > 3 ? '…' : ''}.`;
          warning.dataset.state = 'caution';
          warning.textContent = riskText;
        } else if (data.kind === 'progress') {
          checkedDepth = data.depth;
        } else if (data.kind === 'error') {
          warning.textContent = 'Analysis unavailable.';
          warning.dataset.state = 'error';
          scoreLabel.textContent = 'Unavailable';
        }
      };
      worker.onerror = () => {
        warning.textContent = 'Analysis unavailable.';
        warning.dataset.state = 'error';
        scoreLabel.textContent = 'Unavailable';
        stop();
      };
      worker.postMessage({ position, mate, advantage, risks: showRisks(), request: current });
      timeout = setTimeout(() => {
        if (mate && !mateResolved) {
          warning.textContent = `${riskText ? `${riskText} ` : ''}Mate search incomplete beyond ${checkedDepth} move${checkedDepth === 1 ? '' : 's'} (time limit).`;
          warning.dataset.state = riskText ? 'caution' : 'searching';
        }
        if (advantage && scoreLabel.textContent === 'Analyzing…') scoreLabel.textContent = 'Evaluation incomplete';
        worker?.terminate(); worker = null;
      }, 5000);
    }, 120);
  }
  for (const toggle of Object.values(toggles)) toggle?.addEventListener('change', refresh);
  return { refresh, stop };
}
