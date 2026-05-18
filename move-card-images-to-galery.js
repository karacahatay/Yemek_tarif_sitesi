// Tarif kartı görsellerini public/galery altına kopyalar ve DB yollarını günceller.
const fs = require("fs/promises");
const path = require("path");
const db = require("./model/db.js");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const OLD_PREFIX = "/static/uploads/recipes/extra/";
const NEW_PREFIX = "/static/galery/";
const TARGET_DIR = path.join(PUBLIC_DIR, "galery");
const SOURCE_MANIFEST = path.join(PUBLIC_DIR, "uploads", "recipes", "recipe-image-sources.json");
const TARGET_MANIFEST = path.join(TARGET_DIR, "recipe-image-sources.json");

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch (_) {
        return false;
    }
}

async function readManifest() {
    if (!(await fileExists(SOURCE_MANIFEST))) return [];
    return JSON.parse(await fs.readFile(SOURCE_MANIFEST, "utf8"));
}

(async () => {
    await fs.mkdir(TARGET_DIR, { recursive: true });

    const [recipes] = await db.execute(
        "SELECT recipeid, title, image FROM recipes WHERE image IS NOT NULL AND image<>'' ORDER BY recipeid ASC"
    );

    let copied = 0;
    let updated = 0;

    for (const recipe of recipes) {
        if (recipe.image.startsWith(NEW_PREFIX)) continue;
        if (!recipe.image.startsWith(OLD_PREFIX)) {
            console.log(`Atlandı: ${recipe.title} (${recipe.image})`);
            continue;
        }

        const fileName = recipe.image.slice(OLD_PREFIX.length);
        const sourcePath = path.join(PUBLIC_DIR, "uploads", "recipes", "extra", fileName);
        const targetPath = path.join(TARGET_DIR, fileName);

        if (!(await fileExists(sourcePath))) {
            console.log(`Dosya bulunamadı: ${recipe.title} (${fileName})`);
            continue;
        }

        await fs.copyFile(sourcePath, targetPath);
        copied++;

        await db.execute("UPDATE recipes SET image=? WHERE recipeid=?", [
            NEW_PREFIX + fileName,
            recipe.recipeid
        ]);
        updated++;
    }

    const manifest = await readManifest();
    const movedManifest = manifest.map(item => {
        if (item.type !== "recipe-main" || !item.imagePath) return item;
        if (!item.imagePath.startsWith(OLD_PREFIX)) return item;
        const fileName = item.imagePath.slice(OLD_PREFIX.length);
        return {
            ...item,
            imagePath: NEW_PREFIX + fileName
        };
    });

    await fs.writeFile(SOURCE_MANIFEST, JSON.stringify(movedManifest, null, 2), "utf8");
    await fs.writeFile(TARGET_MANIFEST, JSON.stringify(movedManifest, null, 2), "utf8");

    const [summary] = await db.execute(
        `SELECT
            COUNT(*) AS recipes,
            SUM(image LIKE ?) AS galeryImages,
            SUM(image LIKE ?) AS oldImages
         FROM recipes`,
        [NEW_PREFIX + "%", OLD_PREFIX + "%"]
    );

    console.log(JSON.stringify({ copied, updated, summary: summary[0] }, null, 2));
})()
    .catch(err => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(async () => {
        try { await db.end(); } catch (_) { /* yut */ }
    });
