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
