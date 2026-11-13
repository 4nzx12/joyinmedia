import { logo } from '../data/content.js';
import Icon from './Icon.jsx';
import { LiquidButton } from './ui/liquid-glass-button.jsx';
export default function Navbar({ theme, onToggleTheme }) {
  return <nav className="navbar" id="navbar" aria-label="Main navigation">
    <a href="#top" className="nav-logo" aria-label="Joyin Media — home"><img src={logo} alt="Joyin Media" width="120" height="46" /></a>
    <div className="nav-links"><a href="#featured-work" className="nav-link">Work</a><a href="#services" className="nav-link">Services</a><a href="#faq" className="nav-link">Results</a></div>
    <div className="nav-actions"><button className="theme-toggle" type="button" aria-label="Toggle dark mode" aria-pressed={theme === 'dark'} onClick={onToggleTheme}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
      <LiquidButton asChild size="sm"><a href="#contact">Let’s talk <span aria-hidden="true">↗</span></a></LiquidButton>
    </div>
  </nav>;
}
