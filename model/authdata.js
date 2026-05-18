// Ders notu için tutulan eski in-memory kullanıcı verisi.
// Aktif auth akışı users tablosunu ve bcrypt karşılaştırmasını kullanır.

const samplePasswordHash = "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36n5D4uMqOGZLzGweQ1b6Da";

module.exports = [
    {
        userid: 1,
        email: "admin@site.com",
        password: samplePasswordHash,
        name: "Admin",
        surname: "Site",
        role: "admin"
    },
    {
        userid: 2,
        email: "chef@site.com",
        password: samplePasswordHash,
        name: "Ahmet",
        surname: "Şef",
        role: "chef"
    },
    {
        userid: 3,
        email: "user@site.com",
        password: samplePasswordHash,
        name: "Ayşe",
        surname: "Demir",
        role: "user"
    }
];
