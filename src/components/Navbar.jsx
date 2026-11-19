import Icon from './Icon.jsx';
import './Navbar.css';

const destinations = [
  { label: 'Home', href: '#home', icon: 'home' },
  { label: 'Work', href: '#featured-work', icon: 'camera' },
  { label: 'Services', href: '#services', icon: 'briefcase' },
  { label: 'Results', href: '#faq', icon: 'chart' },
  { label: 'Contact', href: '#contact', icon: 'message' },
];

export default function Navbar({ theme, onToggleTheme }) {
  return <nav className="navbar icon-navbar" id="navbar" aria-label="Main navigation">
    {destinations.map(({ label, href, icon }) => <a key={href} href={href} className="nav-link nav-item" aria-label={label}>
      <Icon name={icon} />
      <span className="nav-tooltip" aria-hidden="true">{label}</span>
    </a>)}
    <span className="nav-separator" aria-hidden="true" />
    <button className="theme-toggle nav-item" type="button" aria-label="Toggle dark mode" aria-pressed={theme === 'dark'} onClick={onToggleTheme}>
      <span key={theme} className="nav-theme-icon"><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></span>
      <span className="nav-tooltip" aria-hidden="true">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  </nav>;
}
