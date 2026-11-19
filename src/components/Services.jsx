import { useState } from 'react';
import { packages } from '../data/packages.js';
import { Button } from './ui/button.jsx';
import Icon from './Icon.jsx';
import VideoBackground from './VideoBackground.jsx';
const capabilities = [
  ['01.', 'Business Strategy & Consulting', 'Business audits, competitor research, growth planning and expansion strategies.'],
  ['02.', 'Brand & Marketing Growth', 'Branding, content creation, social media, paid advertising and customer acquisition.'],
  ['03.', 'Sales & Revenue Solutions', 'Lead generation, sales funnels, CRM systems, conversions and customer retention.'],
  ['04.', 'Operations & Management', 'Business workflows, process improvements, productivity and management systems.'],
  ['05.', 'Technology & Digital Transformation', 'Websites, automation, AI workflows, software integrations and analytics.'],
];
export default function Services({ theme }) {
  const [openId, setOpenId] = useState(null);
  return <section className="services-section ambient-section" id="services">
    <VideoBackground theme={theme} blurred />
    <div className="section-heading"><div><div className="section-label">02 / What we bring</div><h2 className="section-title">Big ideas.<br /><em>Every little detail.</em></h2></div><p>One creative partner.<br />Everything your brand needs to move forward.</p></div>
    <div className="capabilities">{capabilities.map(([number, title, description]) => <div className="capability" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p><Icon name="arrow-up-right" className="capability-icon" /></div>)}</div>
    <div className="packages-heading"><h3>A starting point for every ambition.</h3><span>Find your fit <Icon name="arrow-down" className="packages-fit-icon" /></span></div>
    <div className="package-grid">{packages.map((item, index) => {
      const isOpen = openId === item.id;
      return <article className={'package-card package-card--' + item.id + (isOpen ? ' is-open' : '')} key={item.id}>
      <div className="package-top"><span>0{index + 1} / {index === 0 ? 'BUILD YOUR FOUNDATION' : 'GROW YOUR IMPACT'}</span><span className="package-top-mark"><Icon name={index === 0 ? 'arrow-up-right' : 'sparkle'} /></span></div>
      <h3>{item.name}<br /><em>Package</em></h3><p>{item.description}</p>
      <div className={'package-details' + (isOpen ? ' is-open' : '')} id={'package-' + item.id + '-details'} aria-hidden={!isOpen} inert={!isOpen}>
        <div className="package-details-inner">
          {item.statements.map(text => <p key={text}>{text}</p>)}<ul>{item.steps.map(text => <li key={text}><Icon name="arrow-up-right" className="package-step-icon" />{text}</li>)}</ul>
        </div>
      </div>
      <Button variant="outline" aria-label={'Choose ' + item.name + ' package'} aria-expanded={isOpen} aria-controls={'package-' + item.id + '-details'} onClick={() => setOpenId(current => current === item.id ? null : item.id)}>{isOpen ? 'Less detail' : 'What’s included'} <Icon name={isOpen ? 'minus' : 'plus'} className="package-toggle-icon" /></Button>
    </article>;
    })}</div>
  </section>;
}
