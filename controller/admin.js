// Admin panel controller'ı.
// Faz 5a: dashboard + şef tarif CRUD.
// Faz 5b: duyuru CRUD (admin-only), galeri CRUD (admin-only).
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
const db = require("../model/db.js");

const tr = (s) => slugify(s, { lower: true, strict: true, locale: "tr" });

// GET /admin
exports.getDashboard = async (req, res, next) => {
    try {
        const userid = req.session.userid;
        const role = req.session.role;
        const isAdmin = role === "admin";

        const rec = await db.execute(
            isAdmin
                ? "SELECT COUNT(*) AS c FROM recipes"
                : "SELECT COUNT(*) AS c FROM recipes WHERE userid=?",
            isAdmin ? [] : [userid]
        );
        const myRecipeCount = rec[0][0].c;

        let ancCount = 0, galleryCount = 0;
        if (isAdmin) {
            const a = await db.execute("SELECT COUNT(*) AS c FROM anc");
            ancCount = a[0][0].c;
            const g = await db.execute("SELECT COUNT(*) AS c FROM gallery");
            galleryCount = g[0][0].c;
        }

        res.render("admin/dashboard.ejs", {
            title: "Panel",
            contentTitle: "Panel",
            myRecipeCount: myRecipeCount,
            ancCount: ancCount,
            galleryCount: galleryCount
        });
    } catch (err) {
        return next(err);
    }
};

// GET /admin/recipes — şef ise kendi tarifleri, admin ise tümü
exports.getRecipes = async (req, res, next) => {
    try {
        const userid = req.session.userid;
        const role = req.session.role;
        const isAdmin = role === "admin";

        const result = await db.execute(
            `SELECT r.recipeid, r.title, r.slug, r.image, r.createdAt,
                    c.name AS categoryName,
                    u.name AS chefName, u.surname AS chefSurname
             FROM recipes r
             JOIN categories c ON c.categoryid = r.categoryid
             JOIN users u      ON u.userid     = r.userid
             ${isAdmin ? "" : "WHERE r.userid=?"}
             ORDER BY r.createdAt DESC`,
            isAdmin ? [] : [userid]
        );

        res.render("admin/recipes.ejs", {
            title: "Tarifler",
            contentTitle: isAdmin ? "Tüm Tarifler" : "Tariflerim",
            data: result[0]
        });
    } catch (err) {
        return next(err);
    }
};

// GET /admin/recipes/new — yeni tarif formu
exports.getRecipeForm = async (req, res, next) => {
    try {
        const cats = await db.execute(
            "SELECT categoryid, name FROM categories ORDER BY name ASC"
        );
        const ings = await db.execute(
            "SELECT ingredientid, name FROM ingredients ORDER BY name ASC"
        );
        res.render("admin/recipe-form.ejs", {
            title: "Yeni Tarif",
            contentTitle: "Yeni Tarif",
            categories: cats[0],
            ingredients: ings[0],
            viewData: { title: "", exp: "", instructions: "", categoryid: null },
            selectedIngredients: {},
            message: req.session.message || null
        });
        req.session.message = null;
    } catch (err) {
        return next(err);
    }
};

// POST /admin/recipes — yeni tarif kaydet
// multer ile "image" alanı, kapak görseli (opsiyonel).
// Malzemeler: ing_<id>=on (checkbox) + amt_<id>=miktar (text)
exports.postRecipe = async (req, res, next) => {
    try {
        const userid = req.session.userid;
        const title = (req.body.title || "").trim();
        const exp = (req.body.exp || "").trim();
        const instructions = (req.body.instructions || "").trim();
        const categoryid = parseInt(req.body.categoryid, 10);

        if (!title || !exp || !instructions || !Number.isInteger(categoryid)) {
            req.session.message = "Tüm alanları doldurun.";
            return res.redirect("/admin/recipes/new");
        }

        // Slug benzersizliği: aynı slug varsa -2, -3 ekle
        let baseSlug = tr(title);
        if (!baseSlug) baseSlug = "tarif";
        let slug = baseSlug;
        let i = 2;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const ex = await db.execute(
                "SELECT 1 FROM recipes WHERE slug=?",
                [slug]
            );
            if (!ex[0][0]) break;
            slug = baseSlug + "-" + i;
            i++;
        }

        const image = req.file
            ? "/static/uploads/recipes/" + req.file.filename
            : null;

        const ins = await db.execute(
            `INSERT INTO recipes (title, slug, exp, instructions, image, categoryid, userid)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, slug, exp, instructions, image, categoryid, userid]
        );
        const recipeid = ins[0].insertId;

        // Malzemeler: req.body anahtarlarında ing_<id> ve amt_<id>
        const ingIds = [];
        for (const key of Object.keys(req.body)) {
            if (key.startsWith("ing_")) {
                const id = parseInt(key.substring(4), 10);
                if (Number.isInteger(id)) ingIds.push(id);
            }
        }
        for (const id of ingIds) {
            const amt = (req.body["amt_" + id] || "").toString().trim() || null;
            await db.execute(
                "INSERT INTO recipe_ingredients (recipeid, ingredientid, amount) VALUES (?, ?, ?)",
                [recipeid, id, amt]
            );
        }

        return res.redirect("/admin/recipes");
    } catch (err) {
        return next(err);
    }
};

// POST /admin/recipes/:id/delete
// Şef sadece kendi tarifini silebilir; admin her şeyi.
exports.postRecipeDelete = async (req, res, next) => {
    try {
        const userid = req.session.userid;
        const role = req.session.role;
        const recipeid = parseInt(req.params.id, 10);
        if (!Number.isInteger(recipeid)) return next("Geçersiz tarif");

        const r = await db.execute(
            "SELECT userid FROM recipes WHERE recipeid=?",
            [recipeid]
        );
        const row = r[0][0];
        if (!row) return next("Tarif bulunamadı");

        if (role !== "admin" && row.userid !== userid) {
            return next("Bu tarifi silme yetkin yok.");
        }

        await db.execute("DELETE FROM recipes WHERE recipeid=?", [recipeid]);
        return res.redirect("/admin/recipes");
    } catch (err) {
        return next(err);
    }
};

// ============================================================
// Duyurular (anc) — admin-only
// ============================================================

// GET /admin/announcements
exports.getAnnouncements = async (req, res, next) => {
    try {
        const result = await db.execute(
            `SELECT a.noticeid, a.title, a.exp, a.isactive, a.createdAt,
                    u.name AS userName, u.surname AS userSurname
             FROM anc a
             JOIN users u ON u.userid = a.userid
             ORDER BY a.createdAt DESC`
        );
        res.render("admin/announcements.ejs", {
            title: "Duyurular",
            contentTitle: "Duyurular",
            data: result[0]
        });
    } catch (err) {
        return next(err);
    }
};

// GET /admin/announcements/new
exports.getAnnouncementForm = async (req, res, next) => {
    try {
        res.render("admin/announcement-form.ejs", {
            title: "Yeni Duyuru",
            contentTitle: "Yeni Duyuru",
            viewData: { title: "", exp: "", isactive: 1 }
        });
    } catch (err) {
        return next(err);
    }
};

// POST /admin/announcements
exports.postAnnouncement = async (req, res, next) => {
    try {
        const userid = req.session.userid;
        const title = (req.body.title || "").trim();
        const exp = (req.body.exp || "").trim();
        const isactive = req.body.isactive === "on" ? 1 : 0;

        if (!title || !exp) {
            return next("Başlık ve içerik boş olamaz.");
        }

        await db.execute(
            "INSERT INTO anc (title, exp, isactive, userid) VALUES (?, ?, ?, ?)",
            [title, exp, isactive, userid]
        );
        return res.redirect("/admin/announcements");
    } catch (err) {
        return next(err);
    }
};

// POST /admin/announcements/:id/toggle — aktif/pasif
exports.postAnnouncementToggle = async (req, res, next) => {
    try {
        const noticeid = parseInt(req.params.id, 10);
        if (!Number.isInteger(noticeid)) return next("Geçersiz duyuru");
        await db.execute(
            "UPDATE anc SET isactive = 1 - isactive WHERE noticeid=?",
            [noticeid]
        );
        return res.redirect("/admin/announcements");
    } catch (err) {
        return next(err);
    }
};

// POST /admin/announcements/:id/delete
exports.postAnnouncementDelete = async (req, res, next) => {
    try {
        const noticeid = parseInt(req.params.id, 10);
        if (!Number.isInteger(noticeid)) return next("Geçersiz duyuru");
        await db.execute("DELETE FROM anc WHERE noticeid=?", [noticeid]);
        return res.redirect("/admin/announcements");
    } catch (err) {
        return next(err);
    }
};

// ============================================================
// Galeri — admin-only. Görseller public/uploads/gallery/'e.
// ============================================================

// GET /admin/gallery
exports.getGallery = async (req, res, next) => {
    try {
        const result = await db.execute(
            `SELECT g.galleryid, g.title, g.image, g.createdAt,
                    u.name AS userName, u.surname AS userSurname
             FROM gallery g
             JOIN users u ON u.userid = g.userid
             ORDER BY g.createdAt DESC`
        );
        res.render("admin/gallery.ejs", {
            title: "Galeri",
            contentTitle: "Galeri",
            data: result[0]
        });
    } catch (err) {
        return next(err);
    }
};

// POST /admin/gallery — multer "image" alanı
exports.postGallery = async (req, res, next) => {
    try {
        const userid = req.session.userid;
        const title = (req.body.title || "").trim() || "Görsel";
        if (!req.file) return next("Görsel yüklenmedi.");

        const image = "/static/uploads/gallery/" + req.file.filename;
        await db.execute(
            "INSERT INTO gallery (title, image, userid) VALUES (?, ?, ?)",
            [title, image, userid]
        );
        return res.redirect("/admin/gallery");
    } catch (err) {
        return next(err);
    }
};

// POST /admin/gallery/:id/delete — DB'den ve diskten sil
exports.postGalleryDelete = async (req, res, next) => {
    try {
        const galleryid = parseInt(req.params.id, 10);
        if (!Number.isInteger(galleryid)) return next("Geçersiz öğe");

        const row = await db.execute(
            "SELECT image FROM gallery WHERE galleryid=?",
            [galleryid]
        );
        const item = row[0][0];
        if (!item) return next("Galeri öğesi bulunamadı");

        await db.execute("DELETE FROM gallery WHERE galleryid=?", [galleryid]);

        // Diskten sil. Hata olursa yok say (DB tutarlılığı öncelik).
        if (item.image && item.image.startsWith("/static/")) {
            const rel = item.image.replace(/^\/static\//, "");
            const abs = path.join(__dirname, "..", "public", rel);
            fs.unlink(abs, () => { /* yut */ });
        }

        return res.redirect("/admin/gallery");
    } catch (err) {
        return next(err);
    }
};
