import { useRef, useState } from 'react';
import { contact } from '../data/content.js';
import { buildContactUrl, validateEnquiry } from '../lib/contact.js';
import Icon from './Icon.jsx';
import { Button } from './ui/button.jsx';
import { MetalButton } from './ui/metal-button.jsx';

const fields = [
  { name: 'name', label: 'Name', type: 'text', placeholder: 'Your name', autoComplete: 'name' },
  { name: 'phone', label: 'Phone', type: 'tel', placeholder: 'Your phone number', autoComplete: 'tel' },
  { name: 'message', label: 'How can we help?', placeholder: 'Tell us a little about what you need...' },
];
const channels = [
  { label: 'Email', icon: 'email', href: `mailto:${contact.email}`, text: contact.email },
  { label: 'WhatsApp', icon: 'whatsapp', href: `https://wa.me/${contact.whatsapp}`, text: '+91 7736700496' },
  { label: 'Instagram', icon: 'instagram', href: contact.instagram, text: '@joyinmediahouse' },
  { label: 'Office', icon: 'map', href: contact.office, text: 'Pachalam, Kochi' },
];

export default function Contact() {
  const [values, setValues] = useState({ name: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const formRef = useRef(null);

  function send(event) {
    event.preventDefault();
    const nextErrors = validateEnquiry(values);
    setErrors(nextErrors);
    setStatus('');
    const invalidField = Object.keys(nextErrors)[0];
    if (invalidField) {
      formRef.current.elements.namedItem(invalidField)?.focus();
      return;
    }
    const channel = event.nativeEvent.submitter?.value || 'whatsapp';
    const url = buildContactUrl(channel, values);
    if (channel === 'whatsapp') window.open(url, '_blank', 'noopener,noreferrer');
    else window.location.assign(url);
    setStatus(channel === 'whatsapp' ? 'Your WhatsApp message is ready. Complete sending it in WhatsApp.' : 'Your email draft is ready. Complete sending it in your email app.');
  }

  return (
    <section className="contact-section fade-in" id="contact">
      <div className="section-label">06 / Your next chapter</div>
      <h2 className="section-title">Get in touch</h2>
      <p className="contact-intro">An idea, a challenge, or a coffee. We’re all ears.</p>
      <div className="contact-layout">
        <div className="contact-form-wrap">
          <form ref={formRef} id="contactForm" noValidate className="contact-form" onSubmit={send}>
            {fields.map(field => {
              const attributes = {
                id: `cf-${field.name}`, name: field.name, placeholder: field.placeholder, required: true,
                value: values[field.name], 'aria-invalid': Boolean(errors[field.name]), 'aria-describedby': `error-${field.name}`,
                onChange: event => {
                  setValues(current => ({ ...current, [field.name]: event.target.value }));
                  setErrors(current => ({ ...current, [field.name]: undefined }));
                  setStatus('');
                },
              };
              return <div className="form-group" key={field.name}>
                <label htmlFor={attributes.id}>{field.label}</label>
                {field.name === 'message' ? <textarea {...attributes} rows={5} /> : <input {...attributes} type={field.type} autoComplete={field.autoComplete} />}
                <p className="field-error" id={`error-${field.name}`}>{errors[field.name]}</p>
              </div>;
            })}
            <div className="form-actions">
              <Button type="submit" name="channel" value="whatsapp" className="form-btn whatsapp-btn" id="sendWhatsApp"><Icon name="whatsapp" /> Send via WhatsApp</Button>
              <MetalButton type="submit" name="channel" value="email" className="form-btn email-btn" id="sendEmail"><Icon name="email" /> Send via Email</MetalButton>
            </div>
            <p className={`form-success${status ? ' show' : ''}`} id="formSuccess" role="status" aria-live="polite">{status}</p>
          </form>
        </div>
        <div className="contact-info">
          {channels.map(channel => <a key={channel.label} className="contact-card" href={channel.href} aria-label={`${channel.label} Joyin Media`} {...(channel.href.startsWith('https:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            <div className="contact-icon"><Icon name={channel.icon} /></div>
            <h3>{channel.label}</h3><span>{channel.text}</span>
          </a>)}
        </div>
      </div>
    </section>
  );
}
