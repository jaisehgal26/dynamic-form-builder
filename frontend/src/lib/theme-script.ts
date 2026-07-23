// Inline script string that runs before React hydrates to prevent FOUC.
// Reads the saved theme from localStorage and applies the correct class to
// <html> synchronously so the first paint matches the user's preference.
//
// Skips public form pages (/f/...) — those always render light because
// form creators control their own theme.

export const THEME_STORAGE_KEY = "ff-theme";

export const themeScript = `(function(){
  try {
    if (location.pathname.indexOf('/f/') === 0) return;
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var theme = stored || 'system';
    var resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var root = document.documentElement;
    if (resolved === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.style.colorScheme = resolved;
  } catch (e) {}
})();`;
