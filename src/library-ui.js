import { applyAction, BLACK, createInitialPosition, WHITE } from './rules.js';
import { recordAction } from './history.js';
import { decodeAction, matchesFilters, profilePairs, resultLabel } from './library.js';
import { renderReserve } from './piece-ui.js';
import { createBoard, renderBoard } from './board-ui.js';
import { initTheme } from './theme.js';
import { initI18n } from './i18n.js?v=71';
import { attachAnalysis } from './analysis-ui.js?v=71';

initTheme();
initI18n();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));

const $ = (selector) => document.querySelector(selector);
const PAGE_SIZE = 60;
let library;
let filtered = [];
let shown = PAGE_SIZE;
let currentGame;
let timeline = [];
let history = [];
let ply = 0;
let autoplay = false;
let timer;
const replayAnalysis = attachAnalysis({
  toggles: { advantage: $('#replay-advantage') }, bar: $('#replay-bar'), fill: $('#replay-fill'),
  scoreLabel: $('#replay-score'), warning: $('#replay-warning'),
  getPosition: () => timeline[ply], enabled: () => Boolean(currentGame && timeline[ply]?.phase === 'play'),
});

buildBoard();
bindControls();
loadLibrary();

async function loadLibrary() {
  const response = await fetch('./data/games.json');
  if (!response.ok) throw new Error(`Could not load games (${response.status})`);
  library = await response.json();
  const profiles = [...new Set(library.games.flatMap(profilePairs).flatMap((pair) => pair.split(' vs ')))].sort();
  for (const id of ['#filter-white', '#filter-black']) {
    $(id).append(...profiles.map((profile) => new Option(profile, profile)));
  }
  const decisive = library.games.filter((game) => game.result === 'w' || game.result === 'b').length;
  const average = library.games.reduce((sum, game) => sum + game.plies, 0) / library.uniqueGames;
  $('#stat-unique').textContent = library.uniqueGames.toLocaleString();
  $('#stat-records').textContent = library.records.toLocaleString();
  $('#stat-decisions').textContent = `${Math.round(decisive / library.uniqueGames * 100)}%`;
  $('#stat-length').textContent = average.toFixed(1);
  $('#library-summary').textContent = `${library.duplicatesRemoved.toLocaleString()} repeated records collapsed by exact move sequence.`;
  applyFilters();
}

function bindControls() {
  $('.library-filters').addEventListener('change', applyFilters);
  $('#load-more').addEventListener('click', () => { shown += PAGE_SIZE; renderList(); });
  $('#replay-close').addEventListener('click', () => $('#replay-dialog').close());
  $('#replay-first').addEventListener('click', () => { pause(); ply = 0; renderReplay(); });
  $('#replay-previous').addEventListener('click', () => { pause(); ply = Math.max(0, ply - 1); renderReplay(); });
  $('#replay-next').addEventListener('click', next);
  $('#replay-auto').addEventListener('click', () => {
    autoplay = !autoplay;
    $('#replay-auto').textContent = autoplay ? 'Pause' : 'Auto · 1s';
    $('#replay-auto').setAttribute('aria-pressed', String(autoplay));
    if (autoplay) next(); else clearTimeout(timer);
  });
  $('#replay-dialog').addEventListener('close', () => { pause(); replayAnalysis.stop(); });
  $('#replay-play-here').addEventListener('click', () => {
    sessionStorage.setItem('schness-arena-position', JSON.stringify(timeline[ply]));
    window.location.assign('./watch.html?position=library');
  });
}

function applyFilters() {
  if (!library) return;
  shown = PAGE_SIZE;
  const filters = {
    white: $('#filter-white').value, black: $('#filter-black').value,
    result: $('#filter-result').value, version: $('#filter-version').value,
  };
  filtered = library.games.filter((game) => matchesFilters(game, filters));
  renderList();
}

function renderList() {
  $('#filter-count').textContent = `${filtered.length.toLocaleString()} unique ${filtered.length === 1 ? 'game' : 'games'}`;
  $('#game-list').replaceChildren(...filtered.slice(0, shown).map(gameCard));
  $('#load-more').hidden = shown >= filtered.length;
}

function gameCard(game) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'library-game';
  const pairs = profilePairs(game);
  const engines = pairs.length <= 2 ? pairs.join(' · ') : `${pairs[0]} · +${pairs.length - 1} configurations`;
  const id = document.createElement('span');
  id.className = 'library-game-id';
  id.textContent = `#${game.id}`;
  const result = document.createElement('strong');
  result.textContent = resultLabel(game.result);
  const matchup = document.createElement('span');
  matchup.textContent = engines;
  const length = document.createElement('small');
  length.textContent = `${game.plies} plies · ${Math.ceil(game.plies / 2)} moves${game.sources.length > 1 ? ` · seen ${game.sources.length}×` : ''}`;
  button.append(id, result, matchup, length);
  button.addEventListener('click', () => openReplay(game));
  return button;
}

function openReplay(game) {
  currentGame = game;
  timeline = [createInitialPosition()];
  history = [];
  for (const encoded of game.actions) {
    const before = timeline.at(-1);
    const action = decodeAction(encoded);
    const after = applyAction(before, action);
    history = recordAction(history, before, action, after);
    timeline.push(after);
  }
  ply = 0;
  $('#replay-title').textContent = `Game #${game.id}`;
  $('#replay-meta').textContent = `${resultLabel(game.result)} · ${game.plies} plies · seen ${game.sources.length}×`;
  $('#replay-sources').replaceChildren(...game.sources.map(([run, index, white, black]) => {
    const p = document.createElement('p');
    p.textContent = `Run ${run}, game ${index + 1}: ${white} vs ${black}`;
    return p;
  }));
  $('#replay-moves').replaceChildren(...history.map((entry, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${entry.ply}. ${entry.notation}`;
    button.addEventListener('click', () => { pause(); ply = index + 1; renderReplay(); });
    return button;
  }));
  renderReplay();
  $('#replay-dialog').showModal();
}

function next() {
  if (ply >= history.length) return pause();
  ply += 1;
  renderReplay();
  if (autoplay && ply < history.length) timer = setTimeout(next, 1000);
  else if (ply >= history.length) pause();
}

function pause() {
  autoplay = false;
  clearTimeout(timer);
  $('#replay-auto').textContent = 'Auto · 1s';
  $('#replay-auto').setAttribute('aria-pressed', 'false');
}

function buildBoard() {
  createBoard($('#replay-board'), { interactive: false });
}

function renderReplay() {
  replayAnalysis.refresh();
  const position = timeline[ply];
  const last = history[ply - 1]?.action;
  renderBoard($('#replay-board'), position, { last });
  renderPlayer('#replay-white', 'White', position.banks[WHITE]);
  renderPlayer('#replay-black', 'Black', position.banks[BLACK]);
  $('#replay-status').textContent = ply === 0 ? 'Starting position' : ply === history.length ? resultLabel(currentGame.result) : `Ply ${ply} of ${history.length} · ${history[ply - 1].sentence}`;
  $('#replay-first').disabled = ply === 0;
  $('#replay-previous').disabled = ply === 0;
  $('#replay-next').disabled = ply === history.length;
  $('#replay-play-here').disabled = position.phase !== 'play';
  for (const [index, button] of [...$('#replay-moves').children].entries()) button.classList.toggle('current', index + 1 === ply);
  $('#replay-moves').querySelector('.current')?.scrollIntoView({ block: 'nearest' });
}

function renderPlayer(selector, label, reserve) {
  const pairs = profilePairs(currentGame).map((pair) => pair.split(' vs '));
  const index = label === 'White' ? 0 : 1;
  const engines = [...new Set(pairs.map((pair) => pair[index]))].join(' / ');
  $(selector).textContent = `${label} · ${engines}`;
  const owner = label === 'White' ? WHITE : BLACK;
  $(`#replay-${owner}-label`).textContent = `${label} reserve · ${reserve.length}`;
  renderReserve($(`#replay-${owner}-reserve`), reserve, owner);
}
