// Tarif kartlarını ve detay bilgilerini günceller:
// - kişi sayısı, hazırlama/pişirme süresi
// - adım fotoğrafsız, daha ayrıntılı yapılış maddeleri
const db = require("./model/db.js");

const explicitFacts = {
    "Mercimek Çorbası": { servings: 6, prep: 10, cook: 40 },
    "Menemen": { servings: 2, prep: 10, cook: 15 },
    "Tavuk Sote": { servings: 4, prep: 15, cook: 25 },
    "Sütlaç": { servings: 6, prep: 10, cook: 35 },
    "Çoban Salatası": { servings: 4, prep: 15, cook: 0 },
    "Peynirli Omlet": { servings: 2, prep: 5, cook: 8 },
    "Sucuklu Yumurta": { servings: 2, prep: 5, cook: 10 },
    "Kaşarlı Tost": { servings: 2, prep: 5, cook: 8 },
    "Patatesli Yumurta": { servings: 3, prep: 10, cook: 18 },
    "Pankek": { servings: 4, prep: 10, cook: 15 },
    "Yulaf Lapası": { servings: 2, prep: 5, cook: 8 },
    "Domatesli Biberli Yumurta": { servings: 3, prep: 10, cook: 15 },
    "Peynirli Poğaça": { servings: 6, prep: 25, cook: 25 },
    "Avokadolu Yumurta": { servings: 2, prep: 10, cook: 8 },
    "Zeytinli Açma": { servings: 6, prep: 35, cook: 25 },
    "Kuru Fasulye": { servings: 4, prep: 15, cook: 45 },
    "Nohut Yemeği": { servings: 4, prep: 15, cook: 45 },
    "Karnıyarık": { servings: 4, prep: 25, cook: 35 },
    "İmam Bayıldı": { servings: 4, prep: 25, cook: 35 },
    "Fırında Balık": { servings: 2, prep: 15, cook: 25 },
    "Baklava": { servings: 8, prep: 35, cook: 40 },
    "Aşure": { servings: 8, prep: 30, cook: 60 },
    "Tiramisu": { servings: 6, prep: 25, cook: 0 },
    "Cheesecake": { servings: 8, prep: 25, cook: 45 },
    "Magnolia": { servings: 6, prep: 20, cook: 15 }
};

function defaultFacts(categoryName) {
    if (categoryName === "Kahvaltılık") return { servings: 3, prep: 10, cook: 15 };
    if (categoryName === "Çorbalar") return { servings: 6, prep: 12, cook: 30 };
    if (categoryName === "Ana Yemekler") return { servings: 4, prep: 20, cook: 35 };
    if (categoryName === "Salatalar") return { servings: 4, prep: 15, cook: 0 };
    if (categoryName === "Tatlılar") return { servings: 6, prep: 20, cook: 30 };
    return { servings: 4, prep: 15, cook: 25 };
}

function cleanStep(step) {
    return (step || "")
        .replace(/^\s*\d+\.\s*/, "")
        .trim()
        .replace(/\.$/, "");
}

function joinIngredients(ingredients) {
    const names = ingredients.map(i => i.name).slice(0, 6);
    if (names.length === 0) return "malzemeleri";
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(", ") + " ve " + names[names.length - 1];
}

function categoryPrep(categoryName, ingredientsText) {
    if (categoryName === "Çorbalar") {
        return `${ingredientsText} için gereken sebze ve bakliyatları ayıklayın; bakliyatları bol suda yıkayıp süzün, sebzeleri de kolay pişecek iri parçalar halinde doğrayın.`;
    }
    if (categoryName === "Salatalar") {
        return `${ingredientsText} başta olmak üzere tüm salata malzemelerini yıkayıp iyice kurulayın; sulanmayı azaltmak için doğrama işlemine servis saatine yakın başlayın.`;
    }
    if (categoryName === "Tatlılar") {
        return `${ingredientsText} ölçülerini tezgaha alın; sütlü ya da hamurlu karışımlarda topak kalmaması için kuru malzemeleri mümkünse eleyerek hazırlayın.`;
    }
    if (categoryName === "Kahvaltılık") {
        return `${ingredientsText} için kullanılacak malzemeleri oda sıcaklığına yakın bekletin; yumurtalı tariflerde yumurtaları ayrı bir kasede kontrol ederek hazırlayın.`;
    }
    return `${ingredientsText} malzemelerini hazırlayın; et, tavuk veya sebzeleri eşit boylarda doğrayarak pişme sürelerinin dengeli olmasını sağlayın.`;
}

function categoryFinish(categoryName, title) {
    if (categoryName === "Çorbalar") {
        return `${title} kıvamını kontrol edin; çok koyuysa azar azar sıcak su ekleyin, çok suluysa birkaç dakika kapağı açık kaynatıp sıcak servis edin.`;
    }
    if (categoryName === "Salatalar") {
        return `${title} sosunu servis etmeden hemen önce ekleyin; nazikçe karıştırıp sebzelerin diri ve parlak kalmasına dikkat edin.`;
    }
    if (categoryName === "Tatlılar") {
        return `${title} oda sıcaklığına geldikten sonra dinlendirin; kıvamı oturunca dilimleyin ya da kaselere paylaştırıp servis edin.`;
    }
    if (categoryName === "Kahvaltılık") {
        return `${title} en iyi sıcak tüketilir; tavadan aldıktan sonra bekletmeden, yanında ekmek ve taze yeşillikle servis edin.`;
    }
    return `${title} piştikten sonra 5 dakika dinlendirin; sosunun yemeğe işlemesi için servis etmeden önce son kez nazikçe karıştırın.`;
}

function detailSteps(recipe, ingredients) {
    const base = recipe.instructions
        .split("\n")
        .map(cleanStep)
        .filter(Boolean);
    const ingredientsText = joinIngredients(ingredients);
    const first = base[0] || "Malzemeleri tarifte kullanılacak şekilde hazırlayın";
    const second = base[1] || "Pişirme kabını ısıtıp ana malzemeleri sırayla ekleyin";
    const third = base[2] || "Kıvam ve lezzeti kontrol ederek pişirmeyi tamamlayın";

    return [
        categoryPrep(recipe.categoryName, ingredientsText),
        `${first}. Bu aşamada doğrama boylarını benzer tutun; böylece hem görüntü daha düzenli olur hem de malzemeler aynı anda pişer.`,
        `${second}. Ocağı orta ateşte tutun; malzemeleri ekledikten sonra birkaç dakika karıştırarak lezzetlerin birbirine geçmesini sağlayın.`,
        `${third}. Tuz ve baharatı sona doğru kontrol edin; gerekirse az miktarda sıcak su, süt ya da sos ekleyerek kıvamı dengeleyin.`,
        categoryFinish(recipe.categoryName, recipe.title)
    ];
}

(async () => {
    const [columns] = await db.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'recipes'
           AND COLUMN_NAME IN ('servings', 'prepMinutes', 'cookMinutes')`
    );
    const existingColumns = new Set(columns.map(c => c.COLUMN_NAME));
    if (!existingColumns.has("servings")) {
        await db.execute("ALTER TABLE recipes ADD COLUMN servings INT NOT NULL DEFAULT 4");
    }
    if (!existingColumns.has("prepMinutes")) {
        await db.execute("ALTER TABLE recipes ADD COLUMN prepMinutes INT NOT NULL DEFAULT 15");
    }
    if (!existingColumns.has("cookMinutes")) {
        await db.execute("ALTER TABLE recipes ADD COLUMN cookMinutes INT NOT NULL DEFAULT 30");
    }
    await db.execute("UPDATE recipe_steps SET image=NULL");

    const [recipes] = await db.execute(
        `SELECT r.recipeid, r.title, r.instructions, c.name AS categoryName
         FROM recipes r
         JOIN categories c ON c.categoryid = r.categoryid
         ORDER BY r.recipeid ASC`
    );

    for (const recipe of recipes) {
        const [ingredients] = await db.execute(
            `SELECT i.name, ri.amount
             FROM recipe_ingredients ri
             JOIN ingredients i ON i.ingredientid = ri.ingredientid
             WHERE ri.recipeid=?
             ORDER BY i.name ASC`,
            [recipe.recipeid]
        );
        const steps = detailSteps(recipe, ingredients);
        const facts = explicitFacts[recipe.title] || defaultFacts(recipe.categoryName);
        const instructions = steps.map((step, index) => `${index + 1}. ${step}`).join("\n");

        await db.execute(
            "UPDATE recipes SET instructions=?, servings=?, prepMinutes=?, cookMinutes=? WHERE recipeid=?",
            [instructions, facts.servings, facts.prep, facts.cook, recipe.recipeid]
        );
        await db.execute("DELETE FROM recipe_steps WHERE recipeid=?", [recipe.recipeid]);
        for (let i = 0; i < steps.length; i++) {
            await db.execute(
                "INSERT INTO recipe_steps (recipeid, stepOrder, body, image) VALUES (?, ?, ?, NULL)",
                [recipe.recipeid, i + 1, steps[i]]
            );
        }
    }

    const [summary] = await db.execute(
        "SELECT COUNT(*) AS recipes, (SELECT COUNT(*) FROM recipe_steps) AS steps FROM recipes"
    );
    console.log(JSON.stringify(summary[0], null, 2));
})()
    .catch(err => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(async () => {
        try { await db.end(); } catch (_) { /* yut */ }
    });
