// Tarif kartlarındaki ana görselleri daha doğrudan yemek fotoğrafı olacak şekilde yeniler.
const fs = require("fs/promises");
const path = require("path");
const db = require("./model/db.js");

const ROOT = __dirname;
const EXTRA_DIR = path.join(ROOT, "public", "uploads", "recipes", "extra");
const SOURCE_FILE = path.join(ROOT, "public", "uploads", "recipes", "recipe-image-sources.json");
const USER_AGENT = "YemekTarifSitesi/1.0 card image refresh";

const englishQueries = {
    "Mercimek Çorbası": ["Turkish lentil soup", "mercimek corbasi"],
    "Menemen": ["Turkish egg dish menemen", "menemen food"],
    "Tavuk Sote": ["chicken saute tomato", "chicken saute"],
    "Sütlaç": ["Turkish rice pudding sutlac", "sutlac"],
    "Çoban Salatası": ["coban salatasi shepherd salad", "Turkish shepherd salad"],
    "Peynirli Omlet": ["cheese omelette", "omelette with cheese"],
    "Sucuklu Yumurta": ["eggs with sausage", "sucuklu yumurta"],
    "Kaşarlı Tost": ["grilled cheese sandwich"],
    "Patatesli Yumurta": ["potato omelette", "eggs with potatoes"],
    "Pankek": ["pancakes breakfast"],
    "Yulaf Lapası": ["oatmeal bowl"],
    "Domatesli Biberli Yumurta": ["shakshuka eggs tomato pepper"],
    "Peynirli Poğaça": ["cheese pogaca", "cheese pastry"],
    "Avokadolu Yumurta": ["avocado egg toast"],
    "Zeytinli Açma": ["olive bread roll", "olive pastry"],
    "Ezogelin Çorbası": ["ezogelin soup"],
    "Yayla Çorbası": ["yayla soup", "Turkish yogurt soup"],
    "Domates Çorbası": ["tomato soup bowl"],
    "Mantar Çorbası": ["mushroom soup bowl"],
    "Tavuk Suyu Çorbası": ["chicken soup bowl"],
    "Sebze Çorbası": ["vegetable soup bowl"],
    "Tarhana Çorbası": ["tarhana soup"],
    "Kabak Çorbası": ["pumpkin soup bowl"],
    "Brokoli Çorbası": ["broccoli soup bowl"],
    "Şehriye Çorbası": ["noodle soup bowl"],
    "Izgara Köfte": ["grilled kofte", "turkish meatballs"],
    "Fırında Tavuk": ["roast chicken vegetables"],
    "Kuru Fasulye": ["white bean stew"],
    "Nohut Yemeği": ["chickpea stew"],
    "Karnıyarık": ["karniyarik eggplant"],
    "İmam Bayıldı": ["imam bayildi eggplant"],
    "Fırında Balık": ["baked fish lemon"],
    "Sebzeli Makarna": ["vegetable pasta"],
    "Kıymalı Patates": ["potato minced meat stew"],
    "Tavuklu Pilav": ["chicken rice pilaf"],
    "Gavurdağı Salatası": ["gavurdagi salad", "tomato walnut salad"],
    "Patates Salatası": ["potato salad"],
    "Yeşil Salata": ["green salad bowl"],
    "Nohut Salatası": ["chickpea salad"],
    "Makarna Salatası": ["pasta salad"],
    "Ton Balıklı Salata": ["tuna salad"],
    "Pancarlı Salata": ["beet salad"],
    "Roka Salatası": ["arugula salad"],
    "Bulgur Salatası": ["bulgur salad kisir"],
    "Kinoalı Salata": ["quinoa salad"],
    "Baklava": ["baklava dessert"],
    "Revani": ["revani semolina cake"],
    "Kazandibi": ["kazandibi dessert"],
    "İrmik Helvası": ["semolina halva"],
    "Aşure": ["ashure dessert"],
    "Tiramisu": ["tiramisu dessert"],
    "Cheesecake": ["cheesecake slice"],
    "Profiterol": ["profiterole dessert"],
    "Magnolia": ["magnolia pudding dessert"],
    "Keşkül": ["keskul almond pudding"]
};

const badWords = [
    "map", "location", "airline", "aircraft", "train", "station", "logo",
    "diagram", "svg", "building", "street", "market pantry", "wrap", "tortillas"
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function normalize(value) {
    return (value || "")
        .toString()
        .toLocaleLowerCase("tr-TR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ı/g, "i")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function titleTokens(title) {
    return normalize(title)
        .split(" ")
        .filter(token => token.length > 2 && !["tarifi", "yemegi", "corbasi", "salatasi"].includes(token));
}

function validImageUrl(url) {
    const clean = (url || "").split("?")[0].toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp"].some(ext => clean.endsWith(ext));
}

function extFor(contentType, url) {
    const type = (contentType || "").split(";")[0].toLowerCase();
    if (type === "image/png") return ".png";
    if (type === "image/webp") return ".webp";
    return ".jpg";
}

function scoreItem(item, recipeTitle, queries) {
    if (!validImageUrl(item.url)) return -100;
    const text = normalize(`${item.title} ${item.url}`);
    if (badWords.some(word => text.includes(normalize(word)))) return -50;

    let score = 0;
    for (const token of titleTokens(recipeTitle)) {
        if (text.includes(token)) score += 5;
    }
    for (const query of queries) {
        for (const token of titleTokens(query)) {
            if (text.includes(token)) score += 2;
        }
    }
    if ((item.width || 0) >= 700 && (item.height || 0) >= 500) score += 4;
    if (item.provider === "wikimedia" || item.source === "wikimedia") score += 2;
    if (item.provider === "flickr" || item.source === "flickr") score += 1;
    if (normalize(item.title).includes(normalize(recipeTitle))) score += 8;
    return score;
}

async function search(query) {
    const url = new URL("https://api.openverse.org/v1/images/");
    url.search = new URLSearchParams({
        format: "json",
        q: query,
        page_size: "20",
        mature: "false"
    });

    for (let attempt = 1; attempt <= 4; attempt++) {
        const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
        if (res.ok) {
            const json = await res.json();
            await sleep(3200);
            return json.results || [];
        }
        if ((res.status === 401 || res.status === 429) && attempt < 4) {
            await sleep(attempt * 10000);
            continue;
        }
        return [];
    }
    return [];
}

async function download(item, slug) {
    const res = await fetch(item.url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) throw new Error(contentType);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 10000) throw new Error("dosya küçük");
    const filename = `${slug}-main${extFor(contentType, item.url)}`;
    await fs.writeFile(path.join(EXTRA_DIR, filename), bytes);
    return {
        file: filename,
        imagePath: `/static/uploads/recipes/extra/${filename}`,
        bytes: bytes.length,
        contentType
    };
}

async function loadManifest() {
    try {
        return JSON.parse(await fs.readFile(SOURCE_FILE, "utf8"));
    } catch (_) {
        return [];
    }
}

(async () => {
    await fs.mkdir(EXTRA_DIR, { recursive: true });
    const manifest = (await loadManifest()).filter(item => item.type !== "step");
    const [recipes] = await db.execute("SELECT recipeid, title, slug, image FROM recipes ORDER BY recipeid ASC");

    for (const recipe of recipes) {
        const queries = [
            recipe.title,
            `${recipe.title} tarifi`,
            ...(englishQueries[recipe.title] || []),
            `${recipe.title} food`
        ];
        const candidates = [];
        for (const query of queries) {
            const rows = await search(query);
            for (const row of rows) {
                candidates.push({ ...row, matchedQuery: query });
            }
        }
        candidates.sort((a, b) => scoreItem(b, recipe.title, queries) - scoreItem(a, recipe.title, queries));
        const best = candidates.find(item => scoreItem(item, recipe.title, queries) >= 6);

        if (!best) {
            console.log(`Korundu: ${recipe.title}`);
            continue;
        }

        try {
            const downloaded = await download(best, recipe.slug);
            await db.execute("UPDATE recipes SET image=? WHERE recipeid=?", [downloaded.imagePath, recipe.recipeid]);
            const sourceRecord = {
                type: "recipe-main",
                recipeid: recipe.recipeid,
                recipeTitle: recipe.title,
                query: best.matchedQuery,
                sourceTitle: best.title || null,
                sourceUrl: best.foreign_landing_url || best.url,
                downloadUrl: best.url,
                creator: best.creator || null,
                creatorUrl: best.creator_url || null,
                license: best.license || null,
                licenseVersion: best.license_version || null,
                licenseUrl: best.license_url || null,
                provider: best.provider || null,
                source: best.source || null,
                ...downloaded
            };
            const idx = manifest.findIndex(item => item.type === "recipe-main" && item.recipeid === recipe.recipeid);
            if (idx >= 0) manifest[idx] = sourceRecord;
            else manifest.push(sourceRecord);
            console.log(`Yenilendi: ${recipe.title} <- ${best.title}`);
        } catch (err) {
            console.log(`Korundu: ${recipe.title} (${err.message})`);
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
