// Reference-page chrome: a theme toggle and nothing else.
// The app owns theme persistence in src/theme.js; this is deliberately separate
// so a reference page can be opened at a theme without touching app storage.
const root = document.documentElement;
const params = new URLSearchParams(location.search);
const initial = params.get('theme');
if (initial === 'dark' || initial === 'light') root.setAttribute('data-theme', initial);

for (const button of document.querySelectorAll('[data-ref-theme]')) {
  button.textContent = root.getAttribute('data-theme') === 'dark' ? 'Light' : 'Dark';
  button.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    button.textContent = next === 'dark' ? 'Light' : 'Dark';
  });
}
