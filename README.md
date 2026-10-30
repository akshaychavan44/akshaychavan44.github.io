# Personal Portfolio

This is my personal portfolio website built using HTML, CSS, and JavaScript. It showcases my skills, projects, GitHub profile, and contact information.

## Tech Stack

- HTML
- CSS
- JavaScript

## Local admin studio

Run `npm install` once, then `npm run dev -- --host 127.0.0.1` and open `/admin.html` at the printed local URL.

The studio manages all nine existing projects and supports adding, editing, duplicating, deleting, hiding, grouping, and ordering projects. Edit project screenshots, technology tags, live and GitHub links; update profile copy, availability, contact details, social links, résumé, and the search description. Upload PNG/JPG/WebP screenshots or a PDF résumé (5 MB maximum). Export and import content backups from the Backups page.

Changes remain a draft until **Save changes** writes `public/content.json`. Refresh the portfolio to review saved changes. To update the public website, deploy the changed project using your usual hosting workflow. Uploaded assets live in `public/uploads`; include them with the content file when committing/deploying. Back up that folder separately from JSON exports. A copy of the previous save is retained at `.local/content.previous.json` (ignored by Git).

This is a local editor with an email/password login at `/login.html`, available only through the Vite development server on this computer; it is not a hosted CMS. Your configured account uses a salted password hash in `.local/admin-auth.json`, which is ignored by Git and blocked from web access. Login creates an eight-hour, HttpOnly, SameSite cookie session; logout revokes it. Five failed attempts trigger a 30-second cooldown. Restarting the server signs everyone out. Credentials are local to this checkout and must be configured separately on another machine.

The admin and login pages, their scripts, and the write API are excluded from `npm run build`. The public site reads deployed content JSON without exposing write access. Remote administration would require a hosted API and persistent storage, with the authentication adapted for HTTPS hosting.

Keep the dev server bound to `127.0.0.1`. The write API checks loopback access, request origin, a session token, file types, size limits, and content structure. Concurrent editors get a conflict warning rather than overwriting each other. Do not store secrets in public portfolio content.

## Sections

- Home
- About
- Skills
- Projects
- Contact

## Live Demo

https://akshaychavan44.github.io

## Contact

- GitHub: https://github.com/akshaychavan44
- Email: akshaychavan44.ac@gmail.com
