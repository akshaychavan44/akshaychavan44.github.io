// Preserve each original section and its layout inside a stationary viewport.
const main = document.querySelector('main');
const sections = [...main.children].filter(element => element.tagName === 'SECTION');
const scenes = sections.map(section => {
  const scene = document.createElement('div');
  scene.className = 'deck-scene';
  section.before(scene);
  scene.append(section);
  return scene;
});
// Keep the original footer immediately after Contact, in the same final screen.
scenes.at(-1).append(document.querySelector('.site-footer'));
main.classList.add('deck');
const position = document.createElement('div');
position.className = 'deck-status';
position.setAttribute('role', 'status');
position.setAttribute('aria-live', 'polite');
position.setAttribute('aria-atomic', 'true');
document.body.append(position);
const sceneId = scene => scene.querySelector('section').id;
const initialHash = location.hash.slice(1);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const chapterNames = { home: 'Introduction', projects: 'Selected work', experience: 'Experience', about: 'About', skills: 'Skills', education: 'Education', contact: 'Contact' };
let active = Math.max(0, scenes.findIndex(scene => sceneId(scene) === initialHash));
let busy = false;
let running = [];
let queuedDirection = null;

function requestStep(direction) {
  if (busy) { queuedDirection = direction; return; }
  go(active + direction, true, true);
}

function entranceTargets(scene) {
  const headings = [...scene.querySelectorAll('h1, h2, .about-title, .education-heading, .contact-title')];
  const content = [...scene.querySelectorAll('.hero .eyebrow, .hero-intro, .hero-actions, .hero-availability, .hero-aside > div, .project-item, .experience-item > *, .section-lead, .developer-visual, .skills-tabs, .skills-panels, .education-intro, .edu-item, .connect-intro > p, .connect-actions, .connect-details, .footer-inner > *')];
  // Animate a block once, rather than moving both it and its nested children.
  return { headings, content: content.filter(element => !content.some(parent => parent !== element && parent.contains(element))) };
}

function syncNavigation() {
  const chapter = sceneId(scenes[active]);
  position.textContent = `${String(active + 1).padStart(2, '0')} / ${String(scenes.length).padStart(2, '0')} — ${chapterNames[chapter]}`;
  document.querySelectorAll('.nav-links a').forEach(link => {
    const matches = link.hash === `#${chapter}` || (chapter === 'skills' && link.hash === '#about');
    if (matches) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function settle() {
  running.forEach(animation => animation.cancel());
  running = [];
  scenes.forEach((scene, index) => {
    scene.hidden = index !== active;
    scene.inert = index !== active;
    scene.setAttribute('aria-hidden', String(index !== active));
  });
  busy = false;
}

async function go(index, animate = true, fromScroll = false) {
  if (index < 0 || index >= scenes.length || index === active) return;
  const returning = index < active;
  queuedDirection = null;
  settle();
  const outgoing = scenes[active];
  const incoming = scenes[index];
  const moveFocus = outgoing.contains(document.activeElement);
  active = index;
  incoming.hidden = false;
  incoming.inert = false;
  incoming.setAttribute('aria-hidden', 'false');
  outgoing.inert = true;
  outgoing.setAttribute('aria-hidden', 'true');
  // Return to the end of a long previous section instead of jumping to its top.
  incoming.scrollTop = fromScroll && returning ? incoming.scrollHeight - incoming.clientHeight : 0;
  syncNavigation();
  history.replaceState(null, '', `#${sceneId(incoming)}`);
  if (moveFocus) {
    const heading = incoming.querySelector('h1, h2, h3');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  if (!animate || reducedMotion.matches || !incoming.animate) { settle(); return; }
  busy = true;
  const { headings, content } = entranceTargets(incoming);
  // Follow the rendered columns, including responsive layouts and project grids.
  const frame = incoming.getBoundingClientRect();
  const midpoint = frame.left + frame.width / 2;
  const stacked = matchMedia('(max-width: 767px)').matches;
  const distance = stacked ? 24 : 32;
  const entrances = content.map(element => {
    const bounds = element.getBoundingClientRect();
    // Preserve the original column's direction when it stacks below on a phone.
    const right = stacked
      ? element.matches('.developer-visual, .skills-panels, .connect-details, .exp-bullets, .footer-links') || Boolean(element.closest('.hero-aside'))
      : bounds.left + bounds.width / 2 > midpoint + 1;
    return { element, offset: right ? distance : -distance };
  });
  const timing = { duration: 780, fill: 'both', easing: 'cubic-bezier(.22,.68,.25,1)' };
  running = [
    outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards', easing: 'ease-out' }),
    incoming.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 170, delay: 210, fill: 'both' }),
    ...headings.map((element, index) => element.animate([
      { opacity: 0, transform: 'translateY(-20px)' }, { opacity: 1, transform: 'translateY(0)' }
    ], { ...timing, delay: 220 + Math.min(index * 50, 100) })),
    ...entrances.map(({ element, offset }, index) => element.animate([
      { opacity: 0, transform: `translateX(${offset}px)` }, { opacity: 1, transform: 'translateX(0)' }
    ], { ...timing, delay: 300 + Math.min(index * 50, 150) }))
  ];
  const thisRun = running;
  await Promise.allSettled(thisRun.map(animation => animation.finished));
  if (running === thisRun) {
    const queued = queuedDirection;
    queuedDirection = null;
    settle();
    if (queued !== null) requestStep(queued);
  }
}

document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
  const index = scenes.findIndex(scene => sceneId(scene) === anchor.hash.slice(1));
  if (index < 0) return;
  event.preventDefault();
  go(index);
});
addEventListener('hashchange', () => {
  const index = scenes.findIndex(scene => sceneId(scene) === location.hash.slice(1));
  if (index >= 0) go(index);
});

// Let overflowing content and tab strips scroll internally when necessary.
// The document itself stays still, including on small screens and at high zoom.
function canScroll(target, delta) {
  for (let element = target instanceof Element ? target : null; element && element !== document.body; element = element.parentElement) {
    const overflow = getComputedStyle(element).overflowY;
    if (!/(auto|scroll)/.test(overflow) || element.scrollHeight <= element.clientHeight + 1) continue;
    if (delta > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 2) return true;
    if (delta < 0 && element.scrollTop > 2) return true;
  }
  return false;
}
let wheelTotal = 0;
let gestureUsed = false;
let scrolledWithinScene = false;
let wheelDirection = 0;
let wheelEnd;
addEventListener('wheel', event => {
  if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  if (event.target.closest('.site-header')) return;
  const direction = Math.sign(event.deltaY);
  if (!direction) return;
  // A deliberate reversal starts a new gesture, even during trackpad momentum.
  if (direction !== wheelDirection) {
    wheelTotal = 0; gestureUsed = false; scrolledWithinScene = false;
    wheelDirection = direction;
  }
  clearTimeout(wheelEnd);
  wheelEnd = setTimeout(() => { wheelTotal = 0; gestureUsed = false; scrolledWithinScene = false; wheelDirection = 0; }, 150);
  if (!busy && canScroll(event.target, event.deltaY)) { scrolledWithinScene = true; return; }
  event.preventDefault();
  if (gestureUsed || scrolledWithinScene) return;
  wheelTotal += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
  if (Math.abs(wheelTotal) < 32) return;
  gestureUsed = true;
  requestStep(direction);
}, { passive: false });

addEventListener('keydown', event => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,[contenteditable="true"],.nav-links.open')) return;
  if (event.target.closest('button,[role="tab"]') && !['PageDown', 'PageUp'].includes(event.key)) return;
  const direction = ['ArrowDown', 'PageDown', ' '].includes(event.key) ? (event.shiftKey ? -1 : 1) : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0;
  if (!direction && event.key !== 'Home' && event.key !== 'End') return;
  event.preventDefault();
  if (busy) { if (direction && !event.repeat) requestStep(direction); return; }
  if (direction && canScroll(scenes[active], direction)) {
    scenes[active].scrollBy({ top: direction * scenes[active].clientHeight * .85, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    return;
  }
  if (direction) requestStep(direction);
  else go(event.key === 'Home' ? 0 : scenes.length - 1);
});

let touchStart;
addEventListener('touchstart', event => {
  touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY, consumed: false } : null;
}, { passive: true });
addEventListener('touchmove', event => {
  if (!touchStart || event.touches.length !== 1 || event.target.closest('.nav-links.open')) return;
  const delta = touchStart.y - event.touches[0].clientY;
  if (canScroll(event.target, delta) || Math.abs(touchStart.x - event.touches[0].clientX) > Math.abs(delta)) { touchStart.consumed = true; return; }
  if (Math.abs(delta) > 10) event.preventDefault();
}, { passive: false });
addEventListener('touchend', event => {
  if (!touchStart || touchStart.consumed) { touchStart = null; return; }
  const delta = touchStart.y - event.changedTouches[0].clientY;
  if (Math.abs(delta) > 50) requestStep(Math.sign(delta));
  touchStart = null;
}, { passive: true });
addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
reducedMotion.addEventListener('change', () => { queuedDirection = null; settle(); });
document.documentElement.classList.add('deck-enabled');
window.scrollTo({ top: 0, behavior: 'instant' });
settle();
syncNavigation();
