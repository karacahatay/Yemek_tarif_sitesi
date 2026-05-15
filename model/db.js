// MySQL bağlantısı - .promise() ile dışa aktarılır.
// CLAUDE.md: Tüm controller'lar bu .promise() sözleşmesine bağlıdır.
const mysql = require("mysql2");

let connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Hamza869!",
    database: "food_web"
});

connection.connect(err => {
    if (err) return console.log("MySQL bağlantı hatası:", err.message);
    console.log("MySQL bağlantısı kuruldu.");
});

module.exports = connection.promise();
