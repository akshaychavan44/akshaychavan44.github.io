import { contentReady } from './portfolio-content.js';
contentReady.then(async () => {
  await import('./script.js');
  await import('./deck.js');
});
