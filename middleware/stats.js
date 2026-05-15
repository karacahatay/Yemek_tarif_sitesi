// Ziyaretçi (IP tabanlı) ve online kullanıcı (session bazlı) sayacı.
// - Ziyaretçi: visitors tablosunda tekil IP. INSERT ... ON DUPLICATE KEY UPDATE.
// - Online: in-memory Map<sessionID, lastSeenMs>. 5 dk timeout.
// Bu middleware HTML render eden GET istekleri için anlamlıdır; favicon/static
// için zaten /static prefix'i ile statik sunulduğundan ulaşmıyor.
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
    // Express trust proxy kapalı; req.ip yine de doğru ip'yi verir.
    const raw = req.ip || req.connection.remoteAddress || "0.0.0.0";
    // IPv6 mapped IPv4'ü temizle (::ffff:127.0.0.1 -> 127.0.0.1)
    return raw.replace(/^::ffff:/, "");
}

module.exports = async (req, res, next) => {
    try {
        const ip = extractIp(req);

        // Ziyaretçi tablosuna ekle / güncelle
        await db.execute(
            `INSERT INTO visitors (ip, visits) VALUES (?, 1)
             ON DUPLICATE KEY UPDATE visits = visits + 1`,
            [ip]
        );

        // Online: session id'yi işle. Session yoksa IP'yi anahtar olarak kullan.
        const sid = req.sessionID || ip;
        activeSessions.set(sid, Date.now());
        pruneOnline();

        // res.locals'a yaz
        const cntRes = await db.execute("SELECT COUNT(*) AS total FROM visitors");
        res.locals.visitorCount = cntRes[0][0].total;
        res.locals.onlineCount  = activeSessions.size;

        next();
    } catch (err) {
        // Sayaç hatası sayfayı kırmasın.
        res.locals.visitorCount = 0;
        res.locals.onlineCount  = 0;
        next();
    }
};
