// Native-scroll stacking panels (CSS does the pinning; see studio.css "Phase 2").
// This script only measures and feeds CSS variables:
//  - where each panel pins, so panels taller than the screen scroll through fully
//  - how far the next panel has covered it (sink + dim)
// It also tints the header to the panel beneath it, reveals content on entry,
// and scrolls in-page links to a panel's real position (pinned panels report a
// moved position, so the browser's own anchor jump can land in the wrong place).

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const revealSelector = [
  '.s-head', '.s-marquee', '.s-project', '.s-work__actions', '.s-built-label', '.s-built', '.s-step',
  '.s-job', '.s-about__copy', '.developer-visual', '.s-edu__row', '.s-reason', '.s-cta__inner',
  '.editorial-label', '.connect-intro', '.connect-details'
].join(',');

export function setupStacking() {
  const main = document.querySelector('main');
  const header = document.querySelector('.site-header');
  const panels = [...main.children].filter(element => element.tagName === 'SECTION');
  if (!panels.length) return;
  let headerHeight = header.offsetHeight;
  let pending = false;

  function measure() {
    headerHeight = header.offsetHeight;
    const available = innerHeight - headerHeight;
    panels.forEach(panel => {
      // Short panels pin under the header; tall ones pin once their bottom reaches the screen's bottom.
      const top = Math.min(headerHeight, headerHeight + available - panel.offsetHeight);
      panel.style.setProperty('--stick-top', `${top}px`);
    });
    update();
  }

  function update() {
    pending = false;
    const animate = !reducedMotion.matches;
    const viewportCentre = headerHeight + (innerHeight - headerHeight) / 2;
    let current = panels[0];
    panels.forEach((panel, index) => {
      const rect = panel.getBoundingClientRect();
      // Use the in-flow marker: the panel's own rect moves as it sinks.
      if (markers.get(panel).getBoundingClientRect().top <= headerHeight + 2) current = panel;
      const next = panels[index + 1];
      if (!animate || !next) { panel.style.removeProperty('--cover'); return; }
      const nextTop = next.getBoundingClientRect().top;
      const cover = Math.min(1, Math.max(0, (innerHeight - nextTop) / (innerHeight - headerHeight)));
      panel.style.setProperty('--cover', cover.toFixed(3));
      panel.style.setProperty('--cover-origin', `${Math.round(viewportCentre - rect.top)}px`);
      panel.dispatchEvent(new CustomEvent('panelcover', { detail: { covered: cover >= 1 } }));
    });
    if (header.dataset.tone !== current.dataset.tone) header.dataset.tone = current.dataset.tone || 'dark';
  }

  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure);
  new ResizeObserver(measure).observe(main);
  reducedMotion.addEventListener('change', measure);

  // A zero-height marker before each panel stays in normal flow, so it reports the
  // panel's true scroll position even while the panel itself is pinned.
  const markers = new Map(panels.map(panel => {
    const marker = document.createElement('span');
    marker.className = 'panel-marker';
    marker.setAttribute('aria-hidden', 'true');
    panel.before(marker);
    return [panel, marker];
  }));
  const flowTop = panel => markers.get(panel).getBoundingClientRect().top + scrollY - headerHeight;
  function scrollToPanel(panel, behavior) {
    scrollTo({ top: flowTop(panel), behavior });
    const heading = panel.querySelector('h1, h2, h3');
    if (heading) {
      if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const panel = panels.find(section => `#${section.id}` === anchor.hash);
    if (!panel) return;
    event.preventDefault();
    history.pushState(null, '', anchor.hash);
    scrollToPanel(panel, reducedMotion.matches ? 'instant' : 'smooth');
  });
  addEventListener('popstate', () => {
    const panel = panels.find(section => `#${section.id}` === location.hash);
    if (panel) scrollToPanel(panel, 'instant');
  });

  // Reveal content as it enters. Elements start visible if they are already on screen.
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    const targets = [...main.querySelectorAll(revealSelector)].filter(element => !element.closest('.s-hero'));
    // Animate a block once rather than both it and its children.
    targets.filter(element => !targets.some(parent => parent !== element && parent.contains(element))).forEach(element => {
      const siblings = [...element.parentElement.children];
      element.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(element), 4) * 90}ms`);
      element.classList.add('motion-reveal');
      observer.observe(element);
    });
  }

  measure();
  const initial = panels.find(section => `#${section.id}` === location.hash);
  if (initial && initial !== panels[0]) scrollToPanel(initial, 'instant');
}
