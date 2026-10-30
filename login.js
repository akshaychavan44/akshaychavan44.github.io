const form = document.getElementById('login-form');
const password = document.getElementById('password');
const toggle = document.getElementById('toggle-password');
const error = document.getElementById('login-error');
const submit = document.getElementById('login-submit');
toggle.addEventListener('click', () => {
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  toggle.textContent = visible ? 'Hide' : 'Show';
  toggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
  toggle.setAttribute('aria-pressed', String(visible));
});
form.addEventListener('submit', async event => {
  event.preventDefault(); error.hidden = true; submit.disabled = true; submit.textContent = 'Signing in…';
  try {
    const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Portfolio-Admin': '1' }, body: JSON.stringify({ email: form.elements.email.value, password: password.value }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not sign in. Please try again.');
    password.value = ''; location.replace('/admin.html');
  } catch (err) { error.textContent = err.message; error.hidden = false; }
  finally { submit.disabled = false; submit.textContent = 'Sign in ↗'; }
});
fetch('/api/admin/session', { headers: { 'X-Portfolio-Admin': '1' } }).then(response => { if (response.ok) location.replace('/admin.html'); }).catch(() => {});
