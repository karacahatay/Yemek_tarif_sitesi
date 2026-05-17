// Admin router (API). Tüm /api/admin/* yolları isAuth + chef/admin altında.
const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin.js");
const isAuth = require("../middleware/isAuth.js");
const requireRole = require("../middleware/requireRole.js");
const { uploadRecipe, uploadGallery } = require("../middleware/uploads.js");

const requireChef = requireRole("chef", "admin");
const requireAdmin = requireRole("admin");

router.use(isAuth, requireChef);

router.get("/dashboard",            adminController.getDashboard);

// Tarif (chef + admin)
router.get("/recipes",              adminController.getRecipes);
router.post("/recipes",             uploadRecipe.single("image"), adminController.postRecipe);
router.post("/recipes/:id/delete",  adminController.postRecipeDelete);

// Duyuru (admin)
router.get("/announcements",             requireAdmin, adminController.getAnnouncements);
router.post("/announcements",            requireAdmin, adminController.postAnnouncement);
router.post("/announcements/:id/toggle", requireAdmin, adminController.postAnnouncementToggle);
router.post("/announcements/:id/delete", requireAdmin, adminController.postAnnouncementDelete);

// Galeri (admin)
router.get("/gallery",             requireAdmin, adminController.getGallery);
router.post("/gallery",            requireAdmin, uploadGallery.single("image"), adminController.postGallery);
router.post("/gallery/:id/delete", requireAdmin, adminController.postGalleryDelete);

module.exports = router;
