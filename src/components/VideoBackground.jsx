import { useEffect, useRef, useState } from 'react';
import { backgrounds, videoPoster, videoSource } from '../data/content.js';
import { usePageVisible, useReducedMotion, useSaveData } from '../hooks/useBrowserState.js';

export default function VideoBackground({ theme }) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const reducedMotion = useReducedMotion();
  const saveData = useSaveData();
  const visible = usePageVisible();
  const original = backgrounds[theme];
  const source = videoSource(original, 1440);
  const enabled = !reducedMotion && !saveData;

  useEffect(() => {
    setReady(false);
    const video = videoRef.current;
    if (!video) return;
    const play = () => {
      if (document.hidden) return;
      video.defaultMuted = true;
      video.muted = true;
      video.play()?.catch(() => setReady(false));
    };
    if (visible) play();
    else video.pause();
    // Retry blocked autoplay only on a genuine user interaction.
    document.addEventListener('pointerdown', play, { passive: true });
    document.addEventListener('keydown', play);
    return () => {
      video.pause();
      document.removeEventListener('pointerdown', play);
      document.removeEventListener('keydown', play);
    };
  }, [source, enabled, visible]);

  return (
    <div className={ready && enabled && visible ? 'background-media is-playing' : 'background-media'} aria-hidden="true">
      <img className="video-poster" src={videoPoster(original, 1440)} alt="" decoding="async" />
      {enabled && <video key={source} ref={videoRef} className="video-bg" src={source} muted loop playsInline preload="none" disablePictureInPicture disableRemotePlayback tabIndex={-1} onPlaying={() => setReady(true)} onPause={() => setReady(false)} onError={() => setReady(false)} />}
      <div className="video-overlay" />
    </div>
  );
}
