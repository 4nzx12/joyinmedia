import { LiquidButton } from './ui/liquid-glass-button.jsx';
import { Button } from './ui/button.jsx';
import ShimmerText from './ui/shimmer-text.jsx';
import Icon from './Icon.jsx';
import VideoBackground from './VideoBackground.jsx';
import CountUp from './ui/count-up.jsx';

export default function Hero({ theme }) {
  return <header className="hero" id="home">
    <VideoBackground theme={theme} className="hero-background" priority />
    <div className="hero-copy">
      <h1 className="hero-title">Where Your Brand <span className="hero-title-light"><ShimmerText>Takes Flight</ShimmerText><Icon name="sparkle" className="flight-star" /></span></h1>
      <dl className="hero-stats" aria-label="Joyin Media in numbers">
        {/* 2.5s counting + 0.3s stagger + 0.18s digit blur keeps the full sequence within 3s. */}
        <div className="hero-stat">
          <dt>Leads generated</dt>
          <dd><CountUp to={100000} slowDownAt={85000} duration={2.5} separator="," locale="en-IN" /></dd>
        </div>
        <div className="hero-stat">
          <dt>Sales converted</dt>
          <dd><span className="hero-stat-currency">₹</span><CountUp to={30000000} slowDownAt={25000000} duration={2.5} delay={0.15} separator="," locale="en-IN" /></dd>
        </div>
        <div className="hero-stat">
          <dt>Years of experience</dt>
          <dd><CountUp to={3} slowDownAt={2} digitEffect="blur" duration={2.5} delay={0.3} /><span className="hero-stat-unit">+</span></dd>
        </div>
      </dl>
      <div className="hero-cta">
        <LiquidButton asChild><a href="#featured-work">Explore our work <Icon name="arrow-up-right" /></a></LiquidButton>
        <Button asChild variant="ghost"><a href="#contact">Let’s talk <Icon name="arrow-up-right" /></a></Button>
      </div>
    </div>
  </header>;
}
