import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { videoCategories, videoPoster, videoSource } from '../data/content.js';
import { useInView, usePageVisible, useReducedMotion, useSaveData } from '../hooks/useBrowserState.js';
import { Button } from './ui/button.jsx';
import { Marquee3D } from './ui/marquee-3d.jsx';
import Icon from './Icon.jsx';

const CategoryModal = lazy(() => import('./CategoryModal.jsx'));
const wrap = index => (index + videoCategories.length) % videoCategories.length;

function CategoryCard({ category, index, active, canPlay, onOpen }) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const playing = canPlay && index === active;
  let distance = wrap(index - active);
  if (distance > videoCategories.length / 2) distance -= videoCategories.length;
  const depth = Math.abs(distance);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) video.play()?.catch(() => {});
    else video.pause();
    return () => video.pause();
  }, [playing]);

  return (
    <button type="button" className={`cs-card cs-category-card cs-category-card--${category.id}${index === active ? ' is-active' : ''}`} data-category-index={index} aria-label={`Explore ${category.label}`} aria-haspopup="dialog" tabIndex={index === active ? 0 : -1} aria-hidden={depth > 2 ? true : undefined} onClick={onOpen} style={{
      transform: `translateX(calc(-50% + ${distance} * var(--card-spacing) + var(--drag-offset, 0px))) scale(${Math.max(0.45, 1 - depth * 0.14)}) rotateY(${distance * 22}deg) translateZ(${-depth * 80}px)`,
      filter: `blur(${Math.min(depth * 1.25, 3)}px)`,
      opacity: depth > 2 ? 0 : depth === 0 ? 1 : Math.max(0.2, 0.85 - depth * 0.25),
      pointerEvents: depth > 2 ? 'none' : undefined,
      zIndex: 10 - depth,
    }}>
      <span className="cs-category-cover" aria-hidden="true">
        <img src={videoPoster(category.coverVideo)} alt="" width="280" height="436" loading="lazy" decoding="async" draggable="false" />
        {playing && !failed && <video ref={videoRef} src={videoSource(category.coverVideo, 560)} poster={videoPoster(category.coverVideo)} muted loop playsInline preload="none" tabIndex={-1} disablePictureInPicture disableRemotePlayback onError={() => setFailed(true)} />}
      </span>
      <span className="cs-media cs-category-content">
        <span className="cs-category-top"><span>Video collection</span><span>{String(index + 1).padStart(2, '0')}</span></span>
        <span className="cs-category-copy">
          <span className="cs-category-title" role="heading" aria-level="3">{category.label}</span>
          <span className="cs-category-description">{category.description}</span>
        </span>
        <span className="cs-category-link">Explore category</span>
      </span>
      <span className="cs-glass-overlay" />
    </button>
  );
}

export default function FeaturedWork() {
  const [active, setActive] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
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
  const canPlay = inView && visible && !reducedMotion && !saveData && selectedCategory === null;
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
    if (event.target.closest('.cs-card')) viewportRef.current.querySelector(`[data-category-index="${next}"]`)?.focus({ preventScroll: true });
  }

  return (
    <section id="featured-work" className="featured-section fade-in">
      <div className="section-heading"><div><div className="section-label">01 / Selected projects</div>
      <h2 className="section-title">Less ordinary.<br /><em>More memorable.</em></h2></div><p>A glimpse of what happens when<br />the right idea meets the right execution.</p></div>
      <div className="videos-heading"><h3 className="videos-title">Videos</h3></div>
      <div className="cs-carousel" ref={ref} role="region" aria-roledescription="carousel" aria-label="Video categories" onKeyDown={handleKey} onPointerEnter={event => setHovered(event.pointerType !== 'touch')} onPointerLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
        <div className="cs-viewport" ref={viewportRef} onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0) return;
          pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: 0, dragging: false };
          setPressed(true);
        }} onPointerMove={movePointer} onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag} onPointerLeave={event => { if (!pointer.current?.dragging) finishDrag(event); }}>
          <div className="cs-stage">
            {videoCategories.map((category, index) => <CategoryCard key={category.id} category={category} index={index} active={active} canPlay={canPlay} onOpen={() => { if (performance.now() >= suppressClickUntil.current) { setActive(index); setSelectedCategory(category); } }} />)}
          </div>
        </div>
        <Button variant="outline" size="icon" className="cs-arrow cs-prev" aria-label="Previous category" onClick={() => setActive(index => wrap(index - 1))}><Icon name="arrow-left" /></Button>
        <Button variant="outline" size="icon" className="cs-arrow cs-next" aria-label="Next category" onClick={() => setActive(index => wrap(index + 1))}><Icon name="arrow-right" /></Button>
        <div className="cs-dots" aria-label="Category navigation">{videoCategories.map((category, index) => <button key={category.id} className={`cs-dot${active === index ? ' active' : ''}`} type="button" aria-label={`Go to ${category.label}`} aria-current={active === index ? 'true' : 'false'} onClick={() => setActive(index)} />)}</div>
        <div id="csProgress" className="cs-progress" aria-live={canRotate ? 'off' : 'polite'} aria-atomic="true" aria-label={`Category ${active + 1} of ${videoCategories.length}`}>
          <span className="cs-progress-num">{String(active + 1).padStart(2, '0')}</span>
          <div className="cs-progress-bar"><div className="cs-progress-fill" style={{ width: `${(active + 1) / videoCategories.length * 100}%` }} /></div>
          <span className="cs-progress-num">{String(videoCategories.length).padStart(2, '0')}</span>
        </div>
      </div>
      <div className="posters-section">
        <h3 className="posters-title">Posters</h3>
        <Marquee3D />
      </div>
      {selectedCategory !== null && <Suspense fallback={<p className="sr-only" role="status">Loading collection…</p>}>
        <CategoryModal category={selectedCategory} onClose={() => setSelectedCategory(null)} />
      </Suspense>}
    </section>
  );
}
