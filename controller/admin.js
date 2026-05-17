// Admin controller — JSON API.
// 5a: tarif CRUD (chef + admin). 5b: duyuru + galeri (admin-only).
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
const db = require("../model/db.js");

const tr = (s) => slugify(s, { lower: true, strict: true, locale: "tr" });

// GET /api/admin/dashboard
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

        res.json({ role, myRecipeCount, ancCount, galleryCount });
    } catch (err) {
        return next(err);
    }
};

// GET /api/admin/recipes
exports.getRecipes = async (req, res, next) => {
    try {
        const userid = req.session.userid;
        const isAdmin = req.session.role === "admin";

        const r = await db.execute(
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
        res.json({ recipes: r[0] });
    } catch (err) {
        return next(err);
    }
};

// POST /api/admin/recipes — multer single("image")
// FormData ile gelir. Malzemeler: ing_<id>=on + amt_<id>=miktar
exports.postRecipe = async (req, res, next) => {
    try {
        const userid = req.session.userid;
        const title = (req.body.title || "").trim();
        const exp = (req.body.exp || "").trim();
        const instructions = (req.body.instructions || "").trim();
        const categoryid = parseInt(req.body.categoryid, 10);

        if (!title || !exp || !instructions || !Number.isInteger(categoryid)) {
            return res.status(400).json({ error: "Tüm alanları doldurun" });
        }

        let baseSlug = tr(title);
        if (!baseSlug) baseSlug = "tarif";
        let slug = baseSlug;
        let i = 2;
        while (true) {
            const ex = await db.execute("SELECT 1 FROM recipes WHERE slug=?", [slug]);
            if (!ex[0][0]) break;
            slug = baseSlug + "-" + i;
            i++;
        }

        const image = req.file ? "/static/uploads/recipes/" + req.file.filename : null;

        const ins = await db.execute(
            `INSERT INTO recipes (title, slug, exp, instructions, image, categoryid, userid)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, slug, exp, instructions, image, categoryid, userid]
        );
        const recipeid = ins[0].insertId;

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

        res.json({ ok: true, recipeid, slug });
    } catch (err) {
        return next(err);
    }
};

// POST /api/admin/recipes/:id/delete
exports.postRecipeDelete = async (req, res, next) => {
    try {
        const userid = req.session.userid;
        const role = req.session.role;
        const recipeid = parseInt(req.params.id, 10);
        if (!Number.isInteger(recipeid)) return res.status(400).json({ error: "Geçersiz tarif" });

        const r = await db.execute("SELECT userid FROM recipes WHERE recipeid=?", [recipeid]);
        const row = r[0][0];
        if (!row) return res.status(404).json({ error: "Tarif bulunamadı" });
        if (role !== "admin" && row.userid !== userid) {
            return res.status(403).json({ error: "Bu tarifi silme yetkin yok" });
        }

        await db.execute("DELETE FROM recipes WHERE recipeid=?", [recipeid]);
        res.json({ ok: true });
    } catch (err) {
        return next(err);
    }
};

// ============================================================
// Duyurular (admin-only)
// ============================================================

exports.getAnnouncements = async (req, res, next) => {
    try {
        const r = await db.execute(
            `SELECT a.noticeid, a.title, a.exp, a.isactive, a.createdAt,
                    u.name AS userName, u.surname AS userSurname
             FROM anc a JOIN users u ON u.userid = a.userid
             ORDER BY a.createdAt DESC`
        );
        res.json({ announcements: r[0] });
    } catch (err) {
        return next(err);
    }
};

exports.postAnnouncement = async (req, res, next) => {
    try {
        const userid = req.session.userid;
        const title = (req.body.title || "").trim();
        const exp = (req.body.exp || "").trim();
        const isactive = req.body.isactive ? 1 : 0;
        if (!title || !exp) return res.status(400).json({ error: "Başlık ve içerik zorunlu" });

        const ins = await db.execute(
            "INSERT INTO anc (title, exp, isactive, userid) VALUES (?, ?, ?, ?)",
            [title, exp, isactive, userid]
        );
        res.json({ ok: true, noticeid: ins[0].insertId });
    } catch (err) {
        return next(err);
    }
};

exports.postAnnouncementToggle = async (req, res, next) => {
    try {
        const noticeid = parseInt(req.params.id, 10);
        if (!Number.isInteger(noticeid)) return res.status(400).json({ error: "Geçersiz duyuru" });
        await db.execute("UPDATE anc SET isactive = 1 - isactive WHERE noticeid=?", [noticeid]);
        const r = await db.execute("SELECT isactive FROM anc WHERE noticeid=?", [noticeid]);
        res.json({ ok: true, isactive: r[0][0] ? r[0][0].isactive : null });
    } catch (err) {
        return next(err);
    }
};

exports.postAnnouncementDelete = async (req, res, next) => {
    try {
        const noticeid = parseInt(req.params.id, 10);
        if (!Number.isInteger(noticeid)) return res.status(400).json({ error: "Geçersiz duyuru" });
        await db.execute("DELETE FROM anc WHERE noticeid=?", [noticeid]);
        res.json({ ok: true });
    } catch (err) {
        return next(err);
    }
};

// ============================================================
// Galeri (admin-only)
// ============================================================

exports.getGallery = async (req, res, next) => {
    try {
        const r = await db.execute(
            `SELECT g.galleryid, g.title, g.image, g.createdAt,
                    u.name AS userName, u.surname AS userSurname
             FROM gallery g JOIN users u ON u.userid = g.userid
             ORDER BY g.createdAt DESC`
        );
        res.json({ items: r[0] });
    } catch (err) {
        return next(err);
    }
};

exports.postGallery = async (req, res, next) => {
    try {
        const userid = req.session.userid;
        const title = (req.body.title || "").trim() || "Görsel";
        if (!req.file) return res.status(400).json({ error: "Görsel yüklenmedi" });
        const image = "/static/uploads/gallery/" + req.file.filename;
        const ins = await db.execute(
            "INSERT INTO gallery (title, image, userid) VALUES (?, ?, ?)",
            [title, image, userid]
        );
        res.json({ ok: true, galleryid: ins[0].insertId, image });
    } catch (err) {
        return next(err);
    }
};

exports.postGalleryDelete = async (req, res, next) => {
    try {
        const galleryid = parseInt(req.params.id, 10);
        if (!Number.isInteger(galleryid)) return res.status(400).json({ error: "Geçersiz öğe" });

        const row = await db.execute("SELECT image FROM gallery WHERE galleryid=?", [galleryid]);
        const item = row[0][0];
        if (!item) return res.status(404).json({ error: "Bulunamadı" });

        await db.execute("DELETE FROM gallery WHERE galleryid=?", [galleryid]);

        if (item.image && item.image.startsWith("/static/")) {
            const rel = item.image.replace(/^\/static\//, "");
            const abs = path.join(__dirname, "..", "public", rel);
            fs.unlink(abs, () => { /* yut */ });
        }

        res.json({ ok: true });
    } catch (err) {
        return next(err);
    }
};
