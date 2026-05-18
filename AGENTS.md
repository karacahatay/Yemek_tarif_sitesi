# AGENTS.md

## Project
A recipe website. Homepage lists popular recipes ranked by user likes. Users browse, search, save, like, and comment on recipes. Built as an Express **JSON API** with a separate **React + Vite SPA** frontend.

## Stack
### Backend (`/`)
- Runtime: Node.js
- Server: Express (JSON API)
- Database: MySQL (via `mysql2` Promise API)
- Session: `express-session` + `cookie-parser` (used for "remember me")
- Security: `csurf` (cookie mode), `bcrypt`
- Uploads: `multer` (saves under `public/uploads/{recipes,gallery}/`)
- URL: `slugify`
- Dev: `nodemon`
- Desktop notifications: `node-notifier`, `dialog-node` (desktop-only, optional)

### Frontend (`/frontend`)
- React 18 + react-router-dom v6
- Vite dev server (port 5173)
- Vite proxy: `/api` and `/static` → `http://localhost:3000`
- No CSS framework; vanilla CSS in `src/styles.css`

## Commands
- Backend dev: `npm start` (runs `npx nodemon`, listens on `:3000`)
- Frontend dev: `cd frontend && npm run dev` (listens on `:5173`)
- DB schema: `mysql -u root -p < schema.sql`
- Seed data: `node seed.js`

## Domain Features
- Two user roles:
  - **Chef**: can add recipes via admin panel.
  - **Regular user**: can comment, save, and like recipes.
- Auth-gated actions: liking, saving, commenting — server enforces 401 at route level.
- Homepage: popular recipes (by like count) + daily menu + active announcements banner.
- Search:
  - Text search by recipe name OR ingredient name.
  - Ingredient-based AND-search (all selected ingredients must match).
- Sidebar categories (loaded from `/api/categories`).
- Daily Menu: one random recipe per category, refreshed daily (stable within the day).
- Sitemap, IP visitor counter, online user count (in-memory), announcement module, image gallery.
- Admin Panel: chef CRUD on own recipes; admin CRUD on announcements + gallery.
- CSRF (cookie mode + `X-CSRF-Token` header).
- Slugify for all recipe URLs.

## Architecture

### Backend
- `index.js` → app entry; middleware in fixed order; mounts routers under `/api/*`.
- `router/` → `auth.js`, `user.js`, `admin.js`, `meta.js`.
- `controller/` → request handlers (one `exports.fn` per route, all return JSON).
- `middleware/` → `config_Session.js`, `isAuth.js`, `requireRole.js`, `stats.js`, `uploads.js`.
- `model/db.js` → single MySQL connection, exported via `.promise()`.
- `model/data.js`, `model/authdata.js` → legacy in-memory data (kept as lecture notes).
- `messagebox/` → desktop notifications (optional, skip in headless).
- `public/` → static assets served at `/static`; uploads go under `public/uploads/{recipes,gallery}/`.

### Frontend (`frontend/`)
- `src/main.jsx` → React entry, wraps app in `BrowserRouter` + `AuthProvider`.
- `src/App.jsx` → top-level routes (`/`, `/login`, …, `/admin/*`).
- `src/api/client.js` → `apiGet`, `apiPost`, `apiPostForm`; CSRF token cached and added as header.
- `src/context/AuthContext.jsx` → session state, `login`, `register`, `signout`, `refresh`.
- `src/layout/` → `Layout.jsx` (TopBar + Sidebar + Footer), `AdminLayout.jsx` (AdminSidebar + outlet).
- `src/components/` → `RecipeCard.jsx`, `Guards.jsx` (`RequireAuth`), `AdminSidebar.jsx`.
- `src/pages/` → public + auth-gated pages.
- `src/pages/admin/` → admin pages.

## Middleware Order in `index.js` (DO NOT REORDER)
1. `app.use("/static", express.static(...))`
2. `express.json()` (POST bodies are JSON unless multipart)
3. `bodyParser.urlencoded({ extended: true })`
4. `configSession`
5. `cookieParser()` — required for csurf cookie mode
6. `stats` — IP visitor + online tracking
7. `csurf({ cookie: true })` — must sit AFTER cookieParser + session, BEFORE routers
8. Routers: `/api`, `/api/auth`, `/api/admin`, `/api`
9. 404 handler → `res.status(404).json({ error: "Kaynak yok" })`
10. Error handler → `res.status(...).json({ error })`; CSRF errors return 403
11. `app.listen(3000, ...)`

## Request Flow
```
React (5173) → Vite proxy → Express (3000)
   GET  /api/csrf-token  → token cached client-side
   POST /api/...          → X-CSRF-Token header + cookie validated by csurf
                          → [isAuth] → [requireRole] → controller
                          → res.json(...)
```

## Rules
- **IMPORTANT**: Never change `index.js` middleware ordering. `csurf` must sit after `cookieParser` + session and before routers.
- All controllers return **JSON**. Never call `res.render` (no view engine).
- Use `db.execute(sql, params)` with shape `[rows, fields]`:
  - Row list: `result[0]`
  - First row: `result[0][0]`
  - This contract is load-bearing across all controllers — do not change it.
- Passwords are bcrypt hashes. Use `bcrypt.compare` to verify; never store plaintext.
- POST requests from the frontend MUST include `X-CSRF-Token` header (the `apiPost`/`apiPostForm` helpers do this automatically).
- For multipart (multer) routes, the `apiPostForm` helper builds `FormData` and adds the CSRF header. Do not put the token in the body.
- Protected routes use `isAuth` (returns 401 JSON when missing); chef/admin routes use `requireRole(...)` (returns 403 JSON).
- Auth-gated actions (like, save, comment) are enforced at the **route level** — never rely on UI hiding alone.
- Image uploads go to `public/uploads/{recipes,gallery}/`. No external/CDN storage.
- All recipe URLs go through `slugify`.
- IP visitor counter counts unique IPs; online count tracks active sessions (in-memory `Map`, 5-minute timeout).

## Workflow
- Ask clarifying questions before complex tasks.
- Make minimal, surgical changes.
- Match the existing style (mixed Turkish/English identifiers, Turkish comments, Turkish user-facing text).
- New backend module order: `controller/<name>.js` → `router/<name>.js` → mount in `index.js`.
- New frontend page order: `src/pages/<Name>.jsx` → import in `App.jsx` → wire route.
- When two reasonable approaches exist, explain both and let me choose.

## Language & Style
- All user-facing text is Turkish.
- Code comments are Turkish; identifiers mix English and Turkish (`anc`, `noticeid`, `cbhatirla`). Preserve this style.

## Database Schema
See `schema.sql`. Tables:
- `users` (userid, email, password bcrypt, name, surname, role enum)
- `categories` (categoryid, name, slug)
- `ingredients` (ingredientid, name)
- `recipes` (recipeid, title, slug, exp, instructions, image, categoryid, userid)
- `recipe_ingredients` (recipeid, ingredientid, amount)
- `likes`, `saves` (userid + recipeid composite PK)
- `comments` (commentid, recipeid, userid, body)
- `anc` (noticeid, title, exp, isactive, userid) — announcements
- `gallery` (galleryid, title, image, userid)
- `visitors` (ip PK, lastSeen, visits)

## Auth Flow
1. SPA boot → `GET /api/csrf-token` (cache) + `GET /api/session` (current user).
2. `POST /api/auth/login` { email, password, hatirla } → bcrypt compare → session + JSON `{ user }`.
3. If `hatirla` true, email/password written to cookies; else cleared.
4. `POST /api/auth/signout` → `req.session.destroy()`.
5. Frontend `apiGet`/`apiPost` use `credentials: "include"`; on 401 they dispatch `auth:unauthorized` and `AuthContext` clears `user`.

## Out of Scope
- **Backend**: Stay on Express + MySQL. No ORM. Do not change `model/db.js`'s `.promise()` export.
- **Frontend**: Stay on React + Vite + react-router-dom. No additional state library (Redux/Zustand) unless required.
- Do not delete `model/data.js` or `model/authdata.js`; lecture notes.
- `messagebox/` is desktop-only; do not refactor for headless.
- Do not re-introduce EJS views — the project is API-only on the backend side.
