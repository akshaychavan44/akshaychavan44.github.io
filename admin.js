import { validateContent } from './content-schema.mjs';

const $ = selector => document.querySelector(selector);
const main = $('#admin-main');
const dialog = $('#project-dialog');
const labels = { overview: 'Overview', projects: 'Projects', profile: 'Profile & copy', links: 'Links & résumé', backups: 'Backups' };
let content, saved, token, revision, view = 'overview', editing = null, search = '', filter = 'all', busy = false, pendingUploads = 0;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const dirty = () => content && JSON.stringify(content) !== saved;
function ask(message) {
  const confirmation = $('#confirm-dialog');
  $('#confirm-message').textContent = message;
  confirmation.returnValue = '';
  confirmation.showModal();
  return new Promise(resolve => confirmation.addEventListener('close', () => resolve(confirmation.returnValue === 'confirm'), { once: true }));
}
function notify(message, error = false) { const el = $('#notice'); el.textContent = message; el.hidden = false; el.classList.toggle('error', error); }
function sync() {
  $('#save').disabled = !content || !dirty() || busy || pendingUploads > 0;
  $('#save-state').textContent = busy ? 'Saving…' : pendingUploads ? 'Uploading…' : dirty() ? '● Unsaved changes' : content ? '✓ All changes saved' : 'Offline';
  $('#project-count').textContent = content?.projects.length ?? '—';
}
function heading(kicker, title, description, action = '') {
  return `<div class="page-heading"><div><p class="eyebrow">${kicker}</p><h1>${escape(title)}</h1><p class="page-description">${description}</p></div>${action}</div>`;
}
function card(p, tools = true) {
  const group = content.projects.filter(item => item.placement === p.placement);
  const index = group.findIndex(item => item.id === p.id);
  return `<article class="project-card"><div class="project-image"><span aria-hidden="true">${escape(p.title.slice(0, 2))}.</span>${p.image ? `<img src="${escape(p.image)}" alt="${escape(p.imageAlt || p.title)}" loading="lazy">` : ''}<span class="pill ${p.visible ? '' : 'draft'}">${p.visible ? 'VISIBLE' : 'HIDDEN'}</span></div><div class="card-body"><h3>${escape(p.title)}</h3><p>${escape(p.description)}</p><div class="card-foot"><span>${{ selected: 'Selected work', additional: 'Additional work', more: 'More projects' }[p.placement]}</span><div class="card-tools">${tools ? `<button data-move="${escape(p.id)}" data-direction="-1" aria-label="Move ${escape(p.title)} earlier" ${index === 0 ? 'disabled' : ''}>↑</button><button data-move="${escape(p.id)}" data-direction="1" aria-label="Move ${escape(p.title)} later" ${index === group.length - 1 ? 'disabled' : ''}>↓</button>` : ''}<button data-edit="${escape(p.id)}">Edit ↗</button></div></div></div></article>`;
}
function field(key, label, value, options = {}) {
  const { area = false, wide = false, type = 'text', help = '', required = false, scope = 'profile' } = options;
  const attrs = `id="${scope}-${key}" name="${key}" data-scope="${scope}" ${required ? 'required' : ''}`;
  return `<label class="field ${wide ? 'wide' : ''}" for="${scope}-${key}">${label}${area ? `<textarea ${attrs} maxlength="8000">${escape(value)}</textarea>` : `<input ${attrs} type="${type}" value="${escape(value)}" maxlength="8000">`}${help ? `<small>${help}</small>` : ''}</label>`;
}
function uploadField(target, kind) {
  return `<label class="field wide">${kind === 'resume' ? 'Upload a new résumé' : 'Upload a project image'}<input type="file" data-upload="${target}" accept="${kind === 'resume' ? 'application/pdf' : 'image/png,image/jpeg,image/webp'}"><small>${kind === 'resume' ? 'PDF' : 'PNG, JPG, or WebP'} · Maximum 5 MB. Uploaded files are added to public/uploads.</small></label>`;
}
function render() {
  if (!content) return;
  $('#current-view').textContent = labels[view];
  document.querySelectorAll('[data-view]').forEach(button => { if (button.dataset.view === view) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
  if (view === 'overview') {
    const count = content.projects.filter(p => p.visible).length;
    main.innerHTML = heading('YOUR CREATIVE WORKSPACE', 'A little upkeep. A lasting impression.', 'Keep your work, your story, and your next opportunity up to date.') +
      `<section class="welcome"><div><p class="eyebrow">MADE BY YOU. MANAGED BY YOU.</p><h2>Your next chapter starts<br>with what you share.</h2><p>Add your latest build, refresh your links, or give your introduction a little attention.</p><button class="button primary" data-add>Add a project <span>+</span></button></div><div class="welcome-art" aria-hidden="true">a↗</div></section>` +
      `<div class="stats"><div class="stat"><span class="stat-label">Total projects</span><strong class="stat-value">${content.projects.length.toString().padStart(2, '0')}</strong><span class="stat-note">Your growing body of work</span></div><div class="stat"><span class="stat-label">Visible on portfolio</span><strong class="stat-value">${count.toString().padStart(2, '0')}</strong><span class="stat-note">Ready for visitors to explore</span></div><div class="stat"><span class="stat-label">Hidden projects</span><strong class="stat-value">${(content.projects.length - count).toString().padStart(2, '0')}</strong><span class="stat-note">Saved for another time</span></div></div>` +
      `<div class="section-heading"><div><h2>Your selected work</h2><p>A quick look at what you’re sharing.</p></div><button class="text-button" data-go="projects">Manage all ↗</button></div><div class="project-grid">${content.projects.filter(p => p.placement === 'selected').slice(0, 3).map(p => card(p, false)).join('') || '<div class="empty">Add a project to selected work to feature it here.</div>'}</div>` +
      `<div class="quick-grid"><button class="quick-card" data-go="profile"><span class="quick-icon">◎</span><span><strong>Make it personal</strong><small>Update your introduction & availability</small></span><span>↗</span></button><button class="quick-card" data-go="links"><span class="quick-icon">↗</span><span><strong>Keep the door open</strong><small>Refresh your links, contact & résumé</small></span><span>↗</span></button></div><p class="info-line">LOCAL WORKSPACE / Save here, preview your portfolio, then deploy when you’re ready to share.</p>`;
  }
  if (view === 'projects') {
    main.innerHTML = heading('THE THINGS YOU BUILD', 'Projects', 'Add, refine, reorder, or hide your work.', '<button class="button primary" data-add>Add project +</button>') +
      `<div class="toolbar"><input id="search" type="search" aria-label="Search projects" placeholder="Search by title or technology…" value="${escape(search)}"><select id="visibility-filter" aria-label="Filter projects"><option value="all">All projects</option><option value="visible">Visible</option><option value="hidden">Hidden</option></select></div><div class="project-grid" id="project-list"></div><p class="info-line">↑ ↓ changes order within each group. Use the project editor to change its placement.</p>`;
    $('#visibility-filter').value = filter; renderProjectList();
  }
  if (view === 'profile') {
    const p = content.profile;
    main.innerHTML = heading('YOUR STORY', 'Profile & copy', 'The words that introduce you, in your own voice.') +
      `<section class="panel"><h2>Introduction</h2><div class="fields">${field('name', 'Full name', p.name, { required: true })}${field('role', 'Professional title', p.role, { required: true })}${field('eyebrow', 'Intro label', p.eyebrow)}${field('availability', 'Availability message', p.availability)}${field('headline', 'Main headline', p.headline, { area: true, wide: true, required: true })}${field('intro', 'Introduction', p.intro, { area: true, wide: true })}${field('about', 'About you', p.about, { area: true, wide: true })}</div></section>` +
      `<section class="panel"><h2>Currently & focus</h2><div class="fields">${field('currentRole', 'Current position', p.currentRole)}${field('company', 'Company', p.company)}${field('focus', 'Focus', p.focus)}${field('focusDescription', 'Focus description', p.focusDescription, { area: true, wide: true })}</div></section>` +
      `<section class="panel"><h2>Contact copy & search appearance</h2><div class="fields">${field('contactTitle', 'Contact headline', p.contactTitle, { wide: true })}${field('contactIntro', 'Contact introduction', p.contactIntro, { area: true, wide: true })}${field('footerDescription', 'Footer description', p.footerDescription, { wide: true })}${field('seoDescription', 'Search engine description', p.seoDescription, { area: true, wide: true, help: 'Your browser title uses your full name and professional title.' })}</div></section>`;
  }
  if (view === 'links') {
    const p = content.profile;
    main.innerHTML = heading('STAY CONNECTED', 'Links & résumé', 'Make it easy for the right people to find you.') +
      `<section class="panel"><h2>Contact details</h2><div class="fields">${field('email', 'Email address', p.email, { type: 'email', required: true })}${field('phone', 'Phone number', p.phone, { type: 'tel' })}${field('location', 'Location', p.location, { wide: true })}</div></section>` +
      `<section class="panel"><h2>Social profiles</h2><div class="fields">${field('github', 'GitHub URL', p.github, { type: 'url', help: 'Leave blank to hide the GitHub buttons.' })}${field('linkedin', 'LinkedIn URL', p.linkedin, { type: 'url', help: 'Adds a LinkedIn link to your footer.' })}</div></section>` +
      `<section class="panel"><h2>Résumé</h2><p>Replace your PDF or link to a hosted résumé.</p><div class="fields">${field('resume', 'Résumé URL or file path', p.resume, { wide: true, help: 'Use https://… or /uploads/filename.pdf. Leave blank to hide the résumé link.' })}${uploadField('profile-resume', 'resume')}</div></section>`;
  }
  if (view === 'backups') {
    main.innerHTML = heading('KEEP A COPY', 'Backups & publishing', 'Your content stays portable. Keep a copy before making big changes.') +
      `<section class="panel"><h2>Export your content</h2><p>Download all projects, profile copy, and links as JSON. This includes your current unsaved draft. Image and PDF files stay in public/uploads and should be backed up with your project.</p><div class="backup-actions"><button class="button primary" id="export">Download content backup ↓</button></div></section>` +
      `<section class="panel"><h2>Restore from a backup</h2><p>Import a previously exported JSON file. You can review the restored draft before saving it to your project.</p><label class="field">Choose a backup<input type="file" id="import" accept="application/json,.json"></label></section>` +
      `<section class="panel"><h2>Discard unsaved changes</h2><p>Return to the last saved content. Uploaded files are retained in the project.</p><button class="button danger" id="discard" ${dirty() ? '' : 'disabled'}>Discard draft</button></section>` +
      `<section class="panel"><h2>How publishing works</h2><p>1. Save your changes here.<br>2. Open your portfolio to check them.<br>3. Deploy the project using your existing hosting workflow.</p><p>Content is saved in public/content.json. The previous saved version is kept in .local/content.previous.json. The admin interface and write API run only on your local development server and are excluded from the production build.</p><a class="button" href="/" target="_blank" rel="noopener">Open portfolio ↗</a></section>`;
  }
  main.querySelectorAll('.project-image img').forEach(img => img.addEventListener('error', () => img.setAttribute('data-failed', '')));
  sync();
}
function renderProjectList() {
  const projects = content.projects.filter(p => `${p.title} ${p.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || p.visible === (filter === 'visible')));
  $('#project-list').innerHTML = projects.map(p => card(p)).join('') || '<div class="empty">No projects here yet. Add a project or try a different search.</div>';
  main.querySelectorAll('.project-image img').forEach(img => img.addEventListener('error', () => img.setAttribute('data-failed', '')));
}
function navigate(next) { if (!labels[next] || !content) return; view = next; render(); main.focus(); }
function editProject(id) {
  editing = id;
  const p = content.projects.find(p => p.id === id) || { title: '', description: '', image: '', imageAlt: '', liveUrl: '', githubUrl: '', category: '', tags: [], placement: 'selected', visible: true };
  const pf = (key, label, options = {}) => field(key, label, p[key], { ...options, scope: 'project' });
  $('#dialog-title').textContent = id ? 'Edit project' : 'A new piece of work';
  $('#project-fields').innerHTML = `<div class="fields">${pf('title', 'Project name', { wide: true, required: true })}${pf('description', 'Description', { area: true, wide: true, required: true })}${pf('liveUrl', 'Live website URL', { type: 'url' })}${pf('githubUrl', 'GitHub repository URL', { type: 'url' })}${pf('image', 'Image URL or local path', { wide: true })}${uploadField('project-image', 'image')}${pf('imageAlt', 'Image description', { wide: true, help: 'Describe the screenshot for visitors using screen readers.' })}${pf('category', 'Category / role')}${field('tags', 'Technologies (comma separated)', p.tags.join(', '), { scope: 'project' })}<label class="field">Placement<select name="placement"><option value="selected">Selected work</option><option value="additional">Additional work</option><option value="more">More projects</option></select></label><label class="field checkbox-field"><input type="checkbox" name="visible" ${p.visible ? 'checked' : ''}> Visible on portfolio</label></div>${id ? '<div class="backup-actions"><button type="button" class="button" id="duplicate-project">Duplicate</button><button type="button" class="button danger" id="delete-project">Delete project</button></div>' : ''}`;
  $('#project-form select[name=placement]').value = p.placement;
  dialog.showModal();
}
document.querySelector('.sidebar nav').addEventListener('click', e => { const button = e.target.closest('[data-view]'); if (button) navigate(button.dataset.view); });
main.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.scope === 'profile') { content.profile[el.name] = el.value; sync(); }
  if (el.id === 'search') { search = el.value; renderProjectList(); }
});
main.addEventListener('change', async e => {
  if (e.target.id === 'visibility-filter') { filter = e.target.value; renderProjectList(); }
  if (e.target.id === 'import') {
    const file = e.target.files[0]; if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Choose a backup smaller than 1 MB.');
      const data = validateContent(JSON.parse(await file.text()));
      if (!await ask('Replace your current draft with this backup? Review it before saving.')) return;
      content = data; render(); notify('Backup imported into your draft. Review your content, then save.');
    } catch (err) { notify(err.message, true); e.target.value = ''; }
  }
});
main.addEventListener('click', async e => {
  const button = e.target.closest('button'); if (!button || !content) return;
  if (button.hasAttribute('data-add')) editProject(null);
  if (button.dataset.go) navigate(button.dataset.go);
  if (button.dataset.edit) editProject(button.dataset.edit);
  if (button.dataset.move) {
    const from = content.projects.findIndex(p => p.id === button.dataset.move);
    // Move inside the same placement, even when other groups are interleaved.
    let to = from + Number(button.dataset.direction);
    while (to >= 0 && to < content.projects.length && content.projects[to].placement !== content.projects[from].placement) to += Number(button.dataset.direction);
    if (to >= 0 && to < content.projects.length) { [content.projects[from], content.projects[to]] = [content.projects[to], content.projects[from]]; renderProjectList(); sync(); }
  }
  if (button.id === 'export') {
    const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (button.id === 'discard' && await ask('Discard all unsaved changes?')) { content = JSON.parse(saved); render(); notify('Returned to your last saved content.'); }
});
async function closeEditor() {
  if (pendingUploads) return notify('Wait for the upload to finish before closing the project editor.', true);
  const form = $('#project-form');
  if (form.dataset.changed === 'true' && !await ask('Close without applying these project changes?')) return;
  dialog.close(); form.dataset.changed = '';
}
$('#close-dialog').onclick = closeEditor;
$('#cancel-project').onclick = closeEditor;
dialog.addEventListener('cancel', e => { e.preventDefault(); closeEditor(); });
$('#project-form').addEventListener('input', () => { $('#project-form').dataset.changed = 'true'; });
$('#project-form').addEventListener('click', async e => {
  if (pendingUploads && ['delete-project', 'duplicate-project'].includes(e.target.id)) return notify('Wait for the upload to finish.', true);
  if (e.target.id === 'delete-project' && await ask('Delete this project from your draft? Save changes to make it permanent.')) {
    content.projects = content.projects.filter(p => p.id !== editing); dialog.close(); $('#project-form').dataset.changed = ''; render();
  }
  if (e.target.id === 'duplicate-project') {
    const original = content.projects.find(p => p.id === editing);
    content.projects.push({ ...structuredClone(original), id: crypto.randomUUID(), title: `${original.title} (copy)`, visible: false });
    dialog.close(); $('#project-form').dataset.changed = ''; render(); notify('Created a hidden copy. You can edit it before showing it.');
  }
});
$('#project-form').addEventListener('submit', e => {
  e.preventDefault();
  if (pendingUploads) return notify('Wait for the image upload to finish.', true);
  const values = Object.fromEntries(new FormData(e.target));
  const p = { ...values, id: editing || crypto.randomUUID(), tags: values.tags.split(',').map(s => s.trim()).filter(Boolean), visible: values.visible === 'on' };
  const draft = structuredClone(content); const index = draft.projects.findIndex(item => item.id === editing);
  if (index >= 0) draft.projects[index] = p; else draft.projects.push(p);
  try { content = validateContent(draft); dialog.close(); e.target.dataset.changed = ''; render(); notify('Project applied to your draft. Save changes when you’re ready.'); } catch (err) { notify(err.message, true); }
});
document.addEventListener('change', async e => {
  const input = e.target;
  if (!input.dataset.upload || !input.files[0]) return;
  const file = input.files[0]; const target = document.getElementById(input.dataset.upload);
  if (file.size > 5 * 1024 * 1024) { input.value = ''; return notify('Choose a file smaller than 5 MB.', true); }
  if ((input.dataset.upload === 'profile-resume' && file.type !== 'application/pdf') || (input.dataset.upload === 'project-image' && !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))) { input.value = ''; return notify('Choose a supported file type.', true); }
  pendingUploads++; input.disabled = true; sync();
  try {
    const response = await fetch('/api/admin/upload', { method: 'POST', headers: { 'X-Portfolio-Admin': '1', Authorization: `Bearer ${token}`, 'Content-Type': file.type }, body: file });
    const result = await response.json(); if (!response.ok) throw new Error(result.error);
    target.value = result.url;
    if (target.dataset.scope === 'profile') content.profile[target.name] = result.url;
    else $('#project-form').dataset.changed = 'true';
    notify('File uploaded. Save your changes to use it on your portfolio.');
  } catch (err) { notify(err.message, true); } finally { pendingUploads--; input.disabled = false; input.value = ''; sync(); }
});
$('#save').addEventListener('click', async () => {
  if (!dirty() || busy || pendingUploads) return;
  try {
    const snapshot = JSON.stringify(validateContent(content));
    busy = true; sync();
    const response = await fetch('/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Portfolio-Admin': '1', Authorization: `Bearer ${token}`, 'If-Match': revision }, body: snapshot });
    const result = await response.json(); if (!response.ok) throw new Error(result.error);
    revision = result.revision; saved = snapshot;
    notify('Saved to your project. Refresh the portfolio to see your changes; deploy to update the public site.');
  } catch (err) { notify(err.message, true); } finally { busy = false; sync(); }
});
addEventListener('beforeunload', e => { if (dirty() || $('#project-form').dataset.changed === 'true' || pendingUploads) { e.preventDefault(); e.returnValue = ''; } });
$('#logout').addEventListener('click', async () => {
  if (pendingUploads || busy) return notify('Wait for the current save or upload to finish.', true);
  if (dirty() && !await ask('Log out and discard unsaved changes? Export a backup first if you want to keep your draft.')) return;
  try {
    const response = await fetch('/api/admin/logout', { method: 'POST', headers: { 'X-Portfolio-Admin': '1', Authorization: `Bearer ${token}` } });
    if (!response.ok && response.status !== 401) throw new Error('Could not log out. Please try again.');
    content = null; saved = null; $('#project-form').dataset.changed = ''; location.replace('/login.html');
  } catch (err) { notify(err.message, true); }
});
async function start() {
  try {
    const response = await fetch('/api/admin/session', { headers: { 'X-Portfolio-Admin': '1' } });
    if (response.status === 401) { location.replace('/login.html'); return; }
    if (!response.ok) throw new Error('Start the project locally with npm run dev, then open /admin.html on localhost.');
    const data = await response.json(); content = validateContent(data.content); saved = JSON.stringify(content); token = data.token; revision = data.revision; render();
  } catch (err) { main.innerHTML = heading('LOCAL EDITOR', 'Workspace unavailable', escape(err.message)) + '<p class="info-line">This admin area runs on your computer. It is not a hosted login page.</p>'; sync(); }
}
start();
