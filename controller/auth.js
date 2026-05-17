// Auth controller — JSON API.
// CLAUDE.md sözleşmesi:
// - db.execute -> [rows, fields]
// - bcrypt ile şifre karşılaştırma
const bcrypt = require("bcrypt");
const db = require("../model/db.js");

function publicUser(u) {
    return {
        userid: u.userid,
        email: u.email,
        name: u.name,
        surname: u.surname,
        role: u.role,
        fullname: (u.name || "") + " " + (u.surname || "")
    };
}

// POST /api/auth/login  { email, password, hatirla }
exports.postLogin = async (req, res, next) => {
    try {
        const email = (req.body.email || "").trim();
        const password = req.body.password || "";
        const hatirla = !!req.body.hatirla;

        const result = await db.execute(
            "SELECT userid, email, password, name, surname, role FROM users WHERE email=?",
            [email]
        );
        const user = result[0][0];
        if (!user) return res.status(401).json({ error: "Email veya şifre hatalı" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ error: "Email veya şifre hatalı" });

        if (hatirla) {
            const opts = { maxAge: 1000 * 60 * 60 * 24 * 30 };
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

        req.session.save((err) => {
            if (err) return next(err);
            return res.json({ user: publicUser(user) });
        });
    } catch (err) {
        return next(err);
    }
};

// POST /api/auth/register  { name, surname, email, password, role }
exports.postRegister = async (req, res, next) => {
    try {
        const name = (req.body.name || "").trim();
        const surname = (req.body.surname || "").trim();
        const email = (req.body.email || "").trim();
        const password = req.body.password || "";
        let role = (req.body.role || "user").trim();
        if (role !== "chef" && role !== "user") role = "user";

        if (!name || !surname || !email || !password) {
            return res.status(400).json({ error: "Tüm alanları doldurun" });
        }

        const existing = await db.execute(
            "SELECT userid FROM users WHERE email=?",
            [email]
        );
        if (existing[0][0]) {
            return res.status(409).json({ error: "Bu email zaten kayıtlı" });
        }

        const hash = await bcrypt.hash(password, 10);
        await db.execute(
            "INSERT INTO users (email, password, name, surname, role) VALUES (?, ?, ?, ?, ?)",
            [email, hash, name, surname, role]
        );

        return res.json({ ok: true });
    } catch (err) {
        return next(err);
    }
};

// POST /api/auth/signout
exports.postSignout = async (req, res, next) => {
    try {
        req.session.destroy(() => {
            res.clearCookie("connect.sid");
            res.json({ ok: true });
        });
    } catch (err) {
        return next(err);
    }
};

// GET /api/auth/remembered — "beni hatırla" cookie'sini döner (frontend login formunu önceden doldurur)
exports.getRemembered = async (req, res, next) => {
    try {
        res.json({
            email: req.cookies.cemail || "",
            password: req.cookies.cpassword || ""
        });
    } catch (err) {
        return next(err);
    }
};
