Every Claude Code session starts by reading one file: CLAUDE.md. Before your first prompt, before any code, before anything happens, Claude reads this file and treats it as ground truth for the entire session.
Most people either don't have one, or theirs is 300 lines of personality instructions.
The difference between a good CLAUDE.md and a bad one is the difference between onboarding a senior engineer with a clear brief and throwing a new hire into a codebase with no documentation.
Here's how to write one that actually works👇
Before we dive in, I share daily notes on AI & vibe coding in my Telegram channel: https://t.me/zodchixquant🧠
Why most CLAUDE.md files don't work
Three reasons:
Too long. Models can reliably follow about 150-200 instructions. Claude Code's system prompt already contains roughly 50. That means your CLAUDE.md gets maybe 100-150 instructions before Claude starts dropping things. If your file is 200+ lines, Claude isn't ignoring your rules on purpose.
Wrong content. Most people fill CLAUDE.md with things Claude can figure out on its own. Personality instructions like "be a senior engineer" or "think step by step." General advice that doesn't change Claude's behavior. Every line that doesn't prevent a specific mistake is a wasted instruction.
No hierarchy. CLAUDE.md isn't the only place to put instructions. There are three levels and most people dump everything into one:
~/.claude/CLAUDE.md       → Global (every project)
.claude/CLAUDE.md         → Project (shared with team, in git)  
./CLAUDE.local.md         → Local (personal overrides, gitignored)
Global is for rules you'd repeat in every project. Project is for stack-specific context your team needs. Local is for your personal quirks. 
Using all three keeps each file short and focused.
The 5 sections that actually matter
After going through dozens of production CLAUDE.md files from open-source projects, Anthropic's own docs, and community best practices repos, every effective file covers these 5 things:
1. Critical commands
Claude doesn't know how to build, test, or lint your project = tell it.
## Commands
- Build: `npm run build`
- Dev: `npm run dev`  
- Test single file: `npm test -- path/to/file`
- Lint + fix: `npm run lint:fix`
- Type check: `npx tsc --noEmit`
Short and specific. Claude runs these instead of guessing. Without this section, Claude will try npm test when your project uses pnpm vitest and waste 3 turns debugging a command that was never going to work.
2. Architecture map
Claude starts every session with zero knowledge of your codebase. Give it a map.
## Architecture  
- src/lib/services/ → all business logic
- src/components/ → stateless UI components only
- src/lib/store/ → global state (Zustand)
- src/app/api/ → API routes, no business logic here
- Database access only through Server Actions or API routes
Not a full directory listing. Just enough so Claude knows where things live and what goes where. 
3. Hard rules (the things Claude gets wrong without you)
This is the most important section. Every rule here should answer: "Would removing this line cause Claude to make a mistake?"
## Rules
- NEVER commit .env files or secrets
- All async calls must use try/catch
- Use functional components only, no class components
- Prefix commits: feat:, fix:, docs:, refactor:
- All PRs must pass `npm run verify` before merge
- Static export only, no SSR (deployed to S3)
- IMPORTANT: run type check after every code change
Two things to notice: 
1. negative rules are as important as positive ones ("never commit .env")
2. emphasis markers like IMPORTANT actually work.
Anthropic's own docs confirm that adding "IMPORTANT" or "YOU MUST" improves adherence.
Keep this section under 15 rules.
4. Workflow preferences
How do you want Claude to work? This prevents the "Claude rewrites your entire file when you asked for a one-line fix" problem.
## Workflow
- Ask clarifying questions before starting complex tasks
- Make minimal changes, don't refactor unrelated code
- Run tests after every change, fix failures before moving on
- Create separate commits per logical change, not one giant commit
- When unsure between two approaches, explain both and let me choose
5. What NOT to include
Equally important is what you leave out:
## Don't include:
- Personality instructions ("be a senior engineer")
- Code formatting rules your linter already handles  
- @-imports that embed entire docs into every session
- Duplicate rules (if global says "run tests," project doesn't repeat it)
- Anything Claude will learn on its own via auto memory
Auto memory is underrated here. Claude maintains its own notes at ~/.claude/projects/<project>/memory/. Run /memory to see what Claude has already learned about your project. 
Don't waste CLAUDE.md lines on things Claude figured out after one session.
The full template (copy this)
Here's a production-ready CLAUDE.md you can copy and adapt. Under 60 lines. Covers everything Claude needs, nothing it doesn't.
# CLAUDE.md

## Project
[One line: what this project does and who uses it]

## Stack  
[Framework, language, database, deployment target]

## Commands
- Dev: `[command]`
- Build: `[command]`
- Test single: `[command] -- [path]`
- Test all: `[command]`
- Lint: `[command]`
- Type check: `[command]`

## Architecture
- [folder] → [what lives here]
- [folder] → [what lives here]
- [folder] → [what lives here]
- [file] → [what this file does]

## Rules
- [Rule that prevents a specific mistake]
- [Rule that prevents a specific mistake]
- [Rule that prevents a specific mistake]
- IMPORTANT: [The one rule Claude keeps breaking]

## Workflow
- [How you want Claude to approach tasks]
- [Commit conventions]
- [Testing expectations]
- [When to ask vs when to act]

## Out of scope
- [Things Claude should not touch]
- [Files that are manually maintained]
- [Integrations Claude shouldn't modify]
Delete sections that don't apply. 
The rules that change everything
After testing dozens of CLAUDE.md configurations, these are the lines that made the biggest difference in output quality:
# The lines with highest impact:

- IMPORTANT: run type check after every code change
  (prevents Claude from shipping broken types)

- Make minimal changes, don't refactor unrelated code  
  (prevents Claude from rewriting your entire file)

- Create separate commits per logical change
  (prevents the 47-file monster commit)

- When unsure, explain both approaches and let me choose
  (prevents Claude from making architectural decisions for you)

- Static export only, no SSR
  (prevents Claude from adding server-side code to a static site)
Each of these prevents a specific, common mistake. 
That's the test for every line in your CLAUDE.md: does removing it cause Claude to do the wrong thing?
The mistake everyone makes
People treat CLAUDE.md like a wish list.
Your CLAUDE.md should be a technical brief, not a motivational speech. Stack, commands, architecture, rules, workflow. Everything else is noise competing for attention with the instructions that actually matter.
Keep it under 80 lines. Review it when Claude gets something wrong. 
The file compounds over time. A good CLAUDE.md in month one saves you from repeating yourself. 
By month six it's captured every mistake Claude has ever made in your project and prevents all of them automatically.
I share daily notes on AI, finance, and vibe coding in my Telegram channel: https://t.me/zodchixquant

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
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

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

prompt: bir tarif sitesi ana sayfada popüler tarifler olacak popülarite kullanıcıların tarifi beğenmesine göre belirlenecek. iki kullanıcı girişi olacak bir şef olarak siteye tarif ekleyebilenler diğeri de normal yorum yapma tarif kaydetme gibi becerilere sahip kullanıcılar. tarifi beğenme kaydetme veya yorum yapma kullanıcı girişi olmadan yapılamayacak. yemek arama bölümü olacak ama iki türlü birisi normal sitenin üst tarafında yemek ismi veya bir malzeme ile arayabildiğin, diğeri de arama yerinin hemen yanında malzemeye göre arama orada da malzemelerin ismi olacak kullanıcının seçtiği malzemelere göre ilgili yemekler gelecek. yan tarafta çubukta kategoriler olacak kahvaltılık çorbalar tatlılar vb. bir de günün menüsü olacak her kategoriden rastgele bir tane olacak şekilde her gün yenilenecek
Proje isterleri şu şekilde: 
- Site Map 
- Ziyaretçi Sayacı (IP tabanlı)
 - Online Kullanıcı Sayısı 
- Duyuru-Haber Modülü 
- Resim Galerisi (Localde olacak ve admin panalinden ekleme yapılabilecek) 
- Admin Panel ve Kullanıcı Yetkilendirmesi 
- CSRF 
- Slugify

# Proje Yapısı Şablonu

Bu döküman, bu projedeki klasör/dosya organizasyonunu ve bağlantı şemasını anlatır. Benzer bir Express + EJS + MySQL projesi kurarken aynı kalıbı izlemek için kullanılabilir. Burada yazılı olmayan bir teknoloji veya desen eklenmez.

## Kullanılan Paketler

`package.json` içinde aşağıdaki bağımlılıklar bulunur:

- `express` — HTTP sunucu ve router
- `ejs` — view şablon motoru
- `body-parser` — form POST verilerini almak için
- `express-session` — oturum yönetimi
- `cookie-parser` — cookie okuma/yazma (beni hatırla için)
- `csurf` — CSRF token doğrulama
- `bcrypt` — şifre hash'leme/karşılaştırma
- `mysql2` — MySQL bağlantısı (Promise API ile)
- `node-notifier` ve `dialog-node` — sunucu tarafında masaüstü bildirim/dialog
- `nodemon` — geliştirme sırasında otomatik yeniden başlatma

Çalıştırma komutu: `npm start` (içeride `npx nodemon` çağırır).

## Klasör Yapısı

```
proje-kök/
├── index.js               # Uygulamanın giriş noktası
├── package.json
├── controller/            # İstekleri işleyen fonksiyonlar
│   ├── admin.js
│   ├── auth.js
│   └── user.js
├── router/                # URL → controller eşleştirmesi
│   ├── admin.js
│   ├── auth.js
│   └── user.js
├── middleware/            # Tekrar kullanılan ara katmanlar
│   ├── config_Session.js
│   ├── csrf.js
│   ├── isAuth.js
│   └── locals.js
├── model/                 # Veri erişim katmanı
│   ├── db.js              # MySQL bağlantısı
│   ├── data.js            # Eski in-memory veri (ders notu için)
│   └── authdata.js        # Eski in-memory kullanıcı (ders notu için)
├── messagebox/            # Masaüstü bildirim sarmalayıcıları
│   ├── notifier.js
│   └── dialognode.js
├── views/                 # EJS şablonları
│   ├── admin/
│   ├── auth/
│   ├── user/
│   └── partials/          # header, side, topmenu, scripts
└── public/                # Statik dosyalar (css, js, assets)
```

## index.js — Uygulama Kurulumu

`index.js` aşağıdaki sırayı tek bir yerde uygular:

1. View engine: `app.set("view engine", "ejs")`
2. Statik klasör: `app.use("/static", express.static(path.join(__dirname, "public")))`
3. `bodyParser.urlencoded({ extended: true })`
4. `configSession` (oturum kurulumu)
5. `cookieParser()`
6. `locals` (her view'a `fullname` aktarır)
7. `csurf()` — tüm POST isteklerinde CSRF zorunlu
8. Router'lar: `/admin`, `/user`, `/auth`
9. 404 yakalayıcı: `next("Kaynak yok")`
10. Hata yakalayıcı: `res.render("admin/error.ejs", { err })`
11. `app.listen(3000, ...)`

**Sıralama önemlidir.** `csurf` router'lardan ÖNCE, `cookieParser` ve `configSession`'dan SONRA gelmelidir.

## İstek Akışı

```
istemci → index.js (genel middleware'ler) → router/xxx.js
                                            → [isAuth] → [csrf] → controller/xxx.js
                                                                  → model/db.js (MySQL)
                                                                  → res.render(view, data)
```

## Router Kalıbı

Her router şu yapıyı izler:

```js
const express = require("express");
const router = express.Router();
const xxxController = require("../controller/xxx.js");
const isAuth = require("../middleware/isAuth.js");
const csrf = require("../middleware/csrf.js");

router.get("/yol", isAuth, csrf, xxxController.fonksiyon);   // form sayfası
router.post("/yol", isAuth, xxxController.postFonksiyon);    // form gönderimi

module.exports = router;
```

**Kural:** `csrf` middleware'i SADECE form render eden GET route'larına eklenir. POST route'larına eklenmez (CSRF doğrulaması zaten `csurf()` tarafından genel olarak yapılır).

## CSRF Kullanımı — İki Katmanlı

1. `index.js`'deki `app.use(csurf())` her POST isteğinde `_csrf` alanını/header'ını doğrular.
2. `middleware/csrf.js` SADECE `res.locals.csrfToken = req.csrfToken()` atar — böylece view'a parametre olarak göndermek gerekmez.

EJS form'larında her zaman:

```html
<form method="POST" action="...">
    <input type="hidden" name="_csrf" value="<%= csrfToken %>">
    ...
</form>
```

## Controller Kalıbı

Controller dosyaları, her route için bir fonksiyon export eder. Şablon:

```js
const db = require("../model/db");

exports.fonksiyonAdi = async (req, res, next) => {
    try {
        const result = await db.execute("SELECT ... WHERE x=?", [req.params.id]);
        res.render("klasor/sablon", {
            title: "...",
            contentTitle: "...",
            data: result[0]            // satır listesi
        });
    } catch (err) {
        return next(err);              // hata global handler'a düşer
    }
};
```

**Render parametre sözleşmesi:** her view'a en az `title`, `contentTitle` aktarılır. Liste için `data`, tek kayıt için `viewData` kullanılır.

## Model Katmanı — model/db.js

Tek bir MySQL bağlantısı oluşturulur ve `.promise()` ile dışa aktarılır:

```js
const mysql = require("mysql2");
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'veritabani_adi'
});
connection.connect(err => { if (err) return console.log(err); });
module.exports = connection.promise();
```

**`mysql2` sonuç şekli:** `db.execute(sql, params)` `[rows, fields]` döner.

- Satır listesi: `result[0]`
- İlk satır: `result[0][0]`
- Bu sözleşmeye tüm controller'lar bağlıdır; değiştirilmemelidir.

## Middleware Katmanı

### middleware/config_Session.js

`express-session` ayarları:

- `secret`: rastgele GUID
- `resave: false`, `saveUninitialized: false`
- `cookie.maxAge`: ms cinsinden ömür

Modül, hazır middleware'i export eder ve `index.js` doğrudan `app.use` ile takar.

### middleware/isAuth.js

`req.session.isAuth` yoksa `/auth/login?url=<orijinal-url>` adresine yönlendirir. Login başarılı olduğunda controller `req.query.url`'i okuyup oraya geri döner.

### middleware/csrf.js

Sadece `res.locals.csrfToken` atar. (Yukarıda anlatıldı.)

### middleware/locals.js

`res.locals.fullname = req.session.fullname` atar — header partial'ı bu değişkene bakar.

## View Katmanı (EJS)

- Sayfalar üç klasöre ayrılır: `views/admin/`, `views/auth/`, `views/user/`.
- Ortak parçalar `views/partials/` altındadır: `header.ejs`, `topmenu.ejs`, `side.ejs`, `scripts.ejs`. Sayfalar bunları `<%- include('../partials/...') %>` ile dahil eder.
- Hata sayfası: `views/admin/error.ejs` — `err` değişkenini gösterir.

## Auth Akışı

1. `GET /auth/login` → `controller/auth.js` `getLogin`: cookie'den email/password okur (beni hatırla), `req.session.message` varsa gösterir, login view'ı render eder.
2. `POST /auth/login` → `postLogin`: `users` tablosundan email ile sorgular, `bcrypt.compare` ile şifre eşleşmesini kontrol eder. Başarılıysa session'a `isAuth`, `fullname`, `userid` yazar; `req.query.url` varsa oraya yoksa varsayılan iç sayfaya yönlendirir.
3. "Beni hatırla" işaretliyse email/password cookie olarak yazılır; işaret kaldırılmışsa eski cookie'ler temizlenir.
4. `GET /auth/signout` → `req.session.destroy()` ve `/auth/login`'e dön.

## Veritabanı Şeması (Bu Projedeki Sorgulardan Çıkarsanan)

İki tablo bekleniyor:

- `users(userid, email, password, name, surname)` — `password` bcrypt hash olarak saklanır.
- `anc(noticeid, title, exp, isactive, userid)` — `userid` FK olarak `users.userid`.

Benzer bir proje yaparken kendi tablolarınızı tasarlayın; ancak controller'larda `db.execute(sql, [...])` çağrı şeklini aynen koruyun.

## messagebox/ Kullanımı

Sunucu tarafında masaüstü bildirim açar. Sadece masaüstü işletim sisteminde çalışır, headless ortamda atlanmalıdır.

- `notifier.js` — `node-notifier` ile toast bildirim.
- `dialognode.js` — `dialog-node` ile bloklayan dialog.

Controller'da kullanım:

```js
const notifierShow = require("../messagebox/notifier.js");
notifierShow("Uyarı", "İşlem başarılı.", () => { res.redirect("..."); });
```

## Yeni Bir Modül Eklerken Adımlar

Aynı şablona sadık kalmak için sırasıyla:

1. `model/` — gerekiyorsa yeni sorgular için yardımcı yok; controller doğrudan `db.execute` çağırır.
2. `controller/<isim>.js` — her route için bir `exports.fn` yaz; async + try/catch + `next(err)` deseni.
3. `router/<isim>.js` — GET form sayfasına `csrf` middleware'ini ekle; korunması gereken her route'a `isAuth` ekle.
4. `views/<isim>/` — yeni EJS şablonları; partial'ları include et; form'larda `_csrf` hidden input'unu unutma.
5. `index.js` — yeni router'ı `app.use("/<önek>", yeniRouter)` ile bağla.

## Dil ve Stil

- Kullanıcıya görünen tüm metinler Türkçedir.
- Kod yorumları Türkçedir; değişken adları İngilizce + Türkçe karışıktır (`anc`, `noticeid`, `cbhatirla`...). Mevcut tarzı koruyun.
