// Her user sayfasında sidebar için kategorileri res.locals'a koyar.
// Hata olursa boş liste ile devam eder; sayfa kırılmasın.
const db = require("../model/db.js");

module.exports = async (req, res, next) => {
    try {
        const result = await db.execute(
            "SELECT categoryid, name, slug FROM categories ORDER BY name ASC"
        );
        res.locals.sidebarCategories = result[0];
        next();
    } catch (err) {
        res.locals.sidebarCategories = [];
        next();
    }
};
