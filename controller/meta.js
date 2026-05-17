// Meta endpoint'ler: SPA için ortak veri (csrf, session, kategoriler, malzemeler, stats).
const db = require("../model/db.js");
const stats = require("../middleware/stats.js");

// GET /api/csrf-token
exports.getCsrfToken = (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
};

// GET /api/session — şu anki kullanıcı bilgisi (yoksa null)
exports.getSession = (req, res) => {
    if (!req.session.isAuth) return res.json({ user: null });
    res.json({
        user: {
            userid: req.session.userid,
            fullname: req.session.fullname,
            role: req.session.role
        }
    });
};

// GET /api/categories
exports.getCategories = async (req, res, next) => {
    try {
        const r = await db.execute(
            "SELECT categoryid, name, slug FROM categories ORDER BY name ASC"
        );
        res.json({ categories: r[0] });
    } catch (err) {
        return next(err);
    }
};

// GET /api/ingredients
exports.getIngredients = async (req, res, next) => {
    try {
        const r = await db.execute(
            "SELECT ingredientid, name FROM ingredients ORDER BY name ASC"
        );
        res.json({ ingredients: r[0] });
    } catch (err) {
        return next(err);
    }
};

// GET /api/stats
exports.getStats = async (req, res) => {
    res.json(await stats.getStats());
};
