import { contact } from '../data/content.js';

export function normalizeEnquiry(values) {
  return Object.fromEntries(['name', 'phone', 'message'].map(field => [field, String(values[field] ?? '').trim()]));
}

export function validateEnquiry(values) {
  const { name, phone, message } = normalizeEnquiry(values);
  const errors = {};
  if (!name) errors.name = 'Please enter your name.';
  if (!phone) errors.phone = 'Please enter your phone number.';
  else if (!/^[+\d\s().-]+$/.test(phone) || !/^\d{10,15}$/.test(phone.replace(/\D/g, ''))) errors.phone = 'Please enter a valid phone number.';
  if (!message) errors.message = 'Please tell us a little about what you need.';
  else if (message.length < 10) errors.message = 'Please share a bit more detail.';
  return errors;
}

export function buildContactUrl(channel, values) {
  const { name, phone, message } = normalizeEnquiry(values);
  if (channel === 'whatsapp') {
    const text = ['New website enquiry', '', `Name: ${name}`, `Phone: ${phone}`, '', 'Request:', message].join('\n');
    return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`;
  }
  const subject = `New website enquiry — ${name}`;
  const body = ['Hi Joyin Media,', '', `Name: ${name}`, `Phone: ${phone}`, '', 'How can we help?', message, '', 'Looking forward to hearing from you.'].join('\n');
  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
