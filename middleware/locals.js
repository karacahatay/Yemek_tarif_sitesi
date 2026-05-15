// Her view için ortak değişkenleri res.locals'a yazar.
// header.ejs ve diğer partial'lar bu değişkenleri okur.
module.exports = (req, res, next) => {
    res.locals.fullname = req.session.fullname || null;
    res.locals.userid = req.session.userid || null;
    res.locals.role = req.session.role || null;
    res.locals.isAuth = !!req.session.isAuth;
    next();
};
