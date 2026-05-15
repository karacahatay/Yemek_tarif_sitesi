// Test verisi yükler. Idempotent: var olanları atlar.
// Kullanım: node seed.js
const bcrypt = require("bcrypt");
const slugify = require("slugify");
const db = require("./model/db.js");

const seedUsers = [
    { email: "admin@site.com", name: "Admin",  surname: "Site",  role: "admin" },
    { email: "chef@site.com",  name: "Ahmet",  surname: "Şef",   role: "chef"  },
    { email: "user@site.com",  name: "Ayşe",   surname: "Demir", role: "user"  }
];

const seedCategories = [
    "Kahvaltılık",
    "Çorbalar",
    "Ana Yemekler",
    "Salatalar",
    "Tatlılar"
];

const seedIngredients = [
    "Un", "Şeker", "Tuz", "Yumurta", "Süt", "Tereyağı", "Zeytinyağı",
    "Soğan", "Sarımsak", "Domates", "Biber", "Patates", "Havuç",
    "Mercimek", "Pirinç", "Tavuk", "Kıyma", "Maydanoz", "Limon", "Karabiber"
];

// Tarifler: kategori adı + malzeme listesi
const seedRecipes = [
    {
        title: "Mercimek Çorbası",
        exp: "Klasik Türk mutfağının vazgeçilmezi, sıcacık bir çorba.",
        instructions: "Mercimeği yıkayın. Soğanı kavurun, mercimeği ekleyin, su koyun. 30 dk pişirin. Blenderdan geçirin. Tuz ve karabiber ekleyin.",
        category: "Çorbalar",
        ingredients: [
            { name: "Mercimek", amount: "1 su bardağı" },
            { name: "Soğan",    amount: "1 adet" },
            { name: "Tuz",      amount: "1 tatlı kaşığı" },
            { name: "Karabiber",amount: "yarım çay kaşığı" },
            { name: "Tereyağı", amount: "1 yemek kaşığı" }
        ]
    },
    {
        title: "Menemen",
        exp: "Domates, biber ve yumurtanın eşsiz buluşması.",
        instructions: "Biberleri zeytinyağında soteleyin. Domatesleri ekleyin. Yumurtayı kırın, karıştırarak pişirin. Tuz serpip servis edin.",
        category: "Kahvaltılık",
        ingredients: [
            { name: "Domates",    amount: "3 adet" },
            { name: "Biber",      amount: "2 adet" },
            { name: "Yumurta",    amount: "3 adet" },
            { name: "Zeytinyağı", amount: "2 yemek kaşığı" },
            { name: "Tuz",        amount: "yarım çay kaşığı" }
        ]
    },
    {
        title: "Tavuk Sote",
        exp: "Sebzeli, pratik bir ana yemek.",
        instructions: "Tavuğu kuşbaşı doğrayın. Sote tavada zeytinyağı ile pişirin. Biber, domates, soğan ekleyin. Tuz ve karabiber ile tatlandırın.",
        category: "Ana Yemekler",
        ingredients: [
            { name: "Tavuk",     amount: "500 g" },
            { name: "Soğan",     amount: "1 adet" },
            { name: "Domates",   amount: "2 adet" },
            { name: "Biber",     amount: "2 adet" },
            { name: "Sarımsak",  amount: "3 diş" },
            { name: "Karabiber", amount: "yarım çay kaşığı" }
        ]
    },
    {
        title: "Sütlaç",
        exp: "Geleneksel pirinçli tatlı.",
        instructions: "Pirinci az suda haşlayın. Sütü ekleyin, kaynayınca şekeri katın. Karıştırarak koyulaştırın. Kaselere paylaştırıp soğutun.",
        category: "Tatlılar",
        ingredients: [
            { name: "Süt",    amount: "1 litre" },
            { name: "Pirinç", amount: "yarım su bardağı" },
            { name: "Şeker",  amount: "1 su bardağı" }
        ]
    },
    {
        title: "Çoban Salatası",
        exp: "Yaz sofralarının taze klasiği.",
        instructions: "Tüm sebzeleri küp doğrayın. Maydanozu kıyın. Zeytinyağı, limon, tuz ile karıştırın.",
        category: "Salatalar",
        ingredients: [
            { name: "Domates",    amount: "3 adet" },
            { name: "Biber",      amount: "2 adet" },
            { name: "Soğan",      amount: "1 adet" },
            { name: "Maydanoz",   amount: "1 demet" },
            { name: "Limon",      amount: "1 adet" },
            { name: "Zeytinyağı", amount: "2 yemek kaşığı" },
            { name: "Tuz",        amount: "1 çay kaşığı" }
        ]
    }
];

const tr = (s) => slugify(s, { lower: true, strict: true, locale: "tr" });

(async () => {
    try {
        // 1) Users
        const hash = await bcrypt.hash("123456", 10);
        for (const u of seedUsers) {
            const ex = await db.execute("SELECT userid FROM users WHERE email=?", [u.email]);
            if (ex[0][0]) { console.log("Atlandı (user):", u.email); continue; }
            await db.execute(
                "INSERT INTO users (email, password, name, surname, role) VALUES (?, ?, ?, ?, ?)",
                [u.email, hash, u.name, u.surname, u.role]
            );
            console.log("Eklendi (user):", u.email);
        }

        // chef userid'sini bul
        const chefRow = await db.execute("SELECT userid FROM users WHERE email=?", ["chef@site.com"]);
        const chefId = chefRow[0][0].userid;

        // 2) Categories
        for (const c of seedCategories) {
            const slug = tr(c);
            const ex = await db.execute("SELECT categoryid FROM categories WHERE slug=?", [slug]);
            if (ex[0][0]) { console.log("Atlandı (cat):", c); continue; }
            await db.execute(
                "INSERT INTO categories (name, slug) VALUES (?, ?)",
                [c, slug]
            );
            console.log("Eklendi (cat):", c);
        }

        // 3) Ingredients
        for (const ing of seedIngredients) {
            const ex = await db.execute("SELECT ingredientid FROM ingredients WHERE name=?", [ing]);
            if (ex[0][0]) continue;
            await db.execute("INSERT INTO ingredients (name) VALUES (?)", [ing]);
        }
        console.log("Malzemeler hazır.");

        // 4) Recipes + recipe_ingredients
        for (const r of seedRecipes) {
            const slug = tr(r.title);
            const ex = await db.execute("SELECT recipeid FROM recipes WHERE slug=?", [slug]);
            if (ex[0][0]) { console.log("Atlandı (recipe):", r.title); continue; }

            const cat = await db.execute("SELECT categoryid FROM categories WHERE name=?", [r.category]);
            const categoryid = cat[0][0].categoryid;

            const ins = await db.execute(
                "INSERT INTO recipes (title, slug, exp, instructions, categoryid, userid) VALUES (?, ?, ?, ?, ?, ?)",
                [r.title, slug, r.exp, r.instructions, categoryid, chefId]
            );
            const recipeid = ins[0].insertId;

            for (const item of r.ingredients) {
                const ing = await db.execute("SELECT ingredientid FROM ingredients WHERE name=?", [item.name]);
                const ingredientid = ing[0][0].ingredientid;
                await db.execute(
                    "INSERT INTO recipe_ingredients (recipeid, ingredientid, amount) VALUES (?, ?, ?)",
                    [recipeid, ingredientid, item.amount]
                );
            }
            console.log("Eklendi (recipe):", r.title);
        }

        console.log("\nTamam. Test kullanıcıları: admin@site.com / chef@site.com / user@site.com (şifre: 123456)");
        process.exit(0);
    } catch (err) {
        console.error("Seed hatası:", err);
        process.exit(1);
    }
})();
