// User router (API). loadSidebar artık yok — kategoriler /api/categories'den çekilir.
const express = require("express");
const router = express.Router();
const userController = require("../controller/user.js");
const isAuth = require("../middleware/isAuth.js");

// Public
router.get("/home",                userController.getHome);
router.get("/search",              userController.getSearch);
router.get("/search/ingredients",  userController.getIngredientSearch);
router.get("/sitemap",             userController.getSitemap);
router.get("/announcements",       userController.getAnnouncements);
router.get("/gallery",             userController.getGallery);
router.get("/category/:slug",      userController.getCategory);
router.get("/recipe/:slug",        userController.getRecipe);

// Auth-gated
router.get("/saved",               isAuth, userController.getSaved);
router.post("/recipe/:id/like",    isAuth, userController.postLikeToggle);
router.post("/recipe/:id/save",    isAuth, userController.postSaveToggle);
router.post("/recipe/:id/comment", isAuth, userController.postComment);

module.exports = router;
