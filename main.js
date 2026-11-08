import { contentReady } from './portfolio-content.js';
import { setupNameIntro } from './portfolio-motion.js';
import { setupMinimalCursor } from './minimal-cursor.js';
import { setupHeroWave } from './hero-wave.js';

setupMinimalCursor();
setupHeroWave(document.querySelector('.s-hero__wave'));

// Refresh starts a fresh visit at the introduction, rather than the last chapter.
if (performance.getEntriesByType('navigation')[0]?.type === 'reload') {
  history.scrollRestoration = 'manual';
  history.replaceState(history.state, '', `${location.pathname}${location.search}#home`);
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

const revealPortfolio = setupNameIntro();
contentReady.then(async () => {
  await import('./script.js');
  const { setupStacking } = await import('./stacking.js');
  setupStacking();
}).finally(revealPortfolio);
