// Ders notu için tutulan eski in-memory tarif verisi.
// Aktif JSON API, veriyi MySQL'den model/db.js üzerinden okur.

const categories = [
    { categoryid: 1, name: "Kahvaltılık", slug: "kahvaltilik" },
    { categoryid: 2, name: "Çorbalar", slug: "corbalar" },
    { categoryid: 3, name: "Ana Yemekler", slug: "ana-yemekler" },
    { categoryid: 4, name: "Salatalar", slug: "salatalar" },
    { categoryid: 5, name: "Tatlılar", slug: "tatlilar" }
];

const ingredients = [
    { ingredientid: 1, name: "Un" },
    { ingredientid: 2, name: "Şeker" },
    { ingredientid: 3, name: "Tuz" },
    { ingredientid: 4, name: "Yumurta" },
    { ingredientid: 5, name: "Süt" },
    { ingredientid: 6, name: "Tereyağı" },
    { ingredientid: 7, name: "Zeytinyağı" },
    { ingredientid: 8, name: "Soğan" },
    { ingredientid: 9, name: "Sarımsak" },
    { ingredientid: 10, name: "Domates" },
    { ingredientid: 11, name: "Biber" },
    { ingredientid: 12, name: "Patates" },
    { ingredientid: 13, name: "Havuç" },
    { ingredientid: 14, name: "Mercimek" },
    { ingredientid: 15, name: "Pirinç" },
    { ingredientid: 16, name: "Tavuk" },
    { ingredientid: 17, name: "Kıyma" },
    { ingredientid: 18, name: "Maydanoz" },
    { ingredientid: 19, name: "Limon" },
    { ingredientid: 20, name: "Karabiber" }
];

const recipes = [
    {
        recipeid: 1,
        title: "Mercimek Çorbası",
        slug: "mercimek-corbasi",
        exp: "Klasik Türk mutfağının vazgeçilmezi, sıcacık bir çorba.",
        instructions: "Mercimeği yıkayın. Soğanı kavurun, mercimeği ekleyin, su koyun. 30 dk pişirin. Blenderdan geçirin. Tuz ve karabiber ekleyin.",
        image: null,
        categoryid: 2,
        userid: 2
    },
    {
        recipeid: 2,
        title: "Menemen",
        slug: "menemen",
        exp: "Domates, biber ve yumurtanın eşsiz buluşması.",
        instructions: "Biberleri zeytinyağında soteleyin. Domatesleri ekleyin. Yumurtayı kırın, karıştırarak pişirin. Tuz serpip servis edin.",
        image: null,
        categoryid: 1,
        userid: 2
    },
    {
        recipeid: 3,
        title: "Tavuk Sote",
        slug: "tavuk-sote",
        exp: "Sebzeli, pratik bir ana yemek.",
        instructions: "Tavuğu kuşbaşı doğrayın. Sote tavada zeytinyağı ile pişirin. Biber, domates, soğan ekleyin. Tuz ve karabiber ile tatlandırın.",
        image: null,
        categoryid: 3,
        userid: 2
    },
    {
        recipeid: 4,
        title: "Sütlaç",
        slug: "sutlac",
        exp: "Geleneksel pirinçli tatlı.",
        instructions: "Pirinci az suda haşlayın. Sütü ekleyin, kaynayınca şekeri katın. Karıştırarak koyulaştırın. Kaselere paylaştırıp soğutun.",
        image: null,
        categoryid: 5,
        userid: 2
    },
    {
        recipeid: 5,
        title: "Çoban Salatası",
        slug: "coban-salatasi",
        exp: "Yaz sofralarının taze klasiği.",
        instructions: "Tüm sebzeleri küp doğrayın. Maydanozu kıyın. Zeytinyağı, limon, tuz ile karıştırın.",
        image: null,
        categoryid: 4,
        userid: 2
    }
];

const recipeIngredients = [
    { recipeid: 1, ingredientid: 14, amount: "1 su bardağı" },
    { recipeid: 1, ingredientid: 8, amount: "1 adet" },
    { recipeid: 1, ingredientid: 3, amount: "1 tatlı kaşığı" },
    { recipeid: 1, ingredientid: 20, amount: "yarım çay kaşığı" },
    { recipeid: 1, ingredientid: 6, amount: "1 yemek kaşığı" },
    { recipeid: 2, ingredientid: 10, amount: "3 adet" },
    { recipeid: 2, ingredientid: 11, amount: "2 adet" },
    { recipeid: 2, ingredientid: 4, amount: "3 adet" },
    { recipeid: 2, ingredientid: 7, amount: "2 yemek kaşığı" },
    { recipeid: 2, ingredientid: 3, amount: "yarım çay kaşığı" },
    { recipeid: 3, ingredientid: 16, amount: "500 g" },
    { recipeid: 3, ingredientid: 8, amount: "1 adet" },
    { recipeid: 3, ingredientid: 10, amount: "2 adet" },
    { recipeid: 3, ingredientid: 11, amount: "2 adet" },
    { recipeid: 3, ingredientid: 9, amount: "3 diş" },
    { recipeid: 3, ingredientid: 20, amount: "yarım çay kaşığı" },
    { recipeid: 4, ingredientid: 5, amount: "1 litre" },
    { recipeid: 4, ingredientid: 15, amount: "yarım su bardağı" },
    { recipeid: 4, ingredientid: 2, amount: "1 su bardağı" },
    { recipeid: 5, ingredientid: 10, amount: "3 adet" },
    { recipeid: 5, ingredientid: 11, amount: "2 adet" },
    { recipeid: 5, ingredientid: 8, amount: "1 adet" },
    { recipeid: 5, ingredientid: 18, amount: "1 demet" },
    { recipeid: 5, ingredientid: 19, amount: "1 adet" },
    { recipeid: 5, ingredientid: 7, amount: "2 yemek kaşığı" },
    { recipeid: 5, ingredientid: 3, amount: "1 çay kaşığı" }
];

const likes = [
    { userid: 3, recipeid: 1 },
    { userid: 3, recipeid: 2 }
];

const saves = [
    { userid: 3, recipeid: 1 }
];

const comments = [
    { commentid: 1, recipeid: 1, userid: 3, body: "Çok pratik ve lezzetli oldu." }
];

const anc = [
    {
        noticeid: 1,
        title: "Haftanın menüsü yayında",
        exp: "Yeni tarifler ve günün menüsü ana sayfada listelenir.",
        isactive: 1,
        userid: 1
    }
];

const gallery = [];
const visitors = [];

module.exports = {
    categories,
    ingredients,
    recipes,
    recipeIngredients,
    likes,
    saves,
    comments,
    anc,
    gallery,
    visitors
};
