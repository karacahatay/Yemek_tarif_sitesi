// MySQL bağlantısı - .promise() ile dışa aktarılır.
// AGENTS.md: Tüm controller'lar db.execute(sql, params) -> [rows, fields] sözleşmesine bağlıdır.
const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "123456",
    database: process.env.DB_NAME || "food_web",
    charset: "utf8mb4"
});

connection.connect(err => {
    if (err) return console.log("MySQL bağlantı hatası:", err.message);
    console.log("MySQL bağlantısı kuruldu.");
});

module.exports = connection.promise();
