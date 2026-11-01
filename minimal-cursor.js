import './minimal-cursor.css';

export function setupMinimalCursor() {
  const enabled = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)');
  const cursor = document.createElement('div');
  cursor.className = 'minimal-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="minimal-cursor-dot"></span><span class="minimal-cursor-ring"></span>';
  document.body.append(cursor);

  const dot = cursor.firstElementChild;
  const ring = cursor.lastElementChild;
  let x = 0;
  let y = 0;
  let ringX = 0;
  let ringY = 0;
  let frame = 0;
  let previousTime = 0;
  let visible = false;

  function hide() {
    visible = false;
    cursor.classList.remove('is-visible', 'is-hovering');
    document.documentElement.classList.remove('minimal-cursor-active');
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }

  function draw(time) {
    const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16.67;
    previousTime = time;
    const follow = 1 - Math.exp(-elapsed / 65);
    ringX += (x - ringX) * follow;
    ringY += (y - ringY) * follow;
    const settled = Math.hypot(x - ringX, y - ringY) < 0.1;
    if (settled) { ringX = x; ringY = y; }
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    frame = settled ? 0 : requestAnimationFrame(draw);
    if (settled) previousTime = 0;
  }

  function move(event) {
    if (!enabled.matches || event.pointerType !== 'mouse') return hide();
    if (event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), iframe')) return hide();
    x = event.clientX;
    y = event.clientY;
    if (!visible) {
      ringX = x;
      ringY = y;
      ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      visible = true;
      cursor.classList.add('is-visible');
      document.documentElement.classList.add('minimal-cursor-active');
    }
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    cursor.classList.toggle('is-hovering', Boolean(event.target.closest('a, button, [role="button"], summary')));
    if (!frame) frame = requestAnimationFrame(draw);
  }

  window.addEventListener('pointermove', move, { passive: true });
  document.documentElement.addEventListener('pointerleave', hide);
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') hide();
  }, { passive: true });
  window.addEventListener('blur', hide);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  document.addEventListener('keydown', event => { if (event.key === 'Tab') hide(); });
  enabled.addEventListener('change', hide);
}
