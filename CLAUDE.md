# CLAUDE.md

## Project
A recipe website. The homepage lists popular recipes, ranked by user likes. Users browse, search, save, like, and comment on recipes. Built with Express + EJS + MySQL.

## Stack
- Runtime: Node.js
- Server: Express
- View engine: EJS
- Database: MySQL (via `mysql2` with the Promise API)
- Session: `express-session` + `cookie-parser` (used for "remember me")
- Security: `csurf` (CSRF), `bcrypt` (password hashing)
- Dev: `nodemon`
- Desktop notifications: `node-notifier`, `dialog-node`

## Commands
- Start (dev): `npm start` (internally runs `npx nodemon`)

## Domain Features (from the brief)
- Two user roles:
  - **Chef**: can add recipes to the site.
  - **Regular user**: can comment, save recipes, and like recipes.
- Auth-gated actions: liking, saving, and commenting require a logged-in user.
- Homepage: popular recipes section, ranked by like count.
- Search (two modes, both at the top of the site):
  - Text search by recipe name OR by a single ingredient.
  - Ingredient-based search right next to the main search: a list of ingredient names; the user picks ingredients and matching recipes are returned.
- Sidebar categories: Breakfast, Soups, Desserts, etc.
- Daily Menu: one random recipe from each category, refreshed every day.
- Site Map.
- IP-based Visitor Counter.
- Online User Count.
- Announcement / News module.
- Image Gallery (stored locally; items added through the admin panel only).
- Admin Panel and User Authorization.
- CSRF protection.
- Slugify for URLs.

## Architecture
- `index.js` → app entry; mounts global middleware in a fixed order, then routers, then 404 + error handler.
- `router/` → URL → controller mapping (`admin.js`, `auth.js`, `user.js`).
- `controller/` → request handlers, one `exports.fn` per route.
- `middleware/` → reusable middleware (`config_Session.js`, `csrf.js`, `isAuth.js`, `locals.js`).
- `model/db.js` → single MySQL connection, exported via `.promise()`.
- `model/data.js`, `model/authdata.js` → legacy in-memory data (kept as lecture notes).
- `messagebox/` → server-side desktop notifications (`notifier.js`, `dialognode.js`).
- `views/admin/`, `views/auth/`, `views/user/` → EJS templates per area.
- `views/partials/` → `header.ejs`, `topmenu.ejs`, `side.ejs`, `scripts.ejs`.
- `public/` → static assets, served at `/static`.

## Middleware Order in index.js (DO NOT REORDER)
1. `app.set("view engine", "ejs")`
2. `app.use("/static", express.static(path.join(__dirname, "public")))`
3. `bodyParser.urlencoded({ extended: true })`
4. `configSession`
5. `cookieParser()`
6. `locals` (sets `res.locals.fullname` from `req.session.fullname`)
7. `csurf()` — MUST come AFTER `cookieParser` + session and BEFORE routers
8. Routers: `/admin`, `/user`, `/auth`
9. 404 handler: `next("Kaynak yok")`
10. Error handler: `res.render("admin/error.ejs", { err })`
11. `app.listen(3000, ...)`

## Request Flow
```
client → index.js (global middleware) → router/xxx.js
                                        → [isAuth] → [csrf] → controller/xxx.js
                                                              → model/db.js (MySQL)
                                                              → res.render(view, data)
```

## Rules
- **IMPORTANT**: Never change the middleware ordering in `index.js`. `csurf` must sit after `cookieParser` + session and before routers.
- Use `db.execute(sql, params)` and treat the result shape as `[rows, fields]`:
  - Row list: `result[0]`
  - First row: `result[0][0]`
  - All controllers depend on this contract — do not change it.
- All passwords are stored as bcrypt hashes. Use `bcrypt.compare` to verify; never store plaintext.
- Every POST form in EJS MUST include: `<input type="hidden" name="_csrf" value="<%= csrfToken %>">`
- The `csrf` middleware is added ONLY to GET routes that render a form. Never on POST routes — `csurf()` already validates POSTs globally.
- Protected routes use the `isAuth` middleware. When auth fails, redirect to `/auth/login?url=<original-url>`; the controller must honor `req.query.url` after successful login.
- Controllers must be `async (req, res, next)` with `try/catch`; on error call `return next(err)` so the global handler renders `admin/error.ejs`.
- Render parameter contract: pass at least `title` and `contentTitle` to every view. Use `data` for a list, `viewData` for a single record.
- Liking, saving, and commenting endpoints MUST be behind `isAuth`. Block these actions for guests at the route level, not only in the UI.
- Image Gallery files live locally; uploads go through the admin panel only. Do not introduce external/CDN storage.
- All URLs derived from titles must go through slugify.
- IP-based Visitor Counter counts unique IPs; Online User Count tracks active sessions.

## Workflow
- Ask clarifying questions before starting complex tasks.
- Make minimal changes; do not refactor unrelated code.
- Match the existing style even if you would write it differently (mixed Turkish/English identifiers, Turkish comments, Turkish user-facing text).
- When adding a new module, follow this order:
  1. `controller/<name>.js` — one `exports.fn` per route, async + try/catch + `next(err)`.
  2. `router/<name>.js` — add `csrf` to GET form routes, `isAuth` to anything protected.
  3. `views/<name>/` — new EJS templates, include partials, add `_csrf` hidden inputs.
  4. `index.js` — mount the new router with `app.use("/<prefix>", newRouter)`.
- For every change, state success criteria up front and verify them before claiming done.
- Create separate commits per logical change, not one giant commit.
- When two reasonable approaches exist, explain both and let me choose.

## Language & Style
- All user-facing text is Turkish.
- Code comments are Turkish; variable names mix English and Turkish (e.g. `anc`, `noticeid`, `cbhatirla`). Preserve this style.

## Database Schema (inferred from existing queries)
- `users(userid, email, password, name, surname)` — `password` is a bcrypt hash.
- `anc(noticeid, title, exp, isactive, userid)` — `userid` FK to `users.userid`.
- New tables for recipes, categories, ingredients, likes, comments, saves, gallery, announcements, visitor stats, etc. must be designed for this project, but every controller MUST keep using the same `db.execute(sql, [...])` call shape.

## Auth Flow (existing contract)
1. `GET /auth/login` → `getLogin`: reads email/password from cookie ("remember me"), shows `req.session.message` if any, renders the login view.
2. `POST /auth/login` → `postLogin`: looks up the user by email, `bcrypt.compare` for password, writes `isAuth`, `fullname`, `userid` to session, then redirects to `req.query.url` if present, otherwise to the default inner page.
3. If "remember me" is checked, email/password are written as cookies; if unchecked, existing cookies are cleared.
4. `GET /auth/signout` → `req.session.destroy()` and redirect to `/auth/login`.

## messagebox/ Usage
Server-side desktop notifications. Works only on a desktop OS — skip in headless environments instead of refactoring.
```js
const notifierShow = require("../messagebox/notifier.js");
notifierShow("Uyarı", "İşlem başarılı.", () => { res.redirect("..."); });
```

## Out of Scope
- No SSR framework swaps — stay on Express + EJS.
- No ORM. Direct `mysql2` queries only.
- Do not change `model/db.js`'s `.promise()` export contract — all controllers depend on it.
- Do not delete `model/data.js` or `model/authdata.js`; they are kept as lecture notes.
- `messagebox/` is desktop-only; do not refactor it for headless use.

---

# Behavioral Guidelines

These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove imports/variables/functions that YOUR changes made unused; don't remove pre-existing dead code unless asked.
- Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.