import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { videoPoster, videoSource } from '../data/content.js';
import { useInView, usePageVisible, useReducedMotion, useSaveData } from '../hooks/useBrowserState.js';
import { Button } from './ui/button.jsx';
import Icon from './Icon.jsx';

const ProjectModal = lazy(() => import('./ProjectModal.jsx'));
const wrap = (index, count) => ((index % count) + count) % count;

function ProjectCard({ project, index, active, count, canPlay, onOpen }) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);
  let distance = wrap(index - active, count);
  if (distance > count / 2 || (count === 2 && index < active)) distance -= count;
  const depth = Math.abs(distance);
  const playing = canPlay && index === active;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) video.play()?.catch(() => {});
    else video.pause();
    return () => video.pause();
  }, [playing]);

  return <button type="button" className={`cs-card${index === active ? ' is-active' : ''}`} data-project-index={index} aria-label={`${project.title} — ${project.category}`} tabIndex={index === active ? 0 : -1} aria-hidden={depth > 2 ? true : undefined} onClick={onOpen} style={{
    transform: `translateX(calc(-50% + ${distance} * var(--card-spacing) + var(--drag-offset, 0px))) scale(${Math.max(0.45, 1 - depth * 0.14)}) rotateY(${distance * 22}deg) translateZ(${-depth * 80}px)`,
    filter: `blur(${Math.min(depth * 1.25, 3)}px)`,
    opacity: depth > 2 ? 0 : depth === 0 ? 1 : Math.max(0.2, 0.85 - depth * 0.25),
    pointerEvents: depth > 2 ? 'none' : undefined,
    zIndex: 10 - depth,
  }}>
    <span className="cs-media">
      <img className="cs-poster" src={videoPoster(project.src)} alt="" loading="lazy" decoding="async" width="280" height="436" draggable="false" />
      {playing && !failed && <video ref={videoRef} className="cs-vid" src={videoSource(project.src, 560)} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} onError={() => setFailed(true)} />}
    </span>
    <span className="cs-glass-overlay" />
    <span className="sr-only">Watch {project.title}</span>
  </button>;
}

function PopulatedCarousel({ videos, label }) {
  const [active, setActive] = useState(0);
  const [modalIndex, setModalIndex] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [ref, inView] = useInView({ threshold: 0.15 });
  const viewportRef = useRef(null);
  const pointer = useRef(null);
  const suppressClickUntil = useRef(0);
  const visible = usePageVisible();
  const reducedMotion = useReducedMotion();
  const saveData = useSaveData();
  const count = videos.length;
  const canPlay = inView && visible && !reducedMotion && !saveData && modalIndex === null;
  const canRotate = canPlay && count > 1 && !hovered && !focused && !pressed;

  useEffect(() => {
    if (!canRotate) return;
    const timer = setTimeout(() => setActive(index => wrap(index + 1, count)), 6500);
    return () => clearTimeout(timer);
  }, [active, canRotate, count]);

  function finishDrag(event) {
    const drag = pointer.current;
    if (!drag || drag.id !== event.pointerId) return;
    pointer.current = null;
    if (drag.dragging) {
      suppressClickUntil.current = performance.now() + 350;
      if (event.type !== 'pointercancel' && event.type !== 'lostpointercapture' && Math.abs(drag.offset) > 42) setActive(index => wrap(index + (drag.offset > 0 ? -1 : 1), count));
    }
    const viewport = viewportRef.current;
    viewport.classList.remove('is-dragging');
    viewport.style.setProperty('--drag-offset', '0px');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    setPressed(false);
  }

  function movePointer(event) {
    const drag = pointer.current;
    if (!drag || drag.id !== event.pointerId) return;
    const x = event.clientX - drag.x;
    const y = event.clientY - drag.y;
    if (!drag.dragging) {
      if (Math.abs(y) > Math.abs(x) && Math.abs(y) > 8) {
        finishDrag(event);
        return;
      }
      if (Math.abs(x) < 8) return;
      drag.dragging = true;
      viewportRef.current.setPointerCapture(event.pointerId);
      viewportRef.current.classList.add('is-dragging');
    }
    drag.offset = x * 0.8;
    viewportRef.current.style.setProperty('--drag-offset', `${drag.offset}px`);
  }

  function handleKey(event) {
    if (count < 2 || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    const next = wrap(active + (event.key === 'ArrowLeft' ? -1 : 1), count);
    setActive(next);
    if (event.target.closest('.cs-card')) viewportRef.current.querySelector(`[data-project-index="${next}"]`)?.focus({ preventScroll: true });
  }

  return <>
    <div className="cs-carousel" ref={ref} role="region" aria-roledescription="carousel" aria-label={`${label} videos`} onKeyDown={handleKey} onPointerEnter={event => setHovered(event.pointerType !== 'touch')} onPointerLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="cs-viewport" ref={viewportRef} onPointerDown={event => {
        if (count < 2 || !event.isPrimary || event.button !== 0) return;
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: 0, dragging: false };
        setPressed(true);
      }} onPointerMove={movePointer} onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag} onPointerLeave={event => { if (!pointer.current?.dragging) finishDrag(event); }}>
        <div className="cs-stage">
          {videos.map((project, index) => <ProjectCard key={project.src} project={project} index={index} active={active} count={count} canPlay={canPlay} onOpen={() => { if (performance.now() >= suppressClickUntil.current) setModalIndex(index); }} />)}
        </div>
      </div>
      {count > 1 && <>
        <Button variant="outline" size="icon" className="cs-arrow cs-prev" aria-label="Previous project" onClick={() => setActive(index => wrap(index - 1, count))}><Icon name="arrow-left" /></Button>
        <Button variant="outline" size="icon" className="cs-arrow cs-next" aria-label="Next project" onClick={() => setActive(index => wrap(index + 1, count))}><Icon name="arrow-right" /></Button>
      </>}
      <div className="cs-dots" aria-label="Project navigation">{videos.map((project, index) => <button key={project.src} className={`cs-dot${active === index ? ' active' : ''}`} type="button" aria-label={`Go to ${project.title}`} aria-current={active === index ? 'true' : 'false'} onClick={() => setActive(index)} />)}</div>
      <div className="cs-progress" aria-live={canRotate ? 'off' : 'polite'} aria-atomic="true" aria-label={`Project ${active + 1} of ${count}`}>
        <span className="cs-progress-num">{String(active + 1).padStart(2, '0')}</span>
        <div className="cs-progress-bar"><div className="cs-progress-fill" style={{ width: `${(active + 1) / count * 100}%` }} /></div>
        <span className="cs-progress-num">{String(count).padStart(2, '0')}</span>
      </div>
    </div>
    {modalIndex !== null && <Suspense fallback={<p className="sr-only" role="status">Loading video player…</p>}>
      <ProjectModal videos={videos} index={modalIndex} onChange={index => setModalIndex(wrap(index, count))} onClose={() => setModalIndex(null)} />
    </Suspense>}
  </>;
}

export default function VideoCarousel({ videos, label }) {
  if (videos.length > 0) return <PopulatedCarousel key={videos.map(video => video.src).join('|')} videos={videos} label={label} />;

  return <div className="video-empty">
    <div className="video-empty-stack" aria-hidden="true">
      <span className="video-empty-card video-empty-card--left" />
      <span className="video-empty-card video-empty-card--right" />
      <span className="video-empty-card video-empty-card--front"><Icon name="play" /></span>
    </div>
    <h4>{label}</h4>
    <p>New videos coming soon.</p>
  </div>;
}
