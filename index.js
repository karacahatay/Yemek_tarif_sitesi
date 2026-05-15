// Uygulama giriş noktası — REST API.
// React SPA (Vite) ayrı bir uygulama olarak frontend/ klasöründe çalışır.
// Vite dev server (5173) /api/* isteklerini buraya proxy'ler.
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const csurf = require("csurf");

const configSession = require("./middleware/config_Session.js");
const stats = require("./middleware/stats.js");

const authRouter = require("./router/auth.js");
const userRouter = require("./router/user.js");
const adminRouter = require("./router/admin.js");
const metaRouter = require("./router/meta.js");

const app = express();

// 1) Statik klasör — /static/uploads/* (resimler) için
app.use("/static", express.static(path.join(__dirname, "public")));

// 2) JSON body (POST /comment, /announcement vs. JSON gönderir)
app.use(express.json());
// 3) Form body (multer multipart hariç)
app.use(bodyParser.urlencoded({ extended: true }));

// 4) Session
app.use(configSession);

// 5) Cookie parser — csurf cookie mode için gerekli
app.use(cookieParser());

// 6) Stats (IP visitor + online sayaç)
app.use(stats);

// 7) CSRF — cookie mode. Frontend GET /api/csrf-token ile alır,
//    sonraki POST'larda X-CSRF-Token header'a koyar.
app.use(csurf({ cookie: true }));

// 8) Router'lar — hepsi /api altında
app.use("/api", metaRouter);                  // csrf-token, session, categories, ingredients, stats
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api", userRouter);                  // home, recipe, category, search, vs.

// 9) 404 yakalayıcı — JSON
app.use((req, res, next) => {
    res.status(404).json({ error: "Kaynak yok" });
});

// 10) Hata yakalayıcı — JSON
app.use((err, req, res, next) => {
    if (err && err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({ error: "Geçersiz CSRF token" });
    }
    const status = err && err.status ? err.status : 500;
    const message = typeof err === "string"
        ? err
        : (err && err.message) ? err.message : "Sunucu hatası";
    res.status(status).json({ error: message });
});

// 11) Sunucu
app.listen(3000, () => {
    console.log("API: http://localhost:3000");
});
