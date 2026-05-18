-- food_web veritabanı şeması.
-- Kullanım:
--   mysql -u root -p < schema.sql
-- Test kullanıcıları için: npm install sonrası `node seed.js` çalıştır.
--
-- Bu dosya FAZ 1 (auth) içindir. Sonraki fazlarda tablo eklenecek.

CREATE DATABASE IF NOT EXISTS food_web
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE food_web;

-- ============================================================
-- users: tüm kullanıcılar (admin, chef, user)
-- CLAUDE.md sözleşmesi: password bcrypt hash olarak saklanır.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    userid    INT AUTO_INCREMENT PRIMARY KEY,
    email     VARCHAR(190) NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL,
    name      VARCHAR(100) NOT NULL,
    surname   VARCHAR(100) NOT NULL,
    role      ENUM('admin', 'chef', 'user') NOT NULL DEFAULT 'user',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- anc: duyuru/haber modülü (CLAUDE.md'de mevcut sözleşme)
-- userid: duyuruyu giren admin.
-- ============================================================
CREATE TABLE IF NOT EXISTS anc (
    noticeid  INT AUTO_INCREMENT PRIMARY KEY,
    title     VARCHAR(200) NOT NULL,
    exp       TEXT NOT NULL,
    isactive  TINYINT(1) NOT NULL DEFAULT 1,
    userid    INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- categories: tarif kategorileri (Kahvaltılık, Çorbalar, ...)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    categoryid INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    slug       VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ============================================================
-- ingredients: malzeme listesi (malzemeye göre arama için)
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredients (
    ingredientid INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ============================================================
-- recipes: tarif tablosu
-- userid: tarifi ekleyen şef.
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
    recipeid     INT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    slug         VARCHAR(220) NOT NULL UNIQUE,
    exp          TEXT NOT NULL,
    instructions TEXT NOT NULL,
    image        VARCHAR(255) DEFAULT NULL,
    servings     INT NOT NULL DEFAULT 4,
    prepMinutes  INT NOT NULL DEFAULT 15,
    cookMinutes  INT NOT NULL DEFAULT 30,
    categoryid   INT NOT NULL,
    userid       INT NOT NULL,
    createdAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryid) REFERENCES categories(categoryid) ON DELETE RESTRICT,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- recipe_ingredients: çoka-çok (tarif - malzeme)
-- ============================================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    recipeid     INT NOT NULL,
    ingredientid INT NOT NULL,
    amount       VARCHAR(50) DEFAULT NULL,
    PRIMARY KEY (recipeid, ingredientid),
    FOREIGN KEY (recipeid) REFERENCES recipes(recipeid) ON DELETE CASCADE,
    FOREIGN KEY (ingredientid) REFERENCES ingredients(ingredientid) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- recipe_steps: tarifin adım adım yapılışı + adım görseli
-- image alanı local /static/uploads/recipes/... yolu tutar.
-- ============================================================
CREATE TABLE IF NOT EXISTS recipe_steps (
    stepid    INT AUTO_INCREMENT PRIMARY KEY,
    recipeid  INT NOT NULL,
    stepOrder INT NOT NULL,
    body      TEXT NOT NULL,
    image     VARCHAR(255) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_recipe_step_order (recipeid, stepOrder),
    FOREIGN KEY (recipeid) REFERENCES recipes(recipeid) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- visitors: tekil IP kaydı (ziyaretçi sayacı için)
-- lastSeen her ziyarette güncellenir (ON DUPLICATE KEY UPDATE).
-- ============================================================
CREATE TABLE IF NOT EXISTS visitors (
    ip       VARCHAR(45) NOT NULL PRIMARY KEY,
    lastSeen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    visits   INT NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ============================================================
-- likes: kullanıcı x tarif (tekil)
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
    userid    INT NOT NULL,
    recipeid  INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userid, recipeid),
    FOREIGN KEY (userid)   REFERENCES users(userid)     ON DELETE CASCADE,
    FOREIGN KEY (recipeid) REFERENCES recipes(recipeid) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- saves: kayıt etme (favoriler)
-- ============================================================
CREATE TABLE IF NOT EXISTS saves (
    userid    INT NOT NULL,
    recipeid  INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userid, recipeid),
    FOREIGN KEY (userid)   REFERENCES users(userid)     ON DELETE CASCADE,
    FOREIGN KEY (recipeid) REFERENCES recipes(recipeid) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- comments: tarif yorumları
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
    commentid INT AUTO_INCREMENT PRIMARY KEY,
    recipeid  INT NOT NULL,
    userid    INT NOT NULL,
    body      TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipeid) REFERENCES recipes(recipeid) ON DELETE CASCADE,
    FOREIGN KEY (userid)   REFERENCES users(userid)     ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- gallery: resim galerisi (admin panelinden eklenir, local saklanır)
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery (
    galleryid INT AUTO_INCREMENT PRIMARY KEY,
    title     VARCHAR(200) NOT NULL,
    image     VARCHAR(255) NOT NULL,
    userid    INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
) ENGINE=InnoDB;
