// Small inline icons replace the external Font Awesome stylesheet and fonts.
const paths = {
  'arrow-up-right': <path d="M7 17 17 7M7 7h10v10" />,
  'arrow-down': <path d="M12 3v18m-7-7 7 7 7-7" />,
  'arrow-left': <path d="M19 12H5m7 7-7-7 7-7" />,
  'arrow-right': <path d="M5 12h14m-7-7 7 7-7 7" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  sparkle: <path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z" fill="currentColor" stroke="none" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
  moon: <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />,
  email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" /></>,
  map: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  whatsapp: <><path d="M21 11.5a9 9 0 0 1-13.2 8L3 21l1.5-4.8A9 9 0 1 1 21 11.5Z" /><path d="m8 7 2 3-1 1c1 2 2 3 4 4l1-1 3 1.5c-1 3-4 2-7-1s-4-6-2-7Z" /></>,
};

export default function Icon({ name, className = '' }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
