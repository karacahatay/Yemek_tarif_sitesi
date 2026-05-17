// User controller — JSON API.
// Public endpoint'ler: home, recipe, category, search, announcements, gallery, sitemap.
// Auth-gated: like, save, comment, saved.
const db = require("../model/db.js");

// GET /api/home — popüler tarifler + günün menüsü + aktif duyurular
exports.getHome = async (req, res, next) => {
    try {
        const popular = await db.execute(
            `SELECT r.recipeid, r.title, r.slug, r.exp, r.image, r.createdAt,
                    c.name AS categoryName, c.slug AS categorySlug,
                    (SELECT COUNT(*) FROM likes l WHERE l.recipeid = r.recipeid) AS likeCount
             FROM recipes r
             JOIN categories c ON c.categoryid = r.categoryid
             ORDER BY likeCount DESC, r.createdAt DESC`
        );

        const cats = await db.execute(
            "SELECT categoryid, name, slug FROM categories ORDER BY name ASC"
        );
        const daily = [];
        for (const c of cats[0]) {
            const r = await db.execute(
                `SELECT r.title, r.slug, r.exp, r.image,
                        ? AS categoryName, ? AS categorySlug
                 FROM recipes r
                 WHERE r.categoryid=?
                 ORDER BY RAND(TO_DAYS(CURDATE()) + ?)
                 LIMIT 1`,
                [c.name, c.slug, c.categoryid, c.categoryid]
            );
            if (r[0][0]) daily.push(r[0][0]);
        }

        const anc = await db.execute(
            `SELECT noticeid, title, exp, createdAt FROM anc
             WHERE isactive=1 ORDER BY createdAt DESC LIMIT 3`
        );

        res.json({
            popular: popular[0],
            dailyMenu: daily,
            announcements: anc[0]
        });
    } catch (err) {
        return next(err);
    }
};

// GET /api/category/:slug
exports.getCategory = async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const cat = await db.execute(
            "SELECT categoryid, name, slug FROM categories WHERE slug=?",
            [slug]
        );
        const category = cat[0][0];
        if (!category) return res.status(404).json({ error: "Kategori bulunamadı" });

        const recipes = await db.execute(
            `SELECT r.recipeid, r.title, r.slug, r.exp, r.image, r.createdAt
             FROM recipes r WHERE r.categoryid=?
             ORDER BY r.createdAt DESC`,
            [category.categoryid]
        );

        res.json({ category, recipes: recipes[0] });
    } catch (err) {
        return next(err);
    }
};

// GET /api/recipe/:slug
exports.getRecipe = async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const userid = req.session.userid || null;

        const rec = await db.execute(
            `SELECT r.recipeid, r.title, r.slug, r.exp, r.instructions, r.image,
                    r.createdAt, r.userid, r.categoryid,
                    c.name AS categoryName, c.slug AS categorySlug,
                    u.name AS chefName, u.surname AS chefSurname,
                    (SELECT COUNT(*) FROM likes l WHERE l.recipeid = r.recipeid) AS likeCount
             FROM recipes r
             JOIN categories c ON c.categoryid = r.categoryid
             JOIN users u      ON u.userid     = r.userid
             WHERE r.slug=?`,
            [slug]
        );
        const recipe = rec[0][0];
        if (!recipe) return res.status(404).json({ error: "Tarif bulunamadı" });

        const ing = await db.execute(
            `SELECT i.name, ri.amount
             FROM recipe_ingredients ri
             JOIN ingredients i ON i.ingredientid = ri.ingredientid
             WHERE ri.recipeid=?
             ORDER BY i.name ASC`,
            [recipe.recipeid]
        );

        const comments = await db.execute(
            `SELECT cm.commentid, cm.body, cm.createdAt,
                    u.name AS userName, u.surname AS userSurname
             FROM comments cm
             JOIN users u ON u.userid = cm.userid
             WHERE cm.recipeid=?
             ORDER BY cm.createdAt DESC`,
            [recipe.recipeid]
        );

        let userLiked = false, userSaved = false;
        if (userid) {
            const lk = await db.execute(
                "SELECT 1 FROM likes WHERE userid=? AND recipeid=?",
                [userid, recipe.recipeid]
            );
            userLiked = !!lk[0][0];
            const sv = await db.execute(
                "SELECT 1 FROM saves WHERE userid=? AND recipeid=?",
                [userid, recipe.recipeid]
            );
            userSaved = !!sv[0][0];
        }

        res.json({
            recipe,
            ingredients: ing[0],
            comments: comments[0],
            userLiked,
            userSaved
        });
    } catch (err) {
        return next(err);
    }
};

// GET /api/search?q=...
exports.getSearch = async (req, res, next) => {
    try {
        const q = (req.query.q || "").trim();
        if (!q) return res.json({ q: "", results: [] });
        const like = "%" + q + "%";
        const r = await db.execute(
            `SELECT DISTINCT r.recipeid, r.title, r.slug, r.exp, r.image, r.createdAt,
                             c.name AS categoryName, c.slug AS categorySlug
             FROM recipes r
             JOIN categories c ON c.categoryid = r.categoryid
             LEFT JOIN recipe_ingredients ri ON ri.recipeid = r.recipeid
             LEFT JOIN ingredients i         ON i.ingredientid = ri.ingredientid
             WHERE r.title LIKE ? OR i.name LIKE ?
             ORDER BY r.createdAt DESC`,
            [like, like]
        );
        res.json({ q, results: r[0] });
    } catch (err) {
        return next(err);
    }
};

// GET /api/search/ingredients?ing=1&ing=2&...  (AND mantığı)
exports.getIngredientSearch = async (req, res, next) => {
    try {
        let selected = req.query.ing || [];
        if (!Array.isArray(selected)) selected = [selected];
        selected = selected.map(x => parseInt(x, 10)).filter(x => Number.isInteger(x));

        if (selected.length === 0) return res.json({ selected: [], results: [] });

        const placeholders = selected.map(() => "?").join(",");
        const params = [...selected, selected.length];
        const r = await db.execute(
            `SELECT r.recipeid, r.title, r.slug, r.exp, r.image,
                    c.name AS categoryName, c.slug AS categorySlug
             FROM recipes r
             JOIN categories c ON c.categoryid = r.categoryid
             JOIN recipe_ingredients ri ON ri.recipeid = r.recipeid
             WHERE ri.ingredientid IN (${placeholders})
             GROUP BY r.recipeid, r.title, r.slug, r.exp, r.image, c.name, c.slug
             HAVING COUNT(DISTINCT ri.ingredientid) = ?
             ORDER BY r.createdAt DESC`,
            params
        );
        res.json({ selected, results: r[0] });
    } catch (err) {
        return next(err);
    }
};

// GET /api/sitemap — kategoriler + tarifler
exports.getSitemap = async (req, res, next) => {
    try {
        const cats = await db.execute(
            "SELECT name, slug FROM categories ORDER BY name ASC"
        );
        const recs = await db.execute(
            "SELECT title, slug FROM recipes ORDER BY title ASC"
        );
        res.json({ categories: cats[0], recipes: recs[0] });
    } catch (err) {
        return next(err);
    }
};

// GET /api/announcements — public, sadece aktif
exports.getAnnouncements = async (req, res, next) => {
    try {
        const r = await db.execute(
            `SELECT noticeid, title, exp, createdAt FROM anc
             WHERE isactive=1 ORDER BY createdAt DESC`
        );
        res.json({ announcements: r[0] });
    } catch (err) {
        return next(err);
    }
};

// GET /api/gallery — public
exports.getGallery = async (req, res, next) => {
    try {
        const r = await db.execute(
            "SELECT galleryid, title, image, createdAt FROM gallery ORDER BY createdAt DESC"
        );
        res.json({ items: r[0] });
    } catch (err) {
        return next(err);
    }
};

// --- Auth-gated ---

// POST /api/recipe/:id/like — toggle
exports.postLikeToggle = async (req, res, next) => {
    try {
        const recipeid = parseInt(req.params.id, 10);
        const userid = req.session.userid;
        if (!Number.isInteger(recipeid)) return res.status(400).json({ error: "Geçersiz tarif" });

        const ex = await db.execute(
            "SELECT 1 FROM likes WHERE userid=? AND recipeid=?",
            [userid, recipeid]
        );
        let liked;
        if (ex[0][0]) {
            await db.execute("DELETE FROM likes WHERE userid=? AND recipeid=?", [userid, recipeid]);
            liked = false;
        } else {
            await db.execute("INSERT INTO likes (userid, recipeid) VALUES (?, ?)", [userid, recipeid]);
            liked = true;
        }

        const cnt = await db.execute(
            "SELECT COUNT(*) AS c FROM likes WHERE recipeid=?",
            [recipeid]
        );
        res.json({ liked, likeCount: cnt[0][0].c });
    } catch (err) {
        return next(err);
    }
};

// POST /api/recipe/:id/save — toggle
exports.postSaveToggle = async (req, res, next) => {
    try {
        const recipeid = parseInt(req.params.id, 10);
        const userid = req.session.userid;
        if (!Number.isInteger(recipeid)) return res.status(400).json({ error: "Geçersiz tarif" });

        const ex = await db.execute(
            "SELECT 1 FROM saves WHERE userid=? AND recipeid=?",
            [userid, recipeid]
        );
        let saved;
        if (ex[0][0]) {
            await db.execute("DELETE FROM saves WHERE userid=? AND recipeid=?", [userid, recipeid]);
            saved = false;
        } else {
            await db.execute("INSERT INTO saves (userid, recipeid) VALUES (?, ?)", [userid, recipeid]);
            saved = true;
        }
        res.json({ saved });
    } catch (err) {
        return next(err);
    }
};

// POST /api/recipe/:id/comment  { body }
exports.postComment = async (req, res, next) => {
    try {
        const recipeid = parseInt(req.params.id, 10);
        const userid = req.session.userid;
        const body = (req.body.body || "").trim();
        if (!Number.isInteger(recipeid)) return res.status(400).json({ error: "Geçersiz tarif" });
        if (!body) return res.status(400).json({ error: "Yorum boş olamaz" });

        const ins = await db.execute(
            "INSERT INTO comments (recipeid, userid, body) VALUES (?, ?, ?)",
            [recipeid, userid, body]
        );
        const cm = await db.execute(
            `SELECT cm.commentid, cm.body, cm.createdAt,
                    u.name AS userName, u.surname AS userSurname
             FROM comments cm
             JOIN users u ON u.userid = cm.userid
             WHERE cm.commentid=?`,
            [ins[0].insertId]
        );
        res.json({ comment: cm[0][0] });
    } catch (err) {
        return next(err);
    }
};

// GET /api/saved
exports.getSaved = async (req, res, next) => {
    try {
        const userid = req.session.userid;
        const r = await db.execute(
            `SELECT r.recipeid, r.title, r.slug, r.exp, r.image,
                    c.name AS categoryName, c.slug AS categorySlug,
                    s.createdAt AS savedAt
             FROM saves s
             JOIN recipes r    ON r.recipeid = s.recipeid
             JOIN categories c ON c.categoryid = r.categoryid
             WHERE s.userid=?
             ORDER BY s.createdAt DESC`,
            [userid]
        );
        res.json({ items: r[0] });
    } catch (err) {
        return next(err);
    }
};
