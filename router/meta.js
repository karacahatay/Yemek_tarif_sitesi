// Meta endpoint'leri: csrf-token, session, categories, ingredients, stats.
const express = require("express");
const router = express.Router();
const metaController = require("../controller/meta.js");

router.get("/csrf-token",  metaController.getCsrfToken);
router.get("/session",     metaController.getSession);
router.get("/categories",  metaController.getCategories);
router.get("/ingredients", metaController.getIngredients);
router.get("/stats",       metaController.getStats);

module.exports = router;
