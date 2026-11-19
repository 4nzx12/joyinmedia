import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import VideoCarousel from './VideoCarousel.jsx';
import Icon from './Icon.jsx';

export default function CategoryModal({ category, onClose }) {
  const dialogRef = useRef(null);

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
    <dialog ref={dialogRef} className="category-dialog" aria-labelledby="category-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="category-dialog-content">
        <div className="category-dialog-heading">
          <h3 id="category-dialog-title">{category.label}</h3>
          <button type="button" className="category-dialog-close" aria-label="Close category" onClick={onClose}><Icon name="close" /></button>
        </div>
        <VideoCarousel videos={category.videos} label={category.label} />
      </div>
    </dialog>, document.body,
  );
}
