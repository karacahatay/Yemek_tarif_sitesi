// Otomatik aramanın kötü eşleştiği tarif kartı görsellerini net Wikimedia Commons dosyalarıyla düzeltir.
const fs = require("fs/promises");
const path = require("path");
const db = require("./model/db.js");

const EXTRA_DIR = path.join(__dirname, "public", "uploads", "recipes", "extra");
const SOURCE_FILE = path.join(__dirname, "public", "uploads", "recipes", "recipe-image-sources.json");
const USER_AGENT = "YemekTarifSitesi/1.0 specific image fix";

const fixes = {
    "Mercimek Çorbası": "Mercimek çorbasi.jpg",
    "Pankek": "Pancakes with maple syrup.jpg",
    "Şehriye Çorbası": "Chicken noodle soup.jpg",
    "Izgara Köfte": "Köfte.jpg",
    "Kuru Fasulye": "Kuru fasulye pilav.jpg",
    "Sebzeli Makarna": "Vegetable pasta.jpg",
    "Kıymalı Patates": "Picadillo con papas.jpg",
    "Gavurdağı Salatası": "Gavurdağı salad with lor cheese.jpg",
    "Patates Salatası": "Potato salad.jpg",
    "Roka Salatası": "Arugula Salad (30880788207).jpg",
    "Tiramisu": "Tiramisu - Raffaele Diomede.jpg",
    "Magnolia": "Magnolia–IMG 5735.jpg",
    "Keşkül": "Keşkül.jpg"
};

function extFrom(contentType, fileName) {
    const type = (contentType || "").split(";")[0].toLowerCase();
    if (type === "image/png") return ".png";
    if (type === "image/webp") return ".webp";
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".png")) return ".png";
    if (lower.endsWith(".webp")) return ".webp";
    return ".jpg";
}

async function loadManifest() {
    try {
        return JSON.parse(await fs.readFile(SOURCE_FILE, "utf8"));
    } catch (_) {
        return [];
    }
}

async function downloadCommons(fileName, slug) {
    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=1200`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`${res.status} ${fileName}`);
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) throw new Error(`${contentType} ${fileName}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 10000) throw new Error(`dosya küçük: ${fileName}`);
    const filename = `${slug}-main${extFrom(contentType, fileName)}`;
    await fs.writeFile(path.join(EXTRA_DIR, filename), bytes);
    return {
        file: filename,
        imagePath: `/static/uploads/recipes/extra/${filename}`,
        bytes: bytes.length,
        contentType,
        sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName).replace(/%20/g, "_")}`,
        downloadUrl: url
    };
}

(async () => {
    await fs.mkdir(EXTRA_DIR, { recursive: true });
    const manifest = await loadManifest();

    for (const [title, fileName] of Object.entries(fixes)) {
        const [rows] = await db.execute("SELECT recipeid, title, slug FROM recipes WHERE title=? LIMIT 1", [title]);
        const recipe = rows[0];
        if (!recipe) continue;

        try {
            const downloaded = await downloadCommons(fileName, recipe.slug);
            await db.execute("UPDATE recipes SET image=? WHERE recipeid=?", [downloaded.imagePath, recipe.recipeid]);
            const record = {
                type: "recipe-main",
                recipeid: recipe.recipeid,
                recipeTitle: recipe.title,
                query: fileName,
                sourceTitle: `File:${fileName}`,
                creator: null,
                creatorUrl: null,
                license: "Wikimedia Commons",
                licenseVersion: null,
                licenseUrl: null,
                provider: "wikimedia",
                source: "wikimedia",
                ...downloaded
            };
            const idx = manifest.findIndex(item => item.type === "recipe-main" && item.recipeid === recipe.recipeid);
            if (idx >= 0) manifest[idx] = record;
            else manifest.push(record);
            console.log(`Düzeltildi: ${title} <- ${fileName}`);
        } catch (err) {
            console.log(`Atlandı: ${title} (${err.message})`);
        }
    }

    await fs.writeFile(SOURCE_FILE, JSON.stringify(manifest, null, 2), "utf8");
})()
    .catch(err => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(async () => {
        try { await db.end(); } catch (_) { /* yut */ }
    });
