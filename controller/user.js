// User (ziyaretçi + giriş yapmış kullanıcı) controller'ı.
// Faz 2: ana sayfa, kategori, tarif detay.
// Faz 3: günün menüsü, arama (metin + malzeme), site haritası.
// Faz 4: like, save, comment (auth-gated).
const db = require("../model/db.js");

// GET / — ana sayfa, popüler tarifler (like sayısına göre) + aktif duyurular bandı
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

        const ancRes = await db.execute(
            `SELECT noticeid, title, exp, createdAt
             FROM anc
             WHERE isactive = 1
             ORDER BY createdAt DESC
             LIMIT 3`
        );

        // Günün menüsü: her kategoriden 1 rastgele tarif, gün içinde sabit.
        // RAND(TO_DAYS(CURDATE()) + categoryid) → günde değişir, gün içinde aynı.
        // MySQL 5.7 uyumu için kategori başına ayrı LIMIT 1 sorgusu.
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

        res.render("user/home.ejs", {
            title: "Ana Sayfa",
            contentTitle: "Popüler Tarifler",
            data: popular[0],
            dailyMenu: daily,
            announcements: ancRes[0]
        });
    } catch (err) {
        return next(err);
    }
};

// GET /category/:slug — kategori sayfası
exports.getCategory = async (req, res, next) => {
    try {
        const slug = req.params.slug;

        const catRes = await db.execute(
            "SELECT categoryid, name, slug FROM categories WHERE slug=?",
            [slug]
        );
        const category = catRes[0][0];
        if (!category) return next("Kategori bulunamadı");

        const recipes = await db.execute(
            `SELECT r.recipeid, r.title, r.slug, r.exp, r.image, r.createdAt
             FROM recipes r
             WHERE r.categoryid=?
             ORDER BY r.createdAt DESC`,
            [category.categoryid]
        );

        res.render("user/category.ejs", {
            title: category.name,
            contentTitle: category.name,
            viewData: category,
            data: recipes[0]
        });
    } catch (err) {
        return next(err);
    }
};

// GET /recipe/:slug — tarif detay
exports.getRecipe = async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const userid = req.session.userid || null;

        const recRes = await db.execute(
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
        const recipe = recRes[0][0];
        if (!recipe) return next("Tarif bulunamadı");

        const ingRes = await db.execute(
            `SELECT i.name, ri.amount
             FROM recipe_ingredients ri
             JOIN ingredients i ON i.ingredientid = ri.ingredientid
             WHERE ri.recipeid=?
             ORDER BY i.name ASC`,
            [recipe.recipeid]
        );

        const commentsRes = await db.execute(
            `SELECT cm.commentid, cm.body, cm.createdAt,
                    u.name AS userName, u.surname AS userSurname
             FROM comments cm
             JOIN users u ON u.userid = cm.userid
             WHERE cm.recipeid=?
             ORDER BY cm.createdAt DESC`,
            [recipe.recipeid]
        );

        // Mevcut kullanıcı bu tarifi beğenmiş/kaydetmiş mi?
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

        res.render("user/recipe.ejs", {
            title: recipe.title,
            contentTitle: recipe.title,
            viewData: recipe,
            data: ingRes[0],
            comments: commentsRes[0],
            userLiked: userLiked,
            userSaved: userSaved
        });
    } catch (err) {
        return next(err);
    }
};

// POST /recipe/:id/like — toggle. isAuth zorunlu.
exports.postLikeToggle = async (req, res, next) => {
    try {
        const recipeid = parseInt(req.params.id, 10);
        const userid = req.session.userid;
        if (!Number.isInteger(recipeid)) return next("Geçersiz tarif");

        const ex = await db.execute(
            "SELECT 1 FROM likes WHERE userid=? AND recipeid=?",
            [userid, recipeid]
        );
        if (ex[0][0]) {
            await db.execute(
                "DELETE FROM likes WHERE userid=? AND recipeid=?",
                [userid, recipeid]
            );
        } else {
            await db.execute(
                "INSERT INTO likes (userid, recipeid) VALUES (?, ?)",
                [userid, recipeid]
            );
        }

        // Geri tarife dön
        const slugRes = await db.execute(
            "SELECT slug FROM recipes WHERE recipeid=?",
            [recipeid]
        );
        const slug = slugRes[0][0] ? slugRes[0][0].slug : "";
        return res.redirect("/recipe/" + slug);
    } catch (err) {
        return next(err);
    }
};

// POST /recipe/:id/save — toggle. isAuth zorunlu.
exports.postSaveToggle = async (req, res, next) => {
    try {
        const recipeid = parseInt(req.params.id, 10);
        const userid = req.session.userid;
        if (!Number.isInteger(recipeid)) return next("Geçersiz tarif");

        const ex = await db.execute(
            "SELECT 1 FROM saves WHERE userid=? AND recipeid=?",
            [userid, recipeid]
        );
        if (ex[0][0]) {
            await db.execute(
                "DELETE FROM saves WHERE userid=? AND recipeid=?",
                [userid, recipeid]
            );
        } else {
            await db.execute(
                "INSERT INTO saves (userid, recipeid) VALUES (?, ?)",
                [userid, recipeid]
            );
        }

        const slugRes = await db.execute(
            "SELECT slug FROM recipes WHERE recipeid=?",
            [recipeid]
        );
        const slug = slugRes[0][0] ? slugRes[0][0].slug : "";
        return res.redirect("/recipe/" + slug);
    } catch (err) {
        return next(err);
    }
};

// POST /recipe/:id/comment — yorum ekle. isAuth zorunlu.
exports.postComment = async (req, res, next) => {
    try {
        const recipeid = parseInt(req.params.id, 10);
        const userid = req.session.userid;
        const body = (req.body.body || "").trim();
        if (!Number.isInteger(recipeid)) return next("Geçersiz tarif");
        if (!body) {
            // Boş yorum → sessiz dön
            const slugRes = await db.execute(
                "SELECT slug FROM recipes WHERE recipeid=?",
                [recipeid]
            );
            const slug = slugRes[0][0] ? slugRes[0][0].slug : "";
            return res.redirect("/recipe/" + slug);
        }

        await db.execute(
            "INSERT INTO comments (recipeid, userid, body) VALUES (?, ?, ?)",
            [recipeid, userid, body]
        );

        const slugRes = await db.execute(
            "SELECT slug FROM recipes WHERE recipeid=?",
            [recipeid]
        );
        const slug = slugRes[0][0] ? slugRes[0][0].slug : "";
        return res.redirect("/recipe/" + slug + "#yorumlar");
    } catch (err) {
        return next(err);
    }
};

// GET /saved — kullanıcının kaydettiği tarifler. isAuth zorunlu.
exports.getSaved = async (req, res, next) => {
    try {
        const userid = req.session.userid;
        const result = await db.execute(
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
        res.render("user/saved.ejs", {
            title: "Kayıtlarım",
            contentTitle: "Kayıtlı Tarifler",
            data: result[0]
        });
    } catch (err) {
        return next(err);
    }
};

// GET /search?q=... — tarif adı VEYA malzeme adı eşleşmesi
exports.getSearch = async (req, res, next) => {
    try {
        const q = (req.query.q || "").trim();
        let recipes = [];

        if (q) {
            const like = "%" + q + "%";
            const result = await db.execute(
                `SELECT DISTINCT r.recipeid, r.title, r.slug, r.exp, r.image,
                                 c.name AS categoryName, c.slug AS categorySlug
                 FROM recipes r
                 JOIN categories c ON c.categoryid = r.categoryid
                 LEFT JOIN recipe_ingredients ri ON ri.recipeid = r.recipeid
                 LEFT JOIN ingredients i         ON i.ingredientid = ri.ingredientid
                 WHERE r.title LIKE ? OR i.name LIKE ?
                 ORDER BY r.createdAt DESC`,
                [like, like]
            );
            recipes = result[0];
        }

        res.render("user/search.ejs", {
            title: "Arama",
            contentTitle: q ? ("\"" + q + "\" için sonuçlar") : "Arama",
            q: q,
            data: recipes
        });
    } catch (err) {
        return next(err);
    }
};

// GET /search/ingredients - malzeme listesi + seçilen malzemelere göre sonuçlar
// ?ing=1&ing=2&ing=3 → bu malzemelerin TAMAMINI içeren tarifler
exports.getIngredientSearch = async (req, res, next) => {
    try {
        const ingAll = await db.execute(
            "SELECT ingredientid, name FROM ingredients ORDER BY name ASC"
        );

        // ?ing tek değer veya dizi olabilir
        let selected = req.query.ing || [];
        if (!Array.isArray(selected)) selected = [selected];
        // Sayıya çevir, geçersizleri at
        selected = selected.map(x => parseInt(x, 10)).filter(x => Number.isInteger(x));

        let recipes = [];
        if (selected.length > 0) {
            const placeholders = selected.map(() => "?").join(",");
            const params = [...selected, selected.length];
            const result = await db.execute(
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
            recipes = result[0];
        }

        res.render("user/ingredient-search.ejs", {
            title: "Malzemeye Göre Arama",
            contentTitle: "Malzemeye Göre Arama",
            data: recipes,
            ingredients: ingAll[0],
            selected: selected
        });
    } catch (err) {
        return next(err);
    }
};

// GET /announcements — tüm aktif duyurular
exports.getAnnouncements = async (req, res, next) => {
    try {
        const result = await db.execute(
            `SELECT noticeid, title, exp, createdAt
             FROM anc
             WHERE isactive = 1
             ORDER BY createdAt DESC`
        );
        res.render("user/announcements.ejs", {
            title: "Duyurular",
            contentTitle: "Duyurular",
            data: result[0]
        });
    } catch (err) {
        return next(err);
    }
};

// GET /gallery — resim galerisi
exports.getGallery = async (req, res, next) => {
    try {
        const result = await db.execute(
            `SELECT galleryid, title, image, createdAt
             FROM gallery
             ORDER BY createdAt DESC`
        );
        res.render("user/gallery.ejs", {
            title: "Galeri",
            contentTitle: "Resim Galerisi",
            data: result[0]
        });
    } catch (err) {
        return next(err);
    }
};

// GET /sitemap — site haritası
exports.getSitemap = async (req, res, next) => {
    try {
        const cats = await db.execute(
            "SELECT name, slug FROM categories ORDER BY name ASC"
        );
        const recs = await db.execute(
            "SELECT title, slug FROM recipes ORDER BY title ASC"
        );
        res.render("user/sitemap.ejs", {
            title: "Site Haritası",
            contentTitle: "Site Haritası",
            categories: cats[0],
            recipes: recs[0]
        });
    } catch (err) {
        return next(err);
    }
};
