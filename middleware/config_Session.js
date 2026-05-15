// express-session yapılandırması.
const session = require("express-session");

const configSession = session({
    secret: "b1f6e9c2-7a48-4d3e-9c11-2a8e7f5d6b3a",
    resave: false,
    saveUninitialized: false,
    cookie: {
        // 1 gün
        maxAge: 1000 * 60 * 60 * 24
    }
});

module.exports = configSession;
