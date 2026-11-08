import { setupLiquidNav } from './portfolio-motion.js';
import { setupNavLetterFlip } from './nav-letter-flip.js';

const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
setupLiquidNav(document.querySelector('.site-header'));
setupNavLetterFlip(navLinks);
function closeMenu() { navLinks.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); }
menuToggle.addEventListener('click', () => { const open = navLinks.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', String(open)); });
navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if(event.key === 'Escape' && navLinks.classList.contains('open')) { closeMenu(); menuToggle.focus(); } });
let toastTimeout;
document.getElementById('copyEmailBtn').addEventListener('click', async () => {
  const toast = document.getElementById('toast');
  const email = document.getElementById('copyEmailBtn').dataset.email || document.querySelector('a[href^="mailto:"]').href.slice(7);
  try {
    await navigator.clipboard.writeText(email);
    toast.textContent = 'Email address copied to clipboard.';
  } catch { toast.textContent = `Could not copy. Email: ${email}`; }
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
  // Sections stack (earlier ones stay pinned underneath), so the visible one is the last match.
  // Sections without a nav link (Skills, How I build, Education) highlight nothing.
  const active = [...document.querySelectorAll('main > section')].findLast(section => section.getBoundingClientRect().top <= marker && section.getBoundingClientRect().bottom > marker);
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

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Skills marquee: repeat each lane's set once (hidden from assistive tech) so the
// CSS animation can slide by exactly one set and loop seamlessly.
document.querySelectorAll('.s-lane__track').forEach(track => {
  const set = track.querySelector('.s-lane__set');
  const copy = set.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.inert = true;
  track.append(copy);
});

// "View all projects" reveals the remaining projects.
const moreToggle = document.getElementById('moreProjectsToggle');
const moreProjects = document.getElementById('moreProjects');
if (moreToggle && moreProjects) {
  moreToggle.addEventListener('click', () => {
    const open = moreToggle.getAttribute('aria-expanded') !== 'true';
    moreToggle.setAttribute('aria-expanded', String(open));
    moreProjects.hidden = !open;
    moreToggle.querySelector('.s-btn__label').textContent = open ? 'Show fewer projects' : 'View all projects';
    if (open) moreProjects.querySelector('a, h3')?.focus({ preventScroll: true });
  });
}

// How I build: the red line fills as the section slides up, and is full once it pins.
// (Measured from the section's in-flow position; a pinned section stops moving, so the
// steps' own position can't drive this.)
const steps = document.querySelector('.s-steps');
if (steps) {
  const section = steps.closest('section');
  const header = document.querySelector('.site-header');
  let stepsPending = false;
  const updateSteps = () => {
    stepsPending = false;
    const flowTop = (section.previousElementSibling?.classList.contains('panel-marker') ? section.previousElementSibling : section).getBoundingClientRect().top;
    const travel = window.innerHeight - header.offsetHeight;
    const progress = reducedMotion.matches ? 1 : Math.min(1, Math.max(0, (window.innerHeight - flowTop) / travel));
    steps.style.setProperty('--progress', progress.toFixed(3));
    steps.querySelectorAll('.s-step').forEach((step, index, all) => step.classList.toggle('is-active', progress >= index / all.length + 0.05));
  };
  window.addEventListener('scroll', () => { if (!stepsPending) { stepsPending = true; requestAnimationFrame(updateSteps); } }, { passive: true });
  window.addEventListener('resize', updateSteps);
  reducedMotion.addEventListener('change', updateSteps);
  updateSteps();
}



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
