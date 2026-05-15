// Auth router. CSRF middleware'i SADECE form render eden GET'lere eklenir.
const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.js");
const csrf = require("../middleware/csrf.js");

router.get("/login", csrf, authController.getLogin);
router.post("/login", authController.postLogin);

router.get("/register", csrf, authController.getRegister);
router.post("/register", authController.postRegister);

router.get("/signout", authController.getSignout);

module.exports = router;
