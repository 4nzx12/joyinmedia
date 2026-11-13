import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

export function useMediaQuery(query, serverValue = false) {
  const subscribe = useCallback((notify) => {
    const media = window.matchMedia(query);
    media.addEventListener('change', notify);
    return () => media.removeEventListener('change', notify);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => serverValue);
}

export function useReducedMotion() {
  // Avoid starting media until the browser's actual preference is known.
  return useMediaQuery('(prefers-reduced-motion: reduce)', true);
}

const subscribeVisibility = (notify) => {
  document.addEventListener('visibilitychange', notify);
  return () => document.removeEventListener('visibilitychange', notify);
};

export function usePageVisible() {
  return useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => true);
}

export function useSaveData() {
  const [saveData, setSaveData] = useState(true);
  useEffect(() => {
    const connection = navigator.connection;
    const update = () => setSaveData(Boolean(connection?.saveData));
    update();
    connection?.addEventListener('change', update);
    return () => connection?.removeEventListener('change', update);
  }, []);
  return saveData;
}

export function useInView({ once = false, rootMargin = '0px', threshold = 0.1 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (once && entry.isIntersecting) observer.disconnect();
    }, { rootMargin, threshold });
    observer.observe(element);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);
  return [ref, inView];
}
