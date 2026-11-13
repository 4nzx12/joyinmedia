import { useEffect, useState } from 'react';

export default function useTheme() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const system = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      let saved;
      try { saved = localStorage.getItem('jm-theme'); } catch { /* Storage is optional. */ }
      const next = saved === 'light' || saved === 'dark' ? saved : system.matches ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    apply();
    system.addEventListener('change', apply);
    window.addEventListener('storage', apply);
    return () => {
      system.removeEventListener('change', apply);
      window.removeEventListener('storage', apply);
    };
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('jm-theme', next); } catch { /* Keep the in-memory preference. */ }
    setTheme(next);
  }

  return { theme, toggleTheme };
}
