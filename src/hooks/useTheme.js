import { useEffect, useState } from 'react';

export default function useTheme() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const apply = () => {
      let saved;
      try { saved = localStorage.getItem('jm-theme'); } catch { /* Storage is optional. */ }
      const next = saved === 'dark' ? 'dark' : 'light';
      if (document.documentElement.dataset.theme !== next) window.dispatchEvent(new Event('jm:before-theme-change'));
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    apply();
    window.addEventListener('storage', apply);
    return () => {
      window.removeEventListener('storage', apply);
    };
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    window.dispatchEvent(new Event('jm:before-theme-change'));
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('jm-theme', next); } catch { /* Keep the in-memory preference. */ }
    setTheme(next);
  }

  return { theme, toggleTheme };
}
