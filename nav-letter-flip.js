// Each glyph has identical front/back faces, so its width and text never change.
export function setupNavLetterFlip(nav) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const stopAnimations = [];
  nav.querySelectorAll('a').forEach(link => {
    const label = link.textContent.trim();
    const wrapper = document.createElement('span');
    wrapper.className = 'nav-flip-label';
    wrapper.setAttribute('aria-hidden', 'true');
    const rotors = [...label].map(letter => {
      const cell = document.createElement('span');
      cell.className = 'nav-flip-letter';
      const rotor = document.createElement('span');
      rotor.className = 'nav-flip-rotor';
      for (const side of ['front', 'back']) {
        const face = document.createElement('span');
        face.className = `nav-flip-${side}`;
        face.textContent = letter === ' ' ? '\u00a0' : letter;
        rotor.append(face);
      }
      cell.append(rotor); wrapper.append(cell);
      return rotor;
    });
    link.setAttribute('aria-label', label);
    link.replaceChildren(wrapper);
    let running = [];
    const finish = () => {
      const previous = running;
      running = [];
      previous.forEach(animation => animation.cancel());
      link.classList.remove('is-flipping');
    };
    stopAnimations.push(finish);
    function start(event) {
      if (reducedMotion.matches || running.length || !rotors[0]?.animate) return;
      if (event.type === 'pointerenter' && event.pointerType === 'touch') return;
      if (event.type === 'pointerdown' && event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      link.classList.add('is-flipping');
      const current = rotors.map((rotor, index) => rotor.animate([
        { transform: 'rotateX(0deg)' },
        { transform: 'rotateX(-180deg)' },
      ], {
        duration: 450,
        delay: index * 60,
        easing: 'cubic-bezier(.4,0,.2,1)',
        fill: 'both',
      }));
      running = current;
      Promise.allSettled(current.map(animation => animation.finished)).then(() => {
        if (running === current) finish();
      });
    }
    link.addEventListener('pointerenter', start);
    link.addEventListener('pointerdown', start);
    link.addEventListener('focus', start);
    // A tap still navigates immediately; the animation does not intercept clicks.
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) stopAnimations.forEach(stop => stop());
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAnimations.forEach(stop => stop());
  });
}
