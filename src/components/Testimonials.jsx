import { useEffect, useState } from 'react';
import { clientStories } from '../data/content.js';
import { useInView, usePageVisible, useReducedMotion } from '../hooks/useBrowserState.js';
import AnimatedNumber from './ui/animated-number.jsx';
function Metric({ text, className }) {
  const [, value, suffix, label] = text.match(/^([\d.]+)([^ ]*)\s*(.*)$/);
  return <div className={className} aria-label={text}><span aria-hidden="true"><AnimatedNumber value={Number(value)} suffix={suffix} /></span><span className="metric-label">{label}</span></div>;
}
export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [ref, inView] = useInView();
  const visible = usePageVisible();
  const reducedMotion = useReducedMotion();
  const client = clientStories[active];
  const rotating = inView && visible && !reducedMotion && !hovered && !focused;
  useEffect(() => {
    if (!rotating) return;
    const timer = setTimeout(() => setActive(index => (index + 1) % clientStories.length), 3000);
    return () => clearTimeout(timer);
  }, [active, rotating]);
  return <section className="client-proof-section" id="faq" ref={ref} onPointerEnter={event => setHovered(event.pointerType !== 'touch')} onPointerLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className="section-heading"><div><div className="section-label">05 / Real partnerships. Real impact.</div><h2 className="section-title">The work speaks.<br /><em>So do our clients.</em></h2></div><p>Beyond the likes.<br />Behind the growth.</p></div>
    <div className="client-proof">
      <div className="logo-row" aria-label="Client testimonials">{clientStories.map((item, index) => <button key={item.name} className={'client-logo' + (active === index ? ' is-active' : '')} type="button" aria-label={item.name} aria-pressed={active === index} onClick={() => setActive(index)}><img src={item.logo} alt={item.name} loading="lazy" decoding="async" width="150" height="60" /></button>)}</div>
      <div className="proof-layout" aria-live={rotating ? 'off' : 'polite'} aria-atomic="true">
        <article className="testimonial-panel"><span className="quote-mark" aria-hidden="true">“</span><blockquote className="client-quote">{client.quote}</blockquote><div className="testimonial-meta"><span className="testimonial-name">{client.name}</span><span className="testimonial-company">{client.company}</span></div></article>
        <div className="results-stack"><p className="results-eyebrow">THE DIFFERENCE WE MADE</p><Metric text={client.mainMetric} className="client-main-metric" /><div className="result-row"><Metric text={client.secondaryOne} className="client-mini-one" /><Metric text={client.secondaryTwo} className="client-mini-two" /></div><p className="results-note">Results from our work with {client.name}.</p></div>
      </div>
    </div>
  </section>;
}
