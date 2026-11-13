import { trustedBrands } from '../data/content.js';
import { Marquee } from './ui/marquee.jsx';
export default function TrustBar() {
  return <div className="trust-section">
    <p className="trust-label">Good company.<br /><span>Great collaborations.</span></p>
    <Marquee className="brand-marquee" aria-label="Trusted by brands across Kerala and beyond">
      {trustedBrands.map(brand => <span key={brand.name} className={'t-logo' + (brand.wide ? ' t-logo--wide' : '')}><img src={brand.src} alt={brand.name} width="150" height="60" loading="lazy" decoding="async" /></span>)}
    </Marquee>
  </div>;
}
