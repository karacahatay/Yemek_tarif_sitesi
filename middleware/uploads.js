// multer yapılandırması. Dosyalar public/uploads/<sub>/ altına kaydedilir.
// CLAUDE.md: "Image Gallery files live locally; uploads go through the admin panel only."
const multer = require("multer");
const path = require("path");
const fs = require("fs");

function makeStorage(sub) {
    const dest = path.join(__dirname, "..", "public", "uploads", sub);
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    return multer.diskStorage({
        destination: (req, file, cb) => cb(null, dest),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const base = path.basename(file.originalname, ext)
                .replace(/[^a-z0-9_-]/gi, "-")
                .toLowerCase()
                .substring(0, 40);
            const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, (base || "img") + "-" + unique + ext);
        }
    });
}

function imageFilter(req, file, cb) {
    const ok = /\.(jpe?g|png|webp|gif)$/i.test(file.originalname);
    if (!ok) return cb(new Error("Sadece resim dosyası yüklenebilir (jpg, png, webp, gif)."));
    cb(null, true);
}

const uploadRecipe = multer({
    storage: makeStorage("recipes"),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadGallery = multer({
    storage: makeStorage("gallery"),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { uploadRecipe, uploadGallery };
