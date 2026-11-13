import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/site.css';
import './styles/react.css';

const container = document.getElementById('root');
const app = <StrictMode><App /></StrictMode>;

if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
