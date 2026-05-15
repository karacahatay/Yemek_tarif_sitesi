// Korumalı route'larda kullanılır. Oturum yoksa 401 JSON döner.
// Frontend bunu yakalayıp login sayfasına yönlendirir.
module.exports = (req, res, next) => {
    if (!req.session.isAuth) {
        return res.status(401).json({ error: "Giriş gerekli", code: "AUTH_REQUIRED" });
    }
    next();
};
