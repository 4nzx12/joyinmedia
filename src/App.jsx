import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import TrustBar from './components/TrustBar.jsx';
import Process from './components/Process.jsx';
import Services from './components/Services.jsx';
import FeaturedWork from './components/FeaturedWork.jsx';
import Testimonials from './components/Testimonials.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import { LazyMotion } from 'motion/react';
import useTheme from './hooks/useTheme.js';
import usePageMotion from './hooks/usePageMotion.js';
import useAnalytics from './hooks/useAnalytics.js';

const loadMotionFeatures = () => import('./lib/motion-features.js').then(module => module.default);

export default function App() {
  const { theme, toggleTheme } = useTheme();
  usePageMotion();
  useAnalytics();

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="scroll-progress" aria-hidden="true" />
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <main className="content" id="main">
        <Hero />
        <TrustBar />
        <FeaturedWork />
        <Services />
        <Process />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </LazyMotion>
  );
}
