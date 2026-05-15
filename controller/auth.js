// Auth controller - kayıt, giriş, çıkış.
// CLAUDE.md sözleşmesi:
// - db.execute -> [rows, fields], rows = result[0]
// - bcrypt ile şifre karşılaştırma
// - Login sonrası req.query.url varsa oraya redirect
const bcrypt = require("bcrypt");
const db = require("../model/db.js");

// GET /auth/login - cookie'den email/password okur (beni hatırla), session.message varsa gösterir.
exports.getLogin = async (req, res, next) => {
    try {
        const cookieEmail = req.cookies.cemail || "";
        const cookiePassword = req.cookies.cpassword || "";
        const cbhatirla = !!(cookieEmail && cookiePassword);

        const message = req.session.message || null;
        req.session.message = null;

        res.render("auth/login.ejs", {
            title: "Giriş Yap",
            contentTitle: "Giriş Yap",
            viewData: {
                email: cookieEmail,
                password: cookiePassword,
                cbhatirla: cbhatirla
            },
            message: message,
            urlBack: req.query.url || ""
        });
    } catch (err) {
        return next(err);
    }
};

// POST /auth/login
exports.postLogin = async (req, res, next) => {
    try {
        const email = (req.body.email || "").trim();
        const password = req.body.password || "";
        const hatirla = req.body.cbhatirla === "on";
        const urlBack = req.body.urlBack || req.query.url || "";

        const result = await db.execute(
            "SELECT userid, email, password, name, surname, role FROM users WHERE email=?",
            [email]
        );
        const user = result[0][0];

        if (!user) {
            req.session.message = "Email veya şifre hatalı.";
            return res.redirect("/auth/login" + (urlBack ? "?url=" + encodeURIComponent(urlBack) : ""));
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            req.session.message = "Email veya şifre hatalı.";
            return res.redirect("/auth/login" + (urlBack ? "?url=" + encodeURIComponent(urlBack) : ""));
        }

        // Beni hatırla cookie'leri
        if (hatirla) {
            const opts = { maxAge: 1000 * 60 * 60 * 24 * 30 }; // 30 gün
            res.cookie("cemail", email, opts);
            res.cookie("cpassword", password, opts);
        } else {
            res.clearCookie("cemail");
            res.clearCookie("cpassword");
        }

        req.session.isAuth = true;
        req.session.userid = user.userid;
        req.session.fullname = (user.name || "") + " " + (user.surname || "");
        req.session.role = user.role;

        // Session'ın yazıldığından emin olmak için save sonrası redirect
        req.session.save((err) => {
            if (err) return next(err);
            if (urlBack) return res.redirect(urlBack);
            return res.redirect("/");
        });
    } catch (err) {
        return next(err);
    }
};

// GET /auth/register
exports.getRegister = async (req, res, next) => {
    try {
        const message = req.session.message || null;
        req.session.message = null;
        res.render("auth/register.ejs", {
            title: "Kayıt Ol",
            contentTitle: "Kayıt Ol",
            viewData: {
                name: "",
                surname: "",
                email: "",
                role: "user"
            },
            message: message
        });
    } catch (err) {
        return next(err);
    }
};

// POST /auth/register
exports.postRegister = async (req, res, next) => {
    try {
        const name = (req.body.name || "").trim();
        const surname = (req.body.surname || "").trim();
        const email = (req.body.email || "").trim();
        const password = req.body.password || "";
        // role: "user" veya "chef" (admin sadece elle veritabanında atanır)
        let role = (req.body.role || "user").trim();
        if (role !== "chef" && role !== "user") role = "user";

        if (!name || !surname || !email || !password) {
            req.session.message = "Tüm alanları doldurun.";
            return res.redirect("/auth/register");
        }

        const existing = await db.execute(
            "SELECT userid FROM users WHERE email=?",
            [email]
        );
        if (existing[0][0]) {
            req.session.message = "Bu email zaten kayıtlı.";
            return res.redirect("/auth/register");
        }

        const hash = await bcrypt.hash(password, 10);
        await db.execute(
            "INSERT INTO users (email, password, name, surname, role) VALUES (?, ?, ?, ?, ?)",
            [email, hash, name, surname, role]
        );

        req.session.message = "Kayıt başarılı. Giriş yapabilirsiniz.";
        return res.redirect("/auth/login");
    } catch (err) {
        return next(err);
    }
};

// GET /auth/signout
exports.getSignout = async (req, res, next) => {
    try {
        req.session.destroy(() => {
            res.redirect("/auth/login");
        });
    } catch (err) {
        return next(err);
    }
};
