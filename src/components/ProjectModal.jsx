import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { videoPoster, videoSource } from '../data/content.js';
import Icon from './Icon.jsx';

export default function ProjectModal({ videos, index, onChange, onClose }) {
  const dialogRef = useRef(null);
  const [failedSource, setFailedSource] = useState(null);
  const project = videos[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog ref={dialogRef} className="cs-fullscreen" aria-label={`${project.title} — ${project.category}`} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={event => {
      if (videos.length < 2 || event.target.tagName === 'VIDEO') return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        onChange(index + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    }}>
      <div className="cs-fullscreen-wrap">
        <button className="cs-fullscreen-close" type="button" aria-label="Close project" onClick={onClose}><Icon name="close" /></button>
        {videos.length > 1 && <>
          <button className="cs-fullscreen-prev" type="button" aria-label="Previous video" onClick={() => onChange(index - 1)}><Icon name="arrow-left" /></button>
          <button className="cs-fullscreen-next" type="button" aria-label="Next video" onClick={() => onChange(index + 1)}><Icon name="arrow-right" /></button>
        </>}
        <div className="cs-fullscreen-media">
          <video key={project.src} src={videoSource(project.src)} poster={videoPoster(project.src)} controls autoPlay loop muted playsInline aria-label={project.title} onError={() => setFailedSource(project.src)} />
        </div>
        {failedSource === project.src && <p className="video-error" role="status">This video could not load. <a href={project.src} target="_blank" rel="noopener noreferrer">Open the video directly</a>.</p>}
      </div>
    </dialog>, document.body,
  );
}
