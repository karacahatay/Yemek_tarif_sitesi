// Commons API ile bulunan doğrudan upload URL'lerinden seçili kart görsellerini düzeltir.
const fs = require("fs/promises");
const path = require("path");
const db = require("./model/db.js");

const EXTRA_DIR = path.join(__dirname, "public", "uploads", "recipes", "extra");
const SOURCE_FILE = path.join(__dirname, "public", "uploads", "recipes", "recipe-image-sources.json");
const USER_AGENT = "YemekTarifSitesi/1.0 direct image fix";

const fixes = {
    "Pankek": {
        title: "File:Pancakes with fruit.jpg",
        url: "https://upload.wikimedia.org/wikipedia/commons/8/87/Pancakes_with_fruit.jpg"
    },
    "Izgara Köfte": {
        title: "File:Ödemiş Köftesi.jpg",
        url: "https://upload.wikimedia.org/wikipedia/commons/9/9e/%C3%96demi%C5%9F_K%C3%B6ftesi.jpg"
    },
    "Kuru Fasulye": {
        title: "File:Kuru Fasulye pilav.jpg",
        url: "https://upload.wikimedia.org/wikipedia/commons/3/35/Kuru_Fasulye_pilav.jpg"
    },
    "Sebzeli Makarna": {
        title: "File:Vegetable pasta.jpg",
        url: "https://upload.wikimedia.org/wikipedia/commons/3/36/Vegetable_pasta.jpg"
    },
    "Gavurdağı Salatası": {
        title: "File:Gavurdağı salad with lor cheese.jpg",
        url: "https://upload.wikimedia.org/wikipedia/commons/0/00/Gavurda%C4%9F%C4%B1_salad_with_lor_cheese.jpg"
    },
    "Patates Salatası": {
        title: "File:Potato salad 001.jpg",
        url: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Potato_salad_001.jpg"
    },
    "Roka Salatası": {
        title: "File:Melon and Arugula Salad in Parmesan Bowl, Casperia (6078743006).jpg",
        url: "https://upload.wikimedia.org/wikipedia/commons/6/6c/Melon_and_Arugula_Salad_in_Parmesan_Bowl%2C_Casperia_%286078743006%29.jpg"
    },
    "Magnolia": {
        title: "File:Classic Banana Pudding.jpg",
        url: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Classic_Banana_Pudding.jpg"
    }
};

function extFor(contentType, url) {
    const type = (contentType || "").split(";")[0].toLowerCase();
    if (type === "image/png") return ".png";
    if (type === "image/webp") return ".webp";
    if (url.toLowerCase().endsWith(".png")) return ".png";
    if (url.toLowerCase().endsWith(".webp")) return ".webp";
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

    for (const [title, fix] of Object.entries(fixes)) {
        const [rows] = await db.execute("SELECT recipeid, slug FROM recipes WHERE title=? LIMIT 1", [title]);
        const recipe = rows[0];
        if (!recipe) continue;

        const res = await fetch(fix.url, { headers: { "User-Agent": USER_AGENT } });
        if (!res.ok) {
            console.log(`Atlandı: ${title} (${res.status})`);
            continue;
        }
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.toLowerCase().startsWith("image/")) {
            console.log(`Atlandı: ${title} (${contentType})`);
            continue;
        }
        const bytes = Buffer.from(await res.arrayBuffer());
        const filename = `${recipe.slug}-main${extFor(contentType, fix.url)}`;
        await fs.writeFile(path.join(EXTRA_DIR, filename), bytes);
        const imagePath = `/static/uploads/recipes/extra/${filename}`;
        await db.execute("UPDATE recipes SET image=? WHERE recipeid=?", [imagePath, recipe.recipeid]);

        const record = {
            type: "recipe-main",
            recipeid: recipe.recipeid,
            recipeTitle: title,
            query: fix.title,
            sourceTitle: fix.title,
            sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(fix.title).replace(/%20/g, "_")}`,
            downloadUrl: fix.url,
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

        console.log(`Düzeltildi: ${title} <- ${fix.title}`);
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
