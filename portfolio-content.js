import { validateContent } from './content-schema.mjs';

export function renderContent(data) {
  const { profile: p, projects } = validateContent(data);
  const text = (selector, value) => document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
  text('.brand', `${p.name}.`);
  text('.hero-grid > div:first-child > .eyebrow', p.eyebrow);
  text('.hero h1', p.headline);
  text('.hero-intro', p.intro);
  text('.hero-availability p', p.availability);
  text('.hero-aside > div:first-child h3', p.currentRole);
  text('.hero-aside > div:first-child > p:last-child', p.company);
  text('.hero-aside > div:nth-child(2) h3', p.focus);
  text('.hero-aside > div:nth-child(2) > p:last-child', p.focusDescription);
  text('.aside-contact > span, .location-value', p.location);
  text('.about-title', p.role);
  text('#about .section-lead', p.about);
  text('.contact-title', p.contactTitle);
  text('.connect-intro > p', p.contactIntro);
  text('.footer-description', p.footerDescription);
  text('.copyright', `© ${new Date().getFullYear()} ${p.name}. All rights reserved.`);
  document.title = `${p.name} | ${p.role}`;
  document.querySelector('meta[name="description"]').content = p.seoDescription;
  document.querySelectorAll('a[href^="mailto:"]').forEach(a => { a.href = `mailto:${p.email}`; if (a.matches('.contact-val, .aside-contact a')) a.textContent = p.email; });
  document.querySelectorAll('a[href^="tel:"]').forEach(a => { a.href = `tel:${p.phone.replace(/[^+\d]/g, '')}`; a.textContent = p.phone; });
  document.querySelectorAll('.connect-actions a:nth-child(2), .footer-links a[aria-label="GitHub"]').forEach(a => { a.href = p.github || '#contact'; a.hidden = !p.github; });
  const resume = document.querySelector('.resume-link');
  resume.href = p.resume || '#contact'; resume.hidden = !p.resume;
  resume.removeAttribute('download');
  document.getElementById('copyEmailBtn').dataset.email = p.email;
  document.querySelector('.footer-links a[aria-label="LinkedIn"]')?.remove();
  if (p.linkedin) {
    const link = document.createElement('a'); link.className = 'round-icon'; link.href = p.linkedin;
    link.target = '_blank'; link.rel = 'noreferrer'; link.setAttribute('aria-label', 'LinkedIn'); link.textContent = 'in';
    document.querySelector('.footer-links').append(link);
  }
  const node = (tag, className, value) => { const el = document.createElement(tag); el.className = className; if (value) el.textContent = value; return el; };
  const link = (url, className, label) => { const a = node('a', className, label); a.href = url; a.target = '_blank'; a.rel = 'noreferrer'; return a; };
  const containers = { selected: '.projects-container', additional: '.additional-live-projects', more: '#moreProjects' };
  for (const [placement, selector] of Object.entries(containers)) {
    const container = document.querySelector(selector);
    container.replaceChildren();
    projects.filter(project => project.visible && project.placement === placement).forEach(project => {
      const article = node('article', `project-item${placement === 'more' ? '' : ' featured'}`);
      if (project.image) {
        const preview = project.liveUrl ? link(project.liveUrl, 'project-preview') : node('div', 'project-preview');
        if (project.liveUrl) preview.setAttribute('aria-label', `Visit ${project.title}`);
        const image = document.createElement('img'); image.src = project.image; image.alt = project.imageAlt || project.title;
        image.width = 1440; image.height = 900; image.loading = 'lazy'; preview.append(image); article.append(preview);
      }
      const title = node('h3', 'project-title');
      title.append(project.liveUrl ? link(project.liveUrl, '', `${project.title} ↗`) : document.createTextNode(project.title));
      article.append(title);
      if (project.category) article.append(node('span', 'project-category-badge', project.category));
      article.append(node('p', 'project-desc', project.description));
      const tags = node('div', 'project-tech-list');
      project.tags.forEach(tag => tags.append(node('span', 'tech-tag', tag))); article.append(tags);
      const actions = node('div', 'project-actions');
      if (project.liveUrl) actions.append(link(project.liveUrl, 'project-live-link', 'View live site ↗'));
      if (project.githubUrl) actions.append(link(project.githubUrl, 'project-live-link', 'View on GitHub ↗'));
      article.append(actions); container.append(article);
    });
    container.hidden = !container.children.length;
  }
}

export const contentReady = (async () => { try {
  const response = await fetch(`${import.meta.env.BASE_URL}content.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Portfolio content is unavailable.');
  renderContent(await response.json());
} catch (error) { console.error('Using original portfolio content:', error); } })();
