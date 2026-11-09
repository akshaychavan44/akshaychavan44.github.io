import { validateContent } from './content-schema.mjs';

export function renderContent(data) {
  const { profile: p, projects } = validateContent(data);
  const text = (selector, value) => document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
  text('.brand', p.name);
  text('.s-hero__eyebrow', p.eyebrow);
  // The headline's closing punctuation takes the accent colour ("Design. Build. Ship.").
  const heroTitle = document.querySelector('.s-hero__title');
  const [, headlineBody, headlineEnd] = p.headline.trim().match(/^(.*?)([.!?]?)$/s);
  const accent = document.createElement('span');
  accent.className = 's-accent';
  accent.textContent = headlineEnd;
  heroTitle.replaceChildren(document.createTextNode(headlineBody), ...(headlineEnd ? [accent] : []));
  // Hero stats follow the content: every visible project, and every skill listed in the Skills section.
  text('[data-stat="projects"]', String(projects.filter(project => project.visible).length));
  text('[data-stat="skills"]', String(document.querySelectorAll('#skills .s-lane__set:not([aria-hidden]) .s-skill').length));
  text('.s-hero__intro', p.intro);
  text('.s-hero__availability-text', p.availability);
  text('.s-hero__role, .s-about__role', p.currentRole);
  text('.s-hero__company, .s-about__company', p.company);
  text('.s-about__focus', p.focus);
  text('.s-about__focus-text', p.focusDescription);
  text('.s-hero__location, .s-about__location, .location-value', p.location);
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
  // "Let's talk" opens a WhatsApp chat with a pre-written message; without a phone number it falls back to the contact section.
  const whatsappNumber = (p.phone || '').replace(/\D/g, '');
  document.querySelectorAll('a[data-whatsapp]').forEach(a => {
    a.href = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello, can we talk?')}` : '#contact';
    if (!whatsappNumber) a.removeAttribute('target');
  });
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
  // Selected projects lead the grid; "additional" and "more" open behind "View all projects".
  const visible = projects.filter(project => project.visible);
  const groups = [
    [document.querySelector('.s-work__grid'), visible.filter(project => project.placement === 'selected')],
    [document.getElementById('moreProjects'), visible.filter(project => project.placement !== 'selected')],
  ];
  let index = 0;
  for (const [container, items] of groups) {
    container.replaceChildren(...items.map(project => projectCard(project, ++index, node, link)));
  }
  document.querySelector('.s-work__actions').hidden = !groups[1][1].length;

  // Red closing section: a tilted wall of project screenshots in three drifting columns.
  // Decorative only (the wall is aria-hidden), so images carry empty alt text.
  const wall = document.querySelector('.s-cta__wall');
  const shots = visible.filter(project => project.image).map(project => project.image);
  if (wall) {
    wall.replaceChildren(...(shots.length ? [0, 1, 2] : []).map(column => {
      const col = node('div', 's-cta__col');
      const order = shots.map((_, i) => shots[(i + column * 2) % shots.length]);
      // Two copies so the drift can loop by exactly half the column.
      [...order, ...order].forEach(src => {
        const tile = node('div', 's-cta__tile');
        const image = document.createElement('img');
        image.src = src; image.alt = ''; image.loading = 'lazy'; image.width = 1440; image.height = 900;
        tile.append(image); col.append(tile);
      });
      return col;
    }));
  }
}

function projectCard(project, index, node, link) {
  const article = node('article', `s-project${project.image ? '' : ' s-project--text'}`);
  if (project.image) {
    const media = project.liveUrl ? link(project.liveUrl, 's-project__media') : node('div', 's-project__media');
    if (project.liveUrl) media.setAttribute('aria-label', `Visit ${project.title}`);
    const laptop = node('div', 's-laptop');
    const screen = node('div', 's-laptop__screen');
    const image = document.createElement('img');
    image.src = project.image; image.alt = project.imageAlt || project.title;
    image.width = 1440; image.height = 900; image.loading = 'lazy';
    screen.append(image);
    laptop.append(screen, node('div', 's-laptop__base'));
    media.append(laptop);
    article.append(media);
  }
  const body = node('div', 's-project__body');
  const top = node('div', 's-project__top');
  top.append(node('span', 's-project__index', String(index).padStart(2, '0')));
  if (project.category) top.append(node('span', 's-project__category', project.category));
  const title = node('h3', 's-project__title');
  title.append(project.liveUrl ? link(project.liveUrl, '', project.title) : document.createTextNode(project.title));
  const tags = node('ul', 's-tags');
  project.tags.forEach(tag => tags.append(node('li', 's-tag', tag)));
  body.append(top, title, node('p', 's-project__desc', project.description), tags);
  const links = [[project.liveUrl, 'Live site'], [project.githubUrl, 'GitHub']].filter(([url]) => url);
  if (links.length) {
    const row = node('div', 's-project__links');
    links.forEach(([url, label]) => {
      const anchor = link(url, 's-link', `${label} `);
      const arrow = node('span', '', '↗'); arrow.setAttribute('aria-hidden', 'true');
      anchor.append(arrow); row.append(anchor);
    });
    body.append(row);
  }
  article.append(body);
  return article;
}

export const contentReady = (async () => { try {
  const response = await fetch(`${import.meta.env.BASE_URL}content.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Portfolio content is unavailable.');
  renderContent(await response.json());
} catch (error) { console.error('Using original portfolio content:', error); } })();
