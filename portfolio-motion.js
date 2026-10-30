import { isSlateWord, toneHeading } from './heading-tones.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

export function setupLiquidNav(header) {
  const nav = header.querySelector('.nav-links');
  const surface = document.createElement('div');
  surface.className = 'nav-liquid-surface';
  surface.setAttribute('aria-hidden', 'true');
  header.prepend(surface);
  const update = () => {
    const bounds = header.getBoundingClientRect();
    const menuBounds = nav.getBoundingClientRect();
    surface.style.height = `${Math.max(bounds.height, menuBounds.bottom - bounds.top)}px`;
  };
  new MutationObserver(update).observe(nav, { subtree: true, attributes: true, attributeFilter: ['aria-current', 'class'] });
  new ResizeObserver(update).observe(header);
  window.addEventListener('resize', update);
  header.addEventListener('click', event => {
    if (reducedMotion.matches) return;
    const bounds = header.getBoundingClientRect();
    const target = event.target.closest('a, button')?.getBoundingClientRect();
    const x = event.detail === 0 && target ? target.left + target.width / 2 - bounds.left : event.clientX - bounds.left;
    const y = event.detail === 0 && target ? target.top + target.height / 2 - bounds.top : event.clientY - bounds.top;
    const ripple = document.createElement('span');
    ripple.className = 'nav-liquid-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    // Bound simultaneous waves during rapid clicks.
    if (surface.children.length >= 6) surface.firstElementChild.remove();
    surface.append(ripple);
    ripple.animate([
      { transform: 'translate(-50%, -50%) scale(.08, .2)', opacity: .85 },
      { transform: 'translate(-50%, -50%) scale(1, .75)', opacity: .55, offset: .45 },
      { transform: 'translate(-50%, -50%) scale(1.65, 1.1)', opacity: 0 }
    ], { duration: 950, easing: 'cubic-bezier(.16,1,.3,1)' }).finished.then(() => ripple.remove(), () => ripple.remove());
    requestAnimationFrame(update);
  });
  update();
}

export function setupNameIntro() {
  if (reducedMotion.matches) return () => {};
  const overlay = document.createElement('div');
  overlay.className = 'name-intro';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Welcome to my portfolio');
  const backdrop = document.createElement('div');
  backdrop.className = 'name-intro-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  const name = document.createElement('div');
  name.className = 'name-intro-title';
  const caption = document.createElement('p');
  caption.className = 'name-intro-caption';
  const role = document.createElement('span');
  role.className = 'name-intro-role';
  role.textContent = 'Software Developer';
  toneHeading(role);
  const label = document.createElement('span');
  label.className = 'name-intro-label';
  label.textContent = 'Portfolio';
  caption.append(role, label);
  const skip = document.createElement('button');
  skip.className = 'name-intro-skip';
  skip.textContent = 'Skip intro ↗';
  overlay.append(backdrop, name, caption, skip);
  document.body.append(overlay);
  const page = [...document.querySelectorAll('.site-header, main, .site-footer')];
  const previousInert = page.map(element => element.inert);
  const previousFocus = document.activeElement;
  page.forEach(element => { element.inert = true; });
  document.documentElement.classList.add('intro-playing');
  let finished = false;
  let keyboardInteraction = false;
  let animations = [];
  const cleanup = () => {
    if (finished) return;
    finished = true;
    clearTimeout(failsafe);
    animations.forEach(animation => animation.cancel());
    const restoreFocus = overlay.contains(document.activeElement);
    overlay.remove();
    page.forEach((element, i) => { element.inert = previousInert[i]; });
    document.documentElement.classList.remove('intro-playing');
    reducedMotion.removeEventListener('change', onMotionChange);
    if (restoreFocus && (keyboardInteraction || previousFocus !== document.body)) {
      const target = previousFocus !== document.body && previousFocus?.isConnected ? previousFocus : document.querySelector('.brand');
      target?.focus({ preventScroll: true });
    }
  };
  const onMotionChange = () => { if (reducedMotion.matches) cleanup(); };
  reducedMotion.addEventListener('change', onMotionChange);
  const failsafe = setTimeout(cleanup, 6500);
  skip.addEventListener('click', cleanup);
  overlay.addEventListener('wheel', event => { event.preventDefault(); event.stopPropagation(); }, { passive: false });
  overlay.addEventListener('keydown', event => {
    keyboardInteraction = true;
    event.stopPropagation();
    if (event.key === 'Escape') cleanup();
    if (event.key === 'Tab') { event.preventDefault(); skip.focus(); }
  });
  skip.focus({ preventScroll: true });
  // Resolve the display name again after managed portfolio content loads.
  const renderName = () => {
    overlay.style.removeProperty('--intro-name-size');
    name.replaceChildren();
    const label = document.querySelector('.brand').textContent.trim().replace(/\.$/, '');
    name.setAttribute('aria-label', label);
    const words = label.split(/\s+/);
    words.forEach((word, wordIndex) => {
      const row = document.createElement('span');
      row.className = 'name-intro-word';
      row.setAttribute('aria-hidden', 'true');
      [...word].forEach(letter => {
        const glyph = document.createElement('span');
        if (isSlateWord(wordIndex, words.length)) glyph.className = 'heading-tone-muted';
        glyph.textContent = letter;
        row.append(glyph);
      });
      name.append(row);
    });
    // Fit long names and narrow displays without clipping the entry pose.
    const available = innerWidth * .88;
    if (name.scrollWidth > available) overlay.style.setProperty('--intro-name-size', `${parseFloat(getComputedStyle(name).fontSize) * available / name.scrollWidth}px`);
  };
  renderName();
  return async () => {
    if (finished) return;
    renderName();
    const easing = 'cubic-bezier(.22,1,.36,1)';
    animations = [...name.querySelectorAll('.name-intro-word > span')].map((glyph, i) => glyph.animate([
      { opacity: 0, transform: 'translateY(45%) scaleY(.85)' },
      { opacity: 1, transform: 'translateY(0) scaleY(1)' }
    ], { duration: 700, delay: Math.min(i * 35, 420), easing, fill: 'both' }));
    animations.push(caption.animate([{ opacity: 0 }, { opacity: .85 }], { duration: 650, delay: 300, fill: 'both' }));
    try {
      await Promise.all(animations.map(animation => animation.finished));
      if (finished) return;
      const entrance = [...animations];
      animations.push(name.animate([
        { transform: 'scale(1)', opacity: 1, webkitTextStrokeWidth: '.75px' },
        { opacity: 1, offset: .72 },
        { transform: 'scale(3.8)', opacity: 0, webkitTextStrokeWidth: '.25px' }
      ], { delay: 260, duration: 1050, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }));
      name.querySelectorAll('.name-intro-word > span').forEach(glyph => {
        animations.push(glyph.animate([
          { webkitTextFillColor: getComputedStyle(glyph).color },
          { webkitTextFillColor: 'transparent', offset: .2 },
          { webkitTextFillColor: 'transparent' }
        ], { delay: 260, duration: 1050, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }));
      });
      animations.push(caption.animate([{ opacity: .85 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }));
      animations.push(skip.animate([{ opacity: 1 }, { opacity: 0 }], { delay: 260, duration: 350, fill: 'forwards' }));
      animations.push(backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { delay: 200, duration: 450, easing, fill: 'forwards' }));
      const content = [document.querySelector('.site-header'), document.querySelector('.deck-scene:not([hidden])') || document.querySelector('main')];
      content.forEach(element => animations.push(element.animate([
        { opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }
      ], { delay: 200, duration: 650, easing, fill: 'both' })));
      await Promise.all(animations.filter(animation => !entrance.includes(animation)).map(animation => animation.finished));
    } catch { /* Skip or reduced motion cancels the current sequence. */ }
    finally { cleanup(); }
  };
}
