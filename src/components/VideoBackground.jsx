import { useCallback, useLayoutEffect, useRef } from 'react';
import { useInView, usePageVisible, useReducedMotion, useSaveData } from '../hooks/useBrowserState.js';
import { loadBackgroundVideo, showBackgroundVideo, waitForMedia } from '../lib/background-video.js';

const media = ['light', 'dark'].map(theme => ({
  theme,
  poster: `/media/background-${theme}-v1.jpg`,
  mobile: `/media/background-${theme}-v1-960.mp4`,
  desktop: `/media/background-${theme}-v1-1440.mp4`,
}));

export default function VideoBackground({ theme = 'light', className = '', blurred = false, priority = false }) {
  const [viewRef, inView] = useInView({ threshold: 0 });
  const [preloadRef, nearViewport] = useInView({ once: true, rootMargin: '600px', threshold: 0 });
  const containerRef = useCallback(node => { viewRef.current = node; preloadRef.current = node; }, [viewRef, preloadRef]);
  const videos = useRef({});
  const playback = useRef({ displayed: null, time: 0, frozen: false });
  const reducedMotion = useReducedMotion();
  const saveData = useSaveData();
  const visible = usePageVisible();
  const enabled = !reducedMotion && !saveData;
  const shouldLoad = priority || nearViewport;

  useLayoutEffect(() => {
    // Adopt the native hero player that may already be playing before hydration.
    const earlyPlayer = Object.values(videos.current).find(video => video.dataset.active === 'true');
    if (earlyPlayer) playback.current.displayed = earlyPlayer.dataset.videoTheme;
    if (priority) window.__stopHeroVideoBootstrap?.();
    const freeze = () => {
      const current = videos.current[playback.current.displayed];
      if (!current) return;
      current.pause();
      // Capture at the button click, without rounding or waiting for timeupdate.
      playback.current.time = current.currentTime;
      playback.current.frozen = true;
    };
    window.addEventListener('jm:before-theme-change', freeze);
    return () => {
      window.removeEventListener('jm:before-theme-change', freeze);
      Object.values(videos.current).forEach(video => video?.pause());
    };
  }, [priority]);

  useLayoutEffect(() => {
    const players = videos.current;
    const state = playback.current;
    const requested = document.documentElement.dataset.theme || theme;
    const target = players[requested];
    const current = players[state.displayed];
    const controller = new AbortController();
    const { signal } = controller;

    // Hydration uses conservative hook snapshots; do not cancel an early download
    // just because those snapshots have not caught up with the browser yet.
    const allowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.connection?.saveData;
    if (!allowed) {
      if (current) state.time = current.currentTime;
      for (const video of Object.values(players)) {
        video.pause();
        delete video.dataset.active;
        if (video.hasAttribute('src')) { video.removeAttribute('src'); video.load(); }
      }
      state.displayed = null;
      return;
    }
    if (!shouldLoad) return;

    loadBackgroundVideo(target);
    const warmAlternate = () => Object.values(players).forEach(loadBackgroundVideo);
    // Let the hero's first frame win the network, then buffer the other theme.
    if (!priority || target.readyState >= 2) warmAlternate();
    else target.addEventListener('loadeddata', warmAlternate, { once: true, signal });

    if (!inView || !visible) {
      Object.values(players).forEach(video => video.pause());
      return () => controller.abort();
    }
    if (current && current !== target && !state.frozen) {
      current.pause();
      state.time = current.currentTime;
      state.frozen = true;
    }
    Object.values(players).forEach(video => { if (video !== target) video.pause(); });

    let pending = false;
    const start = async () => {
      if (pending || signal.aborted || document.hidden) return;
      pending = true;
      try {
        const handoff = state.displayed !== requested || state.frozen;
        if (target.readyState === 0 && !handoff) target.play()?.catch(() => {});
        await waitForMedia(target, () => target.readyState >= 1, signal);
        if (signal.aborted) return;
        if (handoff) {
          target.pause();
          const position = Number.isFinite(target.duration) && target.duration > 0 ? state.time % target.duration : state.time;
          // currentTime preserves fractional seconds; fastSeek sacrifices precision.
          if (Math.abs(target.currentTime - position) > 0.000001) target.currentTime = position;
        }
        await waitForMedia(target, () => !target.seeking && target.readyState >= 2, signal);
        if (signal.aborted || document.hidden) return;
        showBackgroundVideo(target, players);
        state.displayed = requested;
        state.frozen = false;
        target.play()?.catch(() => { /* Keep the decoded frame if autoplay is blocked. */ });
      } catch (error) {
        if (!signal.aborted && error.name !== 'AbortError') {
          Object.values(players).forEach(video => { video.pause(); delete video.dataset.active; });
          state.displayed = null;
        }
      } finally {
        pending = false;
      }
    };
    start();
    document.addEventListener('pointerdown', start, { passive: true, signal });
    document.addEventListener('keydown', start, { signal });
    return () => controller.abort();
  }, [theme, enabled, shouldLoad, inView, visible, priority]);

  return <div ref={containerRef} className={`background-media ${className}${blurred ? ' background-media--blurred' : ''}`} aria-hidden="true">
    {media.map(item => <img key={item.theme} className={`video-poster video-poster--${item.theme}`} src={item.poster} alt="" width="1440" height="810" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" />)}
    {media.map(item => <video key={item.theme} ref={node => { if (node) videos.current[item.theme] = node; }} className="video-bg" data-video-theme={item.theme} data-src-mobile={item.mobile} data-src-desktop={item.desktop} muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback tabIndex={-1} suppressHydrationWarning />)}
    <div className="video-overlay" />
  </div>;
}
