// Admin router.
// CLAUDE.md:
// - csrf middleware'i SADECE form render eden GET'lere
// - isAuth tüm admin route'larında
// - Multer multipart parse eder; csurf body okuyamadığı için form action'a ?_csrf konur
const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin.js");
const isAuth = require("../middleware/isAuth.js");
const requireRole = require("../middleware/requireRole.js");
const csrf = require("../middleware/csrf.js");
const { uploadRecipe, uploadGallery } = require("../middleware/uploads.js");

const requireChef = requireRole("chef", "admin");
const requireAdmin = requireRole("admin");

// Tüm /admin/* yolları için ortak guard (giriş + en az şef rolü)
router.use(isAuth, requireChef);

router.get("/", csrf, adminController.getDashboard);

// Tarif CRUD (şef + admin)
router.get("/recipes",             csrf, adminController.getRecipes);
router.get("/recipes/new",         csrf, adminController.getRecipeForm);
router.post("/recipes",            uploadRecipe.single("image"), adminController.postRecipe);
router.post("/recipes/:id/delete", adminController.postRecipeDelete);

// Duyuru CRUD (sadece admin)
router.get("/announcements",            requireAdmin, csrf, adminController.getAnnouncements);
router.get("/announcements/new",        requireAdmin, csrf, adminController.getAnnouncementForm);
router.post("/announcements",           requireAdmin, adminController.postAnnouncement);
router.post("/announcements/:id/toggle", requireAdmin, adminController.postAnnouncementToggle);
router.post("/announcements/:id/delete", requireAdmin, adminController.postAnnouncementDelete);

// Galeri CRUD (sadece admin)
router.get("/gallery",            requireAdmin, csrf, adminController.getGallery);
router.post("/gallery",           requireAdmin, uploadGallery.single("image"), adminController.postGallery);
router.post("/gallery/:id/delete", requireAdmin, adminController.postGalleryDelete);

module.exports = router;
