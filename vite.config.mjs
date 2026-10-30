import { defineConfig } from 'vite';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { randomBytes, randomUUID, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateContent } from './content-schema.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const file = new URL('./public/content.json', import.meta.url);
const revision = value => createHash('sha256').update(value).digest('hex');

export default defineConfig({
  server: {
    fs: { deny: ['.env', '.env.*', '**/.git/**', '**/.local/**', '**/*.{crt,pem}'] },
    watch: { ignored: ['**/public/content.json', '**/public/.content.tmp', '**/public/uploads/**', '**/.local/**'] },
  },
  plugins: [{
    name: 'local-portfolio-admin',
    async configureServer(server) {
      const sessions = new Map();
      const failures = new Map();
      let saving = false;
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0];
        if (!path?.startsWith('/api/admin/')) return next();
        const send = (status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(body)); };
        // Local editor only. Custom headers and strict origin checks prevent cross-site writes.
        const address = req.socket.remoteAddress;
        const host = req.headers.host;
        if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address) || !/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host || '') || req.headers['x-portfolio-admin'] !== '1' || (req.headers.origin && req.headers.origin !== `http://${host}`) || (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin')) return send(403, { error: 'Admin access is available only from this computer and origin.' });
        try {
          if (path === '/api/admin/login' && req.method === 'POST') {
            const credentials = await readFile(new URL('./.local/admin-auth.json', import.meta.url), 'utf8').then(JSON.parse).catch(() => null);
            if (!credentials) return send(503, { error: 'Admin credentials have not been configured on this computer.' });
            const attempt = failures.get(address);
            if (attempt?.until > Date.now()) return send(429, { error: 'Too many attempts. Please try again in 30 seconds.' });
            let body = '';
            for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 4096) return send(413, { error: 'Login request is too large.' }); }
            const { email, password } = JSON.parse(body);
            if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 256) return send(400, { error: 'Enter your email and password.' });
            const supplied = scryptSync(password, credentials.salt, 64);
            if (email.trim().toLowerCase() !== credentials.email || !timingSafeEqual(supplied, Buffer.from(credentials.hash, 'hex'))) {
              const count = attempt?.until && attempt.until <= Date.now() ? 1 : (attempt?.count || 0) + 1;
              failures.set(address, { count, until: count >= 5 ? Date.now() + 30_000 : 0 });
              return send(401, { error: 'Email or password is incorrect.' });
            }
            failures.delete(address);
            for (const [key, value] of sessions) if (value.expires <= Date.now()) sessions.delete(key);
            if (sessions.size >= 20) sessions.delete(sessions.keys().next().value);
            const id = randomBytes(32).toString('hex');
            sessions.set(id, { token: randomBytes(32).toString('hex'), expires: Date.now() + 8 * 60 * 60 * 1000 });
            res.setHeader('Set-Cookie', `portfolio_admin=${id}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=28800`);
            return send(200, { ok: true });
          }
          const cookie = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith('portfolio_admin='))?.slice('portfolio_admin='.length);
          const session = sessions.get(cookie);
          if (!session || session.expires <= Date.now()) {
            if (cookie) sessions.delete(cookie);
            return send(401, { error: 'Please sign in to the admin studio. Your session may have expired.' });
          }
          const token = session.token;
          if (path === '/api/admin/session' && req.method === 'GET') {
            const raw = await readFile(file, 'utf8');
            return send(200, { token, revision: revision(raw), content: JSON.parse(raw) });
          }
          if (req.headers.authorization !== `Bearer ${token}`) return send(401, { error: 'Your editor session expired. Reload this page.' });
          if (path === '/api/admin/logout' && req.method === 'POST') {
            sessions.delete(cookie);
            res.setHeader('Set-Cookie', 'portfolio_admin=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0');
            return send(200, { ok: true });
          }
          if (path === '/api/admin/content' && req.method === 'PUT') {
            if (saving) return send(409, { error: 'Another save is in progress. Try again.' });
            saving = true;
            try {
              let body = '';
              for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 1024 * 1024) return send(413, { error: 'Content is too large (maximum 1 MB).' }); }
              const content = validateContent(JSON.parse(body));
              const previous = await readFile(file, 'utf8');
              if (req.headers['if-match'] !== revision(previous)) return send(409, { error: 'Content changed in another tab. Export your draft, then reload before saving.' });
              const raw = JSON.stringify(content, null, 2) + '\n';
              await mkdir(new URL('./.local/', import.meta.url), { recursive: true });
              await writeFile(new URL('./.local/content.previous.json', import.meta.url), previous);
              const temporary = new URL('./public/.content.tmp', import.meta.url);
              await writeFile(temporary, raw);
              await rename(temporary, file);
              send(200, { revision: revision(raw) });
            } finally { saving = false; }
            return;
          }
          if (path === '/api/admin/upload' && req.method === 'POST') {
            const chunks = []; let length = 0;
            for await (const chunk of req) { length += chunk.length; if (length > 5 * 1024 * 1024) return send(413, { error: 'Choose a file smaller than 5 MB.' }); chunks.push(chunk); }
            const bytes = Buffer.concat(chunks);
            const type = req.headers['content-type'];
            const valid = type === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png'
              : type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'jpg'
              : type === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' ? 'webp'
              : type === 'application/pdf' && bytes.toString('ascii', 0, 5) === '%PDF-' ? 'pdf' : null;
            if (!valid) return send(400, { error: 'Supported uploads: PNG, JPG, WebP images or PDF résumé.' });
            await mkdir(`${root}/public/uploads`, { recursive: true });
            const filename = `${randomUUID()}.${valid}`;
            await writeFile(`${root}/public/uploads/${filename}`, bytes);
            return send(201, { url: `/uploads/${filename}` });
          }
          send(404, { error: 'Unknown admin endpoint.' });
        } catch (error) { send(400, { error: error instanceof SyntaxError ? 'Invalid JSON file.' : error.message }); }
      });
    },
  }],
});
