const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
function closeMenu() { navLinks.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); }
menuToggle.addEventListener('click', () => { const open = navLinks.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', String(open)); });
navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if(event.key === 'Escape' && navLinks.classList.contains('open')) { closeMenu(); menuToggle.focus(); } });
let toastTimeout;
document.getElementById('copyEmailBtn').addEventListener('click', async () => {
  const toast = document.getElementById('toast');
  try {
    await navigator.clipboard.writeText('akshaychavan44.ac@gmail.com');
    toast.textContent = 'Email address copied to clipboard.';
  } catch { toast.textContent = 'Could not copy. Email: akshaychavan44.ac@gmail.com'; }
  toast.classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => toast.classList.remove('show'), 4000);
});

// Duplicate the same code block for a seamless, continuous editor scroll.
const liveCode = document.getElementById('liveCode');
const codeLines = [
  '<span class="syntax-comment">// Building thoughtful digital experiences.</span>',
  '<span class="syntax-key">import</span> React <span class="syntax-key">from</span> <span class="syntax-string">"react"</span>;',
  '<span class="syntax-key">import</span> { motion } <span class="syntax-key">from</span> <span class="syntax-string">"motion/react"</span>;',
  '',
  '<span class="syntax-key">type</span> Developer = {',
  '  name: <span class="syntax-function">string</span>;',
  '  skills: <span class="syntax-function">string</span>[];',
  '  lovesBuilding: <span class="syntax-function">boolean</span>;',
  '};',
  '',
  '<span class="syntax-key">const</span> developer: Developer = {',
  '  name: <span class="syntax-string">"Akshay Chavan"</span>,',
  '  skills: [<span class="syntax-string">"Java", "React", "TypeScript"</span>],',
  '  lovesBuilding: <span class="syntax-key">true</span>,',
  '};',
  '',
  '<span class="syntax-key">export default function</span> <span class="syntax-function">Portfolio</span>() {',
  '  <span class="syntax-key">return</span> (',
  '    &lt;<span class="syntax-function">main</span> className=<span class="syntax-string">"portfolio"</span>&gt;',
  '      &lt;<span class="syntax-function">About</span> developer={developer} /&gt;',
  '      &lt;<span class="syntax-function">Skills</span> items={developer.skills} /&gt;',
  '      &lt;<span class="syntax-function">SelectedProjects</span> /&gt;',
  '      &lt;<span class="syntax-function">Contact</span> /&gt;',
  '    &lt;/<span class="syntax-function">main</span>&gt;',
  '  );',
  '}',
  '',
  '<span class="syntax-comment">// From an idea to production.</span>',
  '<span class="typing-line"><span class="syntax-key">const</span> nextProject = <span class="syntax-string">"Let’s build it."</span>;</span>',
  '',
];
if (liveCode) {
  const block = codeLines.map((line, index) => `<span class="code-line"><i>${index + 1}</i>${line || ' '}</span>`).join('');
  liveCode.innerHTML = block + block;
}
const sectionLinks = [...navLinks.querySelectorAll('a')];
const trackedSections = sectionLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
let navUpdatePending = false;
function updateActiveSection() {
  const marker = window.innerHeight * 0.35;
  let active = trackedSections.find(section => section.getBoundingClientRect().top <= marker && section.getBoundingClientRect().bottom > marker);
  const skills = document.getElementById('skills');
  if (skills && skills.getBoundingClientRect().top <= marker && skills.getBoundingClientRect().bottom > marker) active = document.getElementById('about');
  sectionLinks.forEach(link => {
    if (active && link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  navUpdatePending = false;
}
window.addEventListener('scroll', () => {
  if (!navUpdatePending) { navUpdatePending = true; requestAnimationFrame(updateActiveSection); }
}, { passive: true });
window.addEventListener('resize', updateActiveSection);
updateActiveSection();

// Motion is progressive enhancement: content stays readable if animation is unavailable.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const heading = hero.querySelector('h1');
  const heroParts = [...hero.querySelectorAll('.eyebrow, .hero-intro, .hero-actions, .hero-availability, .hero-aside, .hero-scroll')];
  let intro;
  let safetyTimer;
  let finished = false;
  const animations = [];
  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(safetyTimer);
    intro?.remove();
    animations.forEach(animation => animation.cancel());
    window.dispatchEvent(new Event('portfolio-intro-finished'));
  }
  function revealHero() {
    if (reducedMotion.matches || !heading.animate) return;
    heading.querySelectorAll('.hero-line-inner').forEach((line, index) => {
      line.animate([{ transform: 'translateY(110%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 800, delay: index * 110, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    });
    heroParts.forEach((element, index) => element.animate([{ opacity: 0, transform: index % 2 ? 'translateX(24px)' : 'translateX(-24px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650, delay: 220 + index * 65, easing: 'ease-out', fill: 'backwards' }));
  }
  if (!reducedMotion.matches && heading.animate) {
    const lines = heading.innerHTML.split(/<br\s*\/?\s*>/i);
    heading.innerHTML = lines.map(line => `<span class="hero-line"><span class="hero-line-inner">${line}</span></span>`).join('');
    {
      intro = document.createElement('div');
      intro.className = 'preloader';
      intro.setAttribute('aria-hidden', 'true');
      intro.innerHTML = '<div class="preloader-name"></div><p class="preloader-role">Software Developer</p><div class="preloader-track"><span class="preloader-progress"></span></div>';
      const name = intro.querySelector('.preloader-name');
      [...'AKSHAY CHAVAN'].forEach((letter, index) => {
        const character = document.createElement('span');
        character.textContent = letter;
        name.append(character);
        animations.push(character.animate([{ opacity: 0.08 }, { opacity: 1 }], { duration: 380, delay: 100 + index * 65, fill: 'both', easing: 'cubic-bezier(.4,0,.2,1)' }));
      });
      document.body.append(intro);
      animations.push(intro.querySelector('.preloader-role').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 300, fill: 'both' }));
      animations.push(intro.querySelector('.preloader-progress').animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1300, delay: 150, fill: 'both', easing: 'cubic-bezier(.65,0,.35,1)' }));
      safetyTimer = setTimeout(finish, 3200);
      const curtain = intro.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: 750, delay: 1500, fill: 'forwards', easing: 'cubic-bezier(.76,0,.24,1)' });
      animations.push(curtain);
      const heroTimer = setTimeout(revealHero, 1700);
      curtain.finished.then(finish).catch(() => clearTimeout(heroTimer));
      // Never obscure content when someone starts navigating immediately.
      window.addEventListener('keydown', finish, { once: true });
      window.addEventListener('pointerdown', finish, { once: true });
      window.addEventListener('wheel', finish, { once: true, passive: true });
      reducedMotion.addEventListener('change', event => { if (event.matches) finish(); });
    }
  }
  function startViewportReveals() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    }), { threshold: 0, rootMargin: '-72px 0px -12% 0px' });
    document.querySelectorAll('.section h2, .project-item, .experience-item, .skill-group, .edu-list > *, .contact-grid, .section-lead, .about-title, .contact-title').forEach((element, index) => {
      element.classList.add('motion-reveal');
      const siblings = [...element.parentElement.children].filter(sibling => sibling.matches(element.matches('.project-item') ? '.project-item' : element.tagName));
      const order = siblings.indexOf(element);
      element.dataset.motion = element.matches('.project-item') ? (order % 2 ? 'bottom' : 'top') : (index % 2 ? 'right' : 'left');
      element.style.setProperty('--reveal-delay', `${(index % 3) * 65}ms`);
      observer.observe(element);
    });
    reducedMotion.addEventListener('change', event => {
      if (event.matches) { observer.disconnect(); document.querySelectorAll('.motion-reveal').forEach(element => element.classList.add('is-visible')); }
    });
  }
  if (intro && !finished) window.addEventListener('portfolio-intro-finished', startViewportReveals, { once: true });
  else startViewportReveals();
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('.btn-primary').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (!finePointer.matches || reducedMotion.matches) return;
      const bounds = button.getBoundingClientRect();
      button.style.setProperty('--magnet-x', `${Math.max(-4, Math.min(4, (event.clientX - bounds.left - bounds.width / 2) * .06))}px`);
      button.style.setProperty('--magnet-y', `${Math.max(-3, Math.min(3, (event.clientY - bounds.top - bounds.height / 2) * .1))}px`);
    });
    const reset = () => { button.style.removeProperty('--magnet-x'); button.style.removeProperty('--magnet-y'); };
    button.addEventListener('pointerleave', reset);
    button.addEventListener('blur', reset);
  });
})();




// Enhance the existing skills content into accessible category tabs.
(() => {
  const grid = document.querySelector('#skills .skills-grid');
  if (!grid) return;
  const groups = [...grid.querySelectorAll('.skill-group')];
  const tabs = document.createElement('div');
  tabs.className = 'skills-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Skill categories');
  const compactTabs = window.matchMedia('(max-width: 767px)');
  const setOrientation = () => tabs.setAttribute('aria-orientation', compactTabs.matches ? 'horizontal' : 'vertical');
  setOrientation();
  compactTabs.addEventListener('change', setOrientation);
  const panels = document.createElement('div');
  panels.className = 'skills-panels';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let running = [];
  function animatePanel(panel) {
    running.forEach(animation => animation.cancel());
    running = [];
    if (motion.matches || !panel.animate) return;
    running.push(panel.animate([{ opacity: 0, transform: 'translateX(42px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' }));
    panel.querySelectorAll('.skill-tag').forEach((skill, index) => {
      running.push(skill.animate([{ opacity: 0, transform: 'translateX(22px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 420, delay: 65 + index * 45, fill: 'backwards', easing: 'ease-out' }));
    });
  }
  const buttons = groups.map((group, index) => {
    const heading = group.querySelector('h3');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'skills-tab';
    button.id = `skills-tab-${index}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', `skills-panel-${index}`);
    button.innerHTML = group.querySelector('.skill-icon').outerHTML;
    const label = document.createElement('span');
    label.className = 'skills-tab-label';
    label.textContent = heading.textContent;
    button.append(label);
    const arrow = document.createElement('span');
    arrow.className = 'skills-tab-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '›';
    button.append(arrow);
    const panel = document.createElement('div');
    panel.className = 'skills-panel';
    panel.id = `skills-panel-${index}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', button.id);
    panel.tabIndex = 0;
    const count = document.createElement('p');
    count.className = 'skills-panel-kicker';
    count.textContent = `0${index + 1} / ${String(groups.length).padStart(2, '0')}`;
    const descriptions = [
      'The languages I use to build reliable applications, from interface to infrastructure.',
      'Building reliable services, integrating APIs, and structuring application logic.',
      'Building responsive, accessible, and performant user interfaces with modern frontend technologies.',
      'Working with relational and document databases to organize and manage application data.',
      'The tools and platforms I use to develop, collaborate, test, and ship applications.',
      'Integrating language models and generative AI into useful, practical applications.'
    ];
    const description = document.createElement('p');
    description.className = 'skills-panel-description';
    description.textContent = descriptions[index];
    panel.append(count, heading, description, group.querySelector('.skill-tags'));
    panels.append(panel);
    button.addEventListener('click', () => select(index));
    tabs.append(button);
    return button;
  });
  function select(index, focus = false) {
    const changed = active !== index;
    active = index;
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
      panels.children[i].hidden = i !== index;
    });
    if (focus) buttons[index].focus();
    if (compactTabs.matches && (changed || focus)) buttons[index].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: motion.matches ? 'instant' : 'smooth' });
    if (changed) animatePanel(panels.children[index]);
  }
  tabs.addEventListener('keydown', event => {
    let next;
    if (event.key === (compactTabs.matches ? 'ArrowRight' : 'ArrowDown')) next = (active + 1) % buttons.length;
    if (event.key === (compactTabs.matches ? 'ArrowLeft' : 'ArrowUp')) next = (active - 1 + buttons.length) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (next !== undefined) { event.preventDefault(); select(next, true); }
  });
  grid.className = 'skills-interactive';
  grid.replaceChildren(tabs, panels);
  select(0);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) animatePanel(panels.children[active]);
    }), { threshold: .15 });
    observer.observe(grid);
  }
  motion.addEventListener('change', event => { if (event.matches) running.forEach(animation => animation.cancel()); });
})();



// Keep menu state and focus consistent when crossing the navigation breakpoint.
const compactNavigation = window.matchMedia('(max-width: 767px)');
compactNavigation.addEventListener('change', closeMenu);
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header') && navLinks.classList.contains('open')) closeMenu();
});
document.addEventListener('focusin', event => {
  const reveal = event.target.closest('.motion-reveal');
  if (reveal) reveal.classList.add('is-visible');
});
