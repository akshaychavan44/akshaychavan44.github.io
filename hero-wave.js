// Animated dotted terrain behind the hero: a perspective grid of points whose
// height follows layered sine waves plus a soft central dome. Plain Canvas 2D.
// Pauses when the hero is off screen or the tab is hidden; draws one still
// frame for reduced-motion users.

const CAMERA_HEIGHT = 2.4;
const NEAR = 1.6;
const FAR = 13;
const WORLD_WIDTH = 22;

function heightAt(x, z, t) {
  const swell = 0.32 * Math.sin(x * 0.55 + t * 0.6) + 0.22 * Math.sin(z * 0.9 - t * 0.9) + 0.12 * Math.sin((x + z) * 1.3 + t * 0.4);
  const dx = x;
  const dz = z - 6.5;
  const dome = 1.5 * Math.exp(-(dx * dx * 0.55 + dz * dz * 0.35));
  return swell + dome;
}

export function setupHeroWave(canvas) {
  if (!canvas?.getContext) return;
  const context = canvas.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let columns = 0;
  let rows = 0;
  let frame = 0;
  let visible = false;
  const start = performance.now();

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    // Fewer points on small screens keeps the frame cost low on phones.
    columns = width < 700 ? 56 : 96;
    rows = width < 700 ? 34 : 46;
    draw(reducedMotion.matches ? 0 : (performance.now() - start) / 1000);
  }

  function draw(t) {
    if (!width || !height) return;
    context.clearRect(0, 0, width, height);
    const horizon = height * 0.5;
    const focal = Math.max(width, height * 1.2) * 0.62;
    const centerX = width / 2;
    for (let j = rows - 1; j >= 0; j--) {
      const z = NEAR + (j / (rows - 1)) * (FAR - NEAR);
      const depth = 1 - (z - NEAR) / (FAR - NEAR);
      const alpha = 0.08 + depth * 0.62;
      const size = 0.6 + depth * 1.5;
      context.fillStyle = `rgba(245,245,242,${alpha.toFixed(3)})`;
      for (let i = 0; i < columns; i++) {
        const x = (i / (columns - 1) - 0.5) * WORLD_WIDTH;
        const y = heightAt(x, z, t);
        const screenX = centerX + (x / z) * focal;
        const screenY = horizon + ((CAMERA_HEIGHT - y) / z) * focal * 0.55;
        if (screenX < -4 || screenX > width + 4 || screenY > height + 4) continue;
        context.fillRect(screenX, screenY, size, size);
      }
    }
  }

  function loop(now) {
    draw((now - start) / 1000);
    frame = requestAnimationFrame(loop);
  }
  function play() {
    if (frame || !visible || document.hidden || reducedMotion.matches) return;
    frame = requestAnimationFrame(loop);
  }
  function pause() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  new ResizeObserver(resize).observe(canvas);
  // Off screen, or fully covered by the next stacked panel: stop drawing.
  let onScreen = false;
  let covered = false;
  const sync = () => { visible = onScreen && !covered; if (visible) play(); else pause(); };
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); }).observe(canvas);
  canvas.closest('section')?.addEventListener('panelcover', event => {
    if (event.detail.covered !== covered) { covered = event.detail.covered; sync(); }
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) { pause(); draw(0); } else play();
  });
}
