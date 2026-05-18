// Ziyaretçi (IP) + online (in-memory) sayaç.
// res.locals yerine: req.stats objesine yazar, /api/stats endpoint'i okur.
const db = require("../model/db.js");

const ONLINE_TIMEOUT_MS = 5 * 60 * 1000;
const activeSessions = new Map();

function pruneOnline() {
    const now = Date.now();
    for (const [sid, ts] of activeSessions) {
        if (now - ts > ONLINE_TIMEOUT_MS) activeSessions.delete(sid);
    }
}

function extractIp(req) {
    const raw = req.ip || req.connection.remoteAddress || "0.0.0.0";
    return raw.replace(/^::ffff:/, "");
}

async function getStats() {
    try {
        pruneOnline();
        const cnt = await db.execute("SELECT COUNT(*) AS total FROM visitors");
        return {
            visitorCount: cnt[0][0].total,
            onlineCount: activeSessions.size
        };
    } catch (e) {
        return { visitorCount: 0, onlineCount: 0 };
    }
}

function onlineKey(req, ip) {
    if (req.session && req.session.isAuth && req.session.userid) {
        return "user:" + req.session.userid;
    }
    return "ip:" + ip;
}

const middleware = async (req, res, next) => {
    try {
        const ip = extractIp(req);
        await db.execute(
            `INSERT INTO visitors (ip, visits) VALUES (?, 1)
             ON DUPLICATE KEY UPDATE visits = visits + 1`,
            [ip]
        );
        activeSessions.set(onlineKey(req, ip), Date.now());
        pruneOnline();
        next();
    } catch (err) {
        // Sessizce devam et
        next();
    }
};

middleware.getStats = getStats;
module.exports = middleware;
