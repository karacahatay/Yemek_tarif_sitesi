// Belirli rolleri zorunlu kılar. isAuth'tan SONRA kullanılmalı.
module.exports = (...roles) => {
    return (req, res, next) => {
        if (!req.session.isAuth) {
            return res.status(401).json({ error: "Giriş gerekli", code: "AUTH_REQUIRED" });
        }
        if (roles.length === 0 || roles.includes(req.session.role)) {
            return next();
        }
        return res.status(403).json({ error: "Bu işlem için yetkin yok" });
    };
};
