import { contact, logo } from '../data/content.js';
import Icon from './Icon.jsx';
import { MetalButton } from './ui/metal-button.jsx';
import ShimmerText from './ui/shimmer-text.jsx';
import VideoBackground from './VideoBackground.jsx';
export default function Footer({ theme }) {
  return <footer className="site-footer" id="site-footer" aria-label="Joyin Media">
    <VideoBackground theme={theme} className="footer-background" />
    <div className="footer-inner">
      <div className="footer-invitation"><div><p className="footer-eyebrow">A little ambition goes a long way.</p><h2 className="footer-title">Let’s make<br /><em><ShimmerText>something matter.</ShimmerText></em></h2></div>
        <MetalButton asChild><a href={`mailto:${contact.email}`}>Start a project <Icon name="arrow-up-right" /></a></MetalButton>
      </div>
      <div className="footer-logo-wrap"><a href="#top" aria-label="Joyin Media — back to top"><img src={logo} alt="Joyin Media" className="footer-logo" width="160" height="60" loading="lazy" decoding="async" /></a></div>
    </div>
  </footer>;
}
