// Wikimedia'ın önerdiği thumbnail yönlendirmesini kullanarak kalan kart görsellerini düzeltir.
const fs = require("fs/promises");
const path = require("path");
const db = require("./model/db.js");

const EXTRA_DIR = path.join(__dirname, "public", "uploads", "recipes", "extra");
const SOURCE_FILE = path.join(__dirname, "public", "uploads", "recipes", "recipe-image-sources.json");
const USER_AGENT = "YemekTarifSitesi/1.0 thumbnail image fix";

const fixes = {
    "Izgara Köfte": "Ödemiş Köftesi.jpg",
    "Kuru Fasulye": "Kuru Fasulye pilav.jpg",
    "Sebzeli Makarna": "Vegetable pasta.jpg",
    "Gavurdağı Salatası": "Gavurdağı salad with lor cheese.jpg",
    "Patates Salatası": "Potato salad 001.jpg",
    "Roka Salatası": "Melon and Arugula Salad in Parmesan Bowl, Casperia (6078743006).jpg",
    "Magnolia": "Classic Banana Pudding.jpg"
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function extFor(contentType) {
    const type = (contentType || "").split(";")[0].toLowerCase();
    if (type === "image/png") return ".png";
    if (type === "image/webp") return ".webp";
    return ".jpg";
}

async function loadManifest() {
    try {
        return JSON.parse(await fs.readFile(SOURCE_FILE, "utf8"));
    } catch (_) {
        return [];
    }
}

(async () => {
    const manifest = await loadManifest();

    for (const [title, fileName] of Object.entries(fixes)) {
        const [rows] = await db.execute("SELECT recipeid, slug FROM recipes WHERE title=? LIMIT 1", [title]);
        const recipe = rows[0];
        if (!recipe) continue;

        const url = `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(fileName)}&width=900`;
        const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
        if (!res.ok) {
            console.log(`Atlandı: ${title} (${res.status})`);
            await sleep(1500);
            continue;
        }

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.toLowerCase().startsWith("image/")) {
            console.log(`Atlandı: ${title} (${contentType})`);
            await sleep(1500);
            continue;
        }

        const bytes = Buffer.from(await res.arrayBuffer());
        const filename = `${recipe.slug}-main${extFor(contentType)}`;
        await fs.writeFile(path.join(EXTRA_DIR, filename), bytes);
        const imagePath = `/static/uploads/recipes/extra/${filename}`;
        await db.execute("UPDATE recipes SET image=? WHERE recipeid=?", [imagePath, recipe.recipeid]);

        const record = {
            type: "recipe-main",
            recipeid: recipe.recipeid,
            recipeTitle: title,
            query: fileName,
            sourceTitle: `File:${fileName}`,
            sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName).replace(/%20/g, "_")}`,
            downloadUrl: url,
            creator: null,
            creatorUrl: null,
            license: "Wikimedia Commons",
            licenseVersion: null,
            licenseUrl: null,
            provider: "wikimedia",
            source: "wikimedia",
            file: filename,
            imagePath,
            bytes: bytes.length,
            contentType
        };
        const idx = manifest.findIndex(item => item.type === "recipe-main" && item.recipeid === recipe.recipeid);
        if (idx >= 0) manifest[idx] = record;
        else manifest.push(record);
        console.log(`Düzeltildi: ${title} <- ${fileName}`);
        await sleep(1500);
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
