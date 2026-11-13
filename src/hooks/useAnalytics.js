import { useEffect } from 'react';

export default function useAnalytics() {
  useEffect(() => {
    if (!import.meta.env.PROD || window.gtag) return;
    function load() {
      if (window.gtag) return;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', 'G-E8ZQ7JE404');
      const script = document.createElement('script');
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-E8ZQ7JE404';
      script.async = true;
      document.head.appendChild(script);
    }
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(load, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(load, 2000);
    return () => clearTimeout(id);
  }, []);
}
