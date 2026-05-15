// SADECE res.locals.csrfToken atar.
// Genel CSRF doğrulaması index.js'te app.use(csurf()) ile yapılır.
module.exports = (req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
};
