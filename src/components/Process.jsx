import { useInView } from '../hooks/useBrowserState.js';

const steps = [
  ['YOU TELL US', 'You bring the vision. We understand your goals, audience, brand, and what you want to achieve.'],
  ['WE CREATE', 'We turn your vision into strategy, concepts, visuals, content, and creative built around your brand.'],
  ['WE DELIVER', 'We refine, finalize, and deploy the finished work—ready to represent your brand and perform.'],
];

export default function Process() {
  const [ref, inView] = useInView({ once: true, threshold: 0.15 });
  return (
    <section className="process-timeline-section fade-in" id="process" ref={ref}>
      <div className="timeline-stage">
        <div className="timeline-header">
          <div className="section-label">03 / The process</div>
          <h2 className="section-title">Good work starts<br /><em>with a conversation.</em></h2>
          <p className="timeline-subheading">A simple process. A sharper outcome.</p>
        </div>
        <div className={`timeline-container${inView ? ' active' : ''}`}>
          <div className="timeline">
            <svg className="timeline-svg" aria-hidden="true" viewBox="0 0 1280 120" preserveAspectRatio="none">
              <defs><linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(200,90,0,0.14)" />
                <stop offset="50%" stopColor="rgba(200,90,0,0.86)" />
                <stop offset="100%" stopColor="rgba(200,90,0,0.14)" />
              </linearGradient></defs>
              <path className="timeline-path" d="M 0 60 Q 180 20, 320 60 T 640 60 T 960 60 T 1280 60" stroke="url(#timelineGradient)" strokeWidth="2" fill="none" />
            </svg>
            {steps.map(([title, description], index) => (
              <div key={title} className="milestone timeline-item active" data-milestone={index}>
                <div className="timeline-dot" />
                <div className="timeline-date-badge">0{index + 1}</div>
                <div className="timeline-content chrome-card">
                  <h3 className="milestone-title">{title}</h3>
                  <p className="milestone-description">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
