const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
function closeMenu() { navLinks.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); }
menuToggle.addEventListener('click', () => { const open = navLinks.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', String(open)); });
navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if(event.key === 'Escape' && navLinks.classList.contains('open')) { closeMenu(); menuToggle.focus(); } });
const projectToggle = document.getElementById('projectToggle');
const moreProjects = document.getElementById('moreProjects');
projectToggle.addEventListener('click', () => { const expanded = projectToggle.getAttribute('aria-expanded') !== 'true'; projectToggle.setAttribute('aria-expanded', String(expanded)); moreProjects.hidden = !expanded; projectToggle.innerHTML = expanded ? 'Show selected work <span aria-hidden="true">↑</span>' : 'View all projects <span aria-hidden="true">→</span>'; });
let toastTimeout;
document.getElementById('copyEmailBtn').addEventListener('click', async () => {
  const toast = document.getElementById('toast');
  try {
    await navigator.clipboard.writeText('akshaychavan44.ac@gmail.com');
    toast.textContent = 'Email address copied to clipboard.';
  } catch { toast.textContent = 'Could not copy. Email: akshaychavan44.ac@gmail.com'; }
  toast.classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => toast.classList.remove('show'), 4000);
});
