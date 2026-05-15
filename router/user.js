// User router.
// CLAUDE.md kuralları:
// - csrf middleware'i SADECE form render eden GET'lere.
// - isAuth POST'lara (like/save/comment) + /saved'a.
const express = require("express");
const router = express.Router();
const userController = require("../controller/user.js");
const loadSidebar = require("../middleware/loadSidebar.js");
const isAuth = require("../middleware/isAuth.js");
const csrf = require("../middleware/csrf.js");

router.use(loadSidebar);

router.get("/", userController.getHome);
router.get("/search", userController.getSearch);
router.get("/search/ingredients", userController.getIngredientSearch);
router.get("/announcements", userController.getAnnouncements);
router.get("/gallery", userController.getGallery);
router.get("/sitemap", userController.getSitemap);
router.get("/saved", isAuth, userController.getSaved);
router.get("/category/:slug", userController.getCategory);

// Tarif detay sayfasında like/save/comment formları olduğu için csrf token gerekli.
router.get("/recipe/:slug", csrf, userController.getRecipe);

// Auth-gated POST'lar. csrf eklenmez — csurf() global olarak doğrular.
router.post("/recipe/:id/like",    isAuth, userController.postLikeToggle);
router.post("/recipe/:id/save",    isAuth, userController.postSaveToggle);
router.post("/recipe/:id/comment", isAuth, userController.postComment);

module.exports = router;
