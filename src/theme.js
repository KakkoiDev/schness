export const THEMES = ['light', 'dark'];
const STORAGE_KEY = 'schness-theme';

export function preferredTheme(savedTheme, prefersDark = false) {
  return THEMES.includes(savedTheme) ? savedTheme : (prefersDark ? 'dark' : 'light');
}

export function nextTheme(theme) {
  return theme === 'dark' ? 'light' : 'dark';
}

export function initTheme(root = document.documentElement) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
  apply(preferredTheme(saved, media.matches));
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const theme = nextTheme(root.dataset.theme);
      try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* Keep the in-session theme. */ }
      apply(theme);
    });
  });

  function apply(theme) {
    root.dataset.theme = theme;
    // The two metas are media-scoped for the system preference; this one wins
    // once a person has chosen. It used to be set to #161616 / #f7f4ed, which
    // matched neither theme's paper — the browser chrome and the page differed.
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0E1512' : '#F2EEE4');
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const target = nextTheme(theme);
      /*
       * The visible word is the action, not the state: in light mode it says
       * "Dark", and pressing it makes the page dark. `aria-pressed` on top of
       * that would say the opposite — a pressed button labelled "Light" reads
       * as "light is on" when it means "switch to light" — so the switch is
       * announced by the label instead. Two pages used to announce only the
       * bare word, with nothing to say it was a control at all.
       */
      button.textContent = target === 'dark' ? 'Dark' : 'Light';
      button.removeAttribute('aria-pressed');
      button.setAttribute('aria-label', `Switch to ${target} mode`);
    });
  }
}
