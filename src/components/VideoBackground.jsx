import { useEffect, useRef, useState } from 'react';
import { backgrounds, videoPoster, videoSource } from '../data/content.js';
import { useInView, usePageVisible, useReducedMotion, useSaveData } from '../hooks/useBrowserState.js';

export default function VideoBackground({ theme = 'light', className = '', blurred = false, priority = false }) {
  const [containerRef, inView] = useInView({ threshold: 0 });
  const videoRef = useRef(null);
  const [readySource, setReadySource] = useState(null);
  const [hasEntered, setHasEntered] = useState(false);
  const reducedMotion = useReducedMotion();
  const saveData = useSaveData();
  const visible = usePageVisible();
  const original = backgrounds[theme];
  const source = videoSource(original, 1440);
  const enabled = !reducedMotion && !saveData;
  const shouldLoad = enabled && (priority || inView || hasEntered);

  useEffect(() => {
    if (inView) setHasEntered(true);
  }, [inView]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!inView || !visible) {
      video.pause();
      return;
    }
    const play = () => {
      if (document.hidden) return;
      video.defaultMuted = true;
      video.muted = true;
      video.play()?.catch(() => { /* The poster stays visible if autoplay is blocked. */ });
    };
    play();
    // Retry blocked autoplay only on a genuine user interaction.
    document.addEventListener('pointerdown', play, { passive: true });
    document.addEventListener('keydown', play);
    return () => {
      video.pause();
      document.removeEventListener('pointerdown', play);
      document.removeEventListener('keydown', play);
    };
  }, [source, shouldLoad, inView, visible]);

  return (
    <div ref={containerRef} className={`background-media ${className}${blurred ? ' background-media--blurred' : ''}${readySource === source && shouldLoad ? ' is-ready' : ''}`} aria-hidden="true">
      <img key={original} className="video-poster" src={videoPoster(original, 1440)} alt="" width="1440" height="810" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" />
      {shouldLoad && <video key={source} ref={videoRef} className="video-bg" src={source} muted loop playsInline preload="none" disablePictureInPicture disableRemotePlayback tabIndex={-1} onPlaying={() => setReadySource(source)} onLoadStart={() => setReadySource(null)} onError={() => setReadySource(null)} />}
      <div className="video-overlay" />
    </div>
  );
}
