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
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#161616' : '#f7f4ed');
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const target = nextTheme(theme);
      button.textContent = target === 'dark' ? 'Dark' : 'Light';
      button.setAttribute('aria-label', `Switch to ${target} mode`);
    });
  }
}
