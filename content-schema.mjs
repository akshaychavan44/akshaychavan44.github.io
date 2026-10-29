export const profileFields = ['name', 'role', 'eyebrow', 'headline', 'intro', 'about', 'availability', 'currentRole', 'company', 'focus', 'focusDescription', 'location', 'email', 'phone', 'github', 'linkedin', 'resume', 'contactTitle', 'contactIntro', 'footerDescription', 'seoDescription'];
export function safeUrl(value, local = false) {
  if (!value) return true;
  if (local && /^\/(?!\/)[a-zA-Z0-9_./% ()-]+$/.test(value) && !value.includes('..')) return true;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
}
export function validateContent(data) {
  const fail = message => { throw new Error(message); };
  const string = (value, label, required = false, max = 8000) => {
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(`Check ${label}: ${required ? 'required, ' : ''}maximum ${max} characters.`);
  };
  if (!data || data.version !== 1 || !data.profile || !Array.isArray(data.projects) || data.projects.length > 100) fail('Invalid portfolio file. Expected version 1 and up to 100 projects.');
  profileFields.forEach(key => string(data.profile[key], key, ['name', 'role', 'headline', 'email'].includes(key)));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.profile.email)) fail('Enter a valid email address.');
  for (const key of ['github', 'linkedin', 'resume']) if (!safeUrl(data.profile[key], key === 'resume')) fail(`Use an HTTP(S) URL${key === 'resume' ? ' or /local-file path' : ''} for ${key}.`);
  const ids = new Set();
  data.projects.forEach((p, i) => {
    const label = `project ${i + 1}`;
    if (!p || typeof p !== 'object') fail(`Invalid ${label}.`);
    for (const key of ['id', 'title', 'description', 'image', 'imageAlt', 'liveUrl', 'githubUrl', 'category']) string(p[key], `${label} ${key}`, ['id', 'title', 'description'].includes(key));
    if (ids.has(p.id)) fail('Project IDs must be unique.');
    ids.add(p.id);
    if (!['selected', 'additional', 'more'].includes(p.placement) || typeof p.visible !== 'boolean') fail(`Invalid placement or visibility for ${label}.`);
    if (!Array.isArray(p.tags) || p.tags.length > 30) fail(`Use up to 30 tags for ${label}.`);
    p.tags.forEach(tag => string(tag, `${label} tag`, true, 100));
    for (const key of ['image', 'liveUrl', 'githubUrl']) if (!safeUrl(p[key], key === 'image')) fail(`Invalid ${key} for ${label}. Use HTTP(S) or a local image path.`);
  });
  // Return only known fields, so backups and imports cannot persist arbitrary properties.
  return { version: 1, profile: Object.fromEntries(profileFields.map(key => [key, data.profile[key]])), projects: data.projects.map(p => Object.fromEntries(['id', 'title', 'description', 'image', 'imageAlt', 'liveUrl', 'githubUrl', 'category', 'tags', 'placement', 'visible'].map(key => [key, p[key]]))) };
}
