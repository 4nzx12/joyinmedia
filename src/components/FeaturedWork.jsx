import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { projects, videoPoster, videoSource } from '../data/content.js';
import { useInView, usePageVisible, useReducedMotion, useSaveData } from '../hooks/useBrowserState.js';
import { Button } from './ui/button.jsx';
import { Marquee3D } from './ui/marquee-3d.jsx';
import Icon from './Icon.jsx';

const ProjectModal = lazy(() => import('./ProjectModal.jsx'));
const wrap = index => (index + projects.length) % projects.length;

function ProjectCard({ project, index, active, canPlay, onOpen }) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);
  let distance = wrap(index - active);
  if (distance > projects.length / 2) distance -= projects.length;
  const depth = Math.abs(distance);
  const playing = canPlay && index === active;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) video.play()?.catch(() => {});
    else video.pause();
    return () => video.pause();
  }, [playing]);

  return (
    <button type="button" className={`cs-card${index === active ? ' is-active' : ''}`} data-project-index={index} aria-label={`${project.title} — ${project.category}`} tabIndex={index === active ? 0 : -1} aria-hidden={depth > 2 ? true : undefined} onClick={onOpen} style={{
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
    </button>
  );
}

export default function FeaturedWork() {
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
  const canPlay = inView && visible && !reducedMotion && !saveData && modalIndex === null;
  const canRotate = canPlay && !hovered && !focused && !pressed;

  useEffect(() => {
    if (!canRotate) return;
    const timer = setTimeout(() => setActive(index => wrap(index + 1)), 6500);
    return () => clearTimeout(timer);
  }, [active, canRotate]);

  function finishDrag(event) {
    const drag = pointer.current;
    if (!drag || drag.id !== event.pointerId) return;
    pointer.current = null;
    if (drag.dragging) {
      suppressClickUntil.current = performance.now() + 350;
      if (event.type !== 'pointercancel' && event.type !== 'lostpointercapture' && Math.abs(drag.offset) > 42) setActive(index => wrap(index + (drag.offset > 0 ? -1 : 1)));
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
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = wrap(active + (event.key === 'ArrowLeft' ? -1 : 1));
    setActive(next);
    if (event.target.closest('.cs-card')) viewportRef.current.querySelector(`[data-project-index="${next}"]`)?.focus({ preventScroll: true });
  }

  return (
    <section id="featured-work" className="featured-section fade-in">
      <div className="section-heading"><div><div className="section-label">01 / Selected projects</div>
      <h2 className="section-title">Less ordinary.<br /><em>More memorable.</em></h2></div><p>A glimpse of what happens when<br />the right idea meets the right execution.</p></div>
      <div className="cs-carousel" ref={ref} role="region" aria-roledescription="carousel" aria-label="Featured work" onKeyDown={handleKey} onPointerEnter={event => setHovered(event.pointerType !== 'touch')} onPointerLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
        <div className="cs-viewport" ref={viewportRef} onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0) return;
          pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: 0, dragging: false };
          setPressed(true);
        }} onPointerMove={movePointer} onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag} onPointerLeave={event => { if (!pointer.current?.dragging) finishDrag(event); }}>
          <div className="cs-stage">
            {projects.map((project, index) => <ProjectCard key={project.src} project={project} index={index} active={active} canPlay={canPlay} onOpen={() => { if (performance.now() >= suppressClickUntil.current) setModalIndex(index); }} />)}
          </div>
        </div>
        <Button variant="outline" size="icon" className="cs-arrow cs-prev" aria-label="Previous project" onClick={() => setActive(index => wrap(index - 1))}><Icon name="arrow-left" /></Button>
        <Button variant="outline" size="icon" className="cs-arrow cs-next" aria-label="Next project" onClick={() => setActive(index => wrap(index + 1))}><Icon name="arrow-right" /></Button>
        <div className="cs-dots" aria-label="Project navigation">{projects.map((project, index) => <button key={project.src} className={`cs-dot${active === index ? ' active' : ''}`} type="button" aria-label={`Go to ${project.title}`} aria-current={active === index ? 'true' : 'false'} onClick={() => setActive(index)} />)}</div>
        <div id="csProgress" aria-live={canRotate ? 'off' : 'polite'} aria-atomic="true" aria-label={`Project ${active + 1} of ${projects.length}`}>
          <span className="cs-progress-num">{String(active + 1).padStart(2, '0')}</span>
          <div className="cs-progress-bar"><div className="cs-progress-fill" style={{ width: `${(active + 1) / projects.length * 100}%` }} /></div>
          <span className="cs-progress-num">{String(projects.length).padStart(2, '0')}</span>
        </div>
      </div>
      <div className="posters-section">
        <h3 className="posters-title">Posters</h3>
        <Marquee3D />
      </div>
      {modalIndex !== null && <Suspense fallback={<p className="sr-only" role="status">Loading video player…</p>}>
        <ProjectModal index={modalIndex} onChange={index => setModalIndex(wrap(index))} onClose={() => setModalIndex(null)} />
      </Suspense>}
    </section>
  );
}
