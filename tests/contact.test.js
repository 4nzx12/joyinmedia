import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContactUrl, normalizeEnquiry, validateEnquiry } from '../src/lib/contact.js';

const enquiry = { name: 'Asha & Team', phone: '+91 98765 43210', message: 'Branding & video for our café? Yes!\nPlease call us.' };

test('validates required fields and rejects malformed phone numbers', () => {
  assert.deepEqual(Object.keys(validateEnquiry({})), ['name', 'phone', 'message']);
  assert.deepEqual(validateEnquiry(enquiry), {});
  for (const phone of ['123', '1234567890123456', 'call9876543210']) {
    assert.ok(validateEnquiry({ ...enquiry, phone }).phone);
  }
  assert.ok(validateEnquiry({ ...enquiry, message: '  Hi  ' }).message);
  assert.equal(normalizeEnquiry({ name: '  Asha  ' }).name, 'Asha');
});

test('WhatsApp preserves special characters and line breaks in the enquiry', () => {
  const url = new URL(buildContactUrl('whatsapp', enquiry));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/917736700496');
  const text = url.searchParams.get('text');
  assert.ok(text.includes(enquiry.name));
  assert.ok(text.includes(enquiry.phone));
  assert.ok(text.includes(enquiry.message));
});

test('email preserves the intended recipient, subject and multiline body', () => {
  const url = new URL(buildContactUrl('email', enquiry));
  assert.equal(url.pathname, 'joyinmediahouse@gmail.com');
  assert.equal(url.searchParams.get('subject'), `New website enquiry — ${enquiry.name}`);
  assert.ok(url.searchParams.get('body').includes(enquiry.message));
});
