/** Independent disposable search: a new board position kills the old worker. */
export function attachAnalysis({ toggles, bar, fill, scoreLabel, warning, getPosition, enabled }) {
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
    warning.hidden = !mate;
    if (!mate && !advantage) return;
    const position = getPosition();
    const current = ++request;
    scoreLabel.textContent = advantage ? 'Analyzing…' : '';
    warning.textContent = mate ? 'Checking for forced mates…' : '';
    // The display must never claim no mate on timeout or worker failure.
    queued = setTimeout(() => {
      worker = new Worker('./src/analysis-worker.js', { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (data.request !== current) return;
        if (data.kind === 'advantage') {
          const score = data.score;
          const percent = Number.isFinite(score) ? Math.max(8, Math.min(92, 50 + 42 * Math.tanh(score / 550))) : 50;
          fill.style.height = `${percent}%`;
          scoreLabel.textContent = Math.abs(score) >= 1_000_000
            ? (score > 0 ? 'White mate' : 'Black mate')
            : `${score > 0 ? 'White' : score < 0 ? 'Black' : 'Even'} · ${Math.abs(score / 100).toFixed(1)}`;
        } else if (data.kind === 'mate') {
          warning.textContent = data.moves
            ? `${data.side === 'white' ? 'White' : 'Black'} can force mate in ${data.moves}.`
            : 'No forced mate found within four moves.';
        } else if (data.kind === 'error') {
          warning.textContent = 'Analysis unavailable.';
          scoreLabel.textContent = 'Unavailable';
        }
      };
      worker.onerror = () => {
        warning.textContent = 'Analysis unavailable.';
        scoreLabel.textContent = 'Unavailable';
        stop();
      };
      worker.postMessage({ position, mate, advantage, request: current });
      timeout = setTimeout(() => {
        if (mate && warning.textContent === 'Checking for forced mates…') warning.textContent = 'Mate search incomplete (time limit).';
        worker?.terminate(); worker = null;
      }, 5000);
    }, 120);
  }
  for (const toggle of Object.values(toggles)) toggle?.addEventListener('change', refresh);
  return { refresh, stop };
}
