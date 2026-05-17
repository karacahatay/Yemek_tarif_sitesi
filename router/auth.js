// Auth router (API). CSRF doğrulaması POST'larda global olarak app.use(csurf()) tarafından yapılır.
const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.js");

router.post("/login", authController.postLogin);
router.post("/register", authController.postRegister);
router.post("/signout", authController.postSignout);
router.get("/remembered", authController.getRemembered);

module.exports = router;
