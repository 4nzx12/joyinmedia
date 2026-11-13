import { LiquidButton } from './ui/liquid-glass-button.jsx';
import { Button } from './ui/button.jsx';
import ShimmerText from './ui/shimmer-text.jsx';

export default function Hero() {
  return <header className="hero" id="home">
    <div className="hero-copy">
      <h1 className="hero-title">Where Your Brand <em><ShimmerText>Takes Flight</ShimmerText><span className="flight-star" aria-hidden="true">✳</span></em></h1>
      <div className="hero-cta">
        <LiquidButton asChild><a href="#featured-work">Explore our work <span aria-hidden="true">↗</span></a></LiquidButton>
        <Button asChild variant="ghost"><a href="#contact">Let’s talk <span aria-hidden="true">↗</span></a></Button>
      </div>
    </div>
  </header>;
}
