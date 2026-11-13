import { LiquidButton } from './ui/liquid-glass-button.jsx';
import { Button } from './ui/button.jsx';
import ShimmerText from './ui/shimmer-text.jsx';
import Icon from './Icon.jsx';

export default function Hero() {
  return <header className="hero" id="home">
    <div className="hero-copy">
      <h1 className="hero-title">Where Your Brand <em><ShimmerText>Takes Flight</ShimmerText><Icon name="sparkle" className="flight-star" /></em></h1>
      <div className="hero-cta">
        <LiquidButton asChild><a href="#featured-work">Explore our work <Icon name="arrow-up-right" /></a></LiquidButton>
        <Button asChild variant="ghost"><a href="#contact">Let’s talk <Icon name="arrow-up-right" /></a></Button>
      </div>
    </div>
  </header>;
}
