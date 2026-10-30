import { contentReady } from './portfolio-content.js';
import { setupNameIntro } from './portfolio-motion.js';
const revealPortfolio = setupNameIntro();
contentReady.then(async () => {
  await import('./script.js');
  await import('./deck.js');
}).finally(revealPortfolio);
