import test from 'node:test';
import assert from 'node:assert/strict';
import { attachAnalysis } from '../src/analysis-ui.js';

test('advantage clears stale values, rejects cancelled replies, and distinguishes unknown from even', (t) => {
  const timers = new Map();
  let id = 0;
  const workers = [];
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    timers.set(++id, { callback, delay });
    return id;
  });
  t.mock.method(globalThis, 'clearTimeout', (key) => timers.delete(key));
  const originalWorker = Object.getOwnPropertyDescriptor(globalThis, 'Worker');
  t.after(() => {
    if (originalWorker) Object.defineProperty(globalThis, 'Worker', originalWorker);
    else delete globalThis.Worker;
  });
  globalThis.Worker = class {
    constructor() { workers.push(this); }
    postMessage(message) { this.message = message; }
    terminate() { this.terminated = true; }
    reply(score) { this.onmessage({ data: { kind: 'advantage', request: this.message.request, score } }); }
  };
  const attrs = new Map([['aria-valuenow', '70']]);
  const bar = { dataset: {}, setAttribute: (key, value) => attrs.set(key, value), removeAttribute: (key) => attrs.delete(key) };
  const fill = { style: { height: '85%' } };
  const toggle = { checked: true, addEventListener() {} };
  const scoreLabel = {};
  const analysis = attachAnalysis({ toggles: { advantage: toggle }, bar, fill,
    scoreLabel, warning: { dataset: {} }, getPosition: () => ({}), enabled: () => true });
  const startWorker = () => {
    const entry = [...timers].find(([, value]) => value.delay === 120);
    timers.delete(entry[0]);
    entry[1].callback();
  };
  analysis.refresh();
  assert.equal(bar.dataset.state, 'pending');
  assert.equal(fill.style.height, '50%');
  assert.equal(attrs.has('aria-valuenow'), false);
  assert.equal(attrs.get('aria-busy'), 'true');
  startWorker();
  const first = workers[0];
  first.reply(550);
  assert.equal(bar.dataset.state, 'ready');
  assert.ok(parseFloat(fill.style.height) > 50);
  analysis.refresh();
  first.reply(-550);
  assert.equal(bar.dataset.state, 'pending');
  assert.equal(fill.style.height, '50%');
  startWorker();
  workers[1].reply(NaN);
  assert.equal(bar.dataset.state, 'unavailable');
  assert.equal(attrs.has('aria-valuenow'), false);
  analysis.refresh();
  startWorker();
  workers[2].reply(0);
  assert.equal(bar.dataset.state, 'ready');
  assert.equal(attrs.get('aria-valuenow'), '0');
  toggle.checked = false;
  analysis.refresh();
  workers[2].reply(550);
  assert.equal(bar.dataset.state, 'off');
  assert.equal(attrs.has('aria-valuenow'), false);
  analysis.stop();
});
