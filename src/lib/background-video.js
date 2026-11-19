// Wait for a decoded, seek-complete frame, with cancellation for rapid toggles.
export function waitForMedia(video, predicate, signal) {
  return new Promise((resolve, reject) => {
    const events = ['loadedmetadata', 'loadeddata', 'canplay', 'seeked', 'error'];
    let timer;
    const finish = error => {
      clearTimeout(timer);
      events.forEach(event => video.removeEventListener(event, check));
      signal.removeEventListener('abort', abort);
      if (error) reject(error);
      else resolve();
    };
    const abort = () => finish(new DOMException('Media handoff cancelled', 'AbortError'));
    const check = () => {
      if (signal.aborted) abort();
      else if (video.error) finish(new Error('Background video unavailable'));
      else if (predicate()) finish();
    };
    events.forEach(event => video.addEventListener(event, check));
    signal.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => finish(new Error('Background video timed out')), 12000);
    check();
  });
}

export function loadBackgroundVideo(video) {
  if (video.hasAttribute('src')) return;
  video.defaultMuted = true;
  video.muted = true;
  video.src = window.matchMedia('(max-width: 767px)').matches ? video.dataset.srcMobile : video.dataset.srcDesktop;
}

export function showBackgroundVideo(video, videos) {
  // The old frame stays visible until this video's seek has finished decoding.
  for (const candidate of Object.values(videos)) {
    if (candidate === video) candidate.dataset.active = 'true';
    else delete candidate.dataset.active;
  }
}
