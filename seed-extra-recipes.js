// Ek tarif verisi yükler.
// Yemek.com tarzı adım adım anlatımı referans alır; metin ve görseller özgün/açık kaynaklıdır.
const fs = require("fs/promises");
const path = require("path");
const slugify = require("slugify");
const db = require("./model/db.js");

const ROOT = __dirname;
const RECIPE_DIR = path.join(ROOT, "public", "uploads", "recipes");
const EXTRA_DIR = path.join(RECIPE_DIR, "extra");
const STEP_DIR = path.join(RECIPE_DIR, "steps");
const SOURCE_FILE = path.join(RECIPE_DIR, "recipe-image-sources.json");
const USER_AGENT = "YemekTarifSitesi/1.0 extra recipe import";

const tr = (s) => slugify(s, { lower: true, strict: true, locale: "tr" });
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const stepImages = {
    prep: "chopping vegetables cutting board",
    pan: "cooking in pan food",
    pot: "soup pot cooking",
    mix: "mixing bowl dessert",
    oven: "baking tray oven food",
    salad: "fresh salad preparation",
    serve: "food plating serving"
};

const categoryImageFallback = {
    "Kahvaltılık": "breakfast food",
    "Çorbalar": "soup bowl",
    "Ana Yemekler": "main course food",
    "Salatalar": "salad bowl",
    "Tatlılar": "dessert plate"
};

const existingEnhancements = [
    {
        title: "Mercimek Çorbası",
        imageQuery: "Turkish lentil soup",
        stepKind: ["prep", "pot", "serve"],
        steps: [
            "Mercimeği yıkayıp süzün; soğanı küçük doğrayın ve tencereye alın.",
            "Tereyağıyla soğanı kavurun, mercimek ve sıcak suyu ekleyip yumuşayana kadar pişirin.",
            "Çorbayı blenderdan geçirip tuz ve karabiberle kıvamını ayarlayın."
        ]
    },
    {
        title: "Menemen",
        imageQuery: "Turkish egg dish menemen",
        stepKind: ["prep", "pan", "serve"],
        steps: [
            "Biber ve domatesleri doğrayın; yumurtaları ayrı bir kasede hafifçe çırpın.",
            "Biberleri zeytinyağında soteleyin, domatesleri ekleyip suyunu hafif çekene kadar pişirin.",
            "Yumurtayı ekleyip istediğiniz kıvamda pişirin ve sıcak servis edin."
        ]
    },
    {
        title: "Tavuk Sote",
        imageQuery: "chicken saute tomato sauce",
        stepKind: ["prep", "pan", "serve"],
        steps: [
            "Tavukları kuşbaşı, sebzeleri yemeklik doğrayın.",
            "Tavuğu yüksek ateşte mühürleyin; soğan, biber, sarımsak ve domatesi ekleyin.",
            "Baharatlarla tatlandırıp sebzeler yumuşayınca sıcak servis edin."
        ]
    },
    {
        title: "Sütlaç",
        imageQuery: "Turkish rice pudding sutlac",
        stepKind: ["mix", "pot", "serve"],
        steps: [
            "Pirinci yıkayıp az suyla yumuşayana kadar haşlayın.",
            "Süt ve şekeri ekleyin; kısık ateşte karıştırarak koyulaştırın.",
            "Kaselere paylaştırıp oda sıcaklığına gelince buzdolabında dinlendirin."
        ]
    },
    {
        title: "Çoban Salatası",
        imageQuery: "Turkish shepherd salad",
        stepKind: ["salad", "prep", "serve"],
        steps: [
            "Domates, salatalık, biber ve soğanı küçük küpler halinde doğrayın.",
            "Maydanozu ince kıyın; limon suyu, zeytinyağı ve tuzla sos hazırlayın.",
            "Tüm malzemeleri sosla karıştırıp bekletmeden servis edin."
        ]
    }
];

const extraRecipes = [
    {
        category: "Kahvaltılık",
        title: "Peynirli Omlet",
        imageQuery: "cheese omelette breakfast",
        exp: "Yumuşak dokulu, bol peynirli pratik kahvaltı tarifi.",
        ingredients: [["Yumurta", "3 adet"], ["Peynir", "1 çay bardağı"], ["Tereyağı", "1 tatlı kaşığı"], ["Tuz", "1 tutam"]],
        steps: ["Yumurtaları tuzla çırpın ve peyniri küçük parçalar halinde hazırlayın.", "Tereyağını tavada eritin, yumurtayı döküp kısık ateşte pişirin.", "Peyniri ekleyip omleti katlayın ve sıcak servis edin."]
    },
    {
        category: "Kahvaltılık",
        title: "Sucuklu Yumurta",
        imageQuery: "eggs with sausage breakfast",
        exp: "Baharatlı sucuk ve yumurtanın klasik kahvaltı uyumu.",
        ingredients: [["Yumurta", "3 adet"], ["Sucuk", "10 dilim"], ["Tereyağı", "1 tatlı kaşığı"], ["Karabiber", "1 tutam"]],
        steps: ["Sucuğu ince dilimleyin ve yumurtaları ayrı bir kasede hazırlayın.", "Sucukları tereyağında hafif kızartın, yumurtaları tavaya kırın.", "Akları pişince karabiber serpip sıcak servis edin."]
    },
    {
        category: "Kahvaltılık",
        title: "Kaşarlı Tost",
        imageQuery: "grilled cheese sandwich",
        exp: "Dışı çıtır, içi eriyen peynirli hızlı tost.",
        ingredients: [["Ekmek", "4 dilim"], ["Kaşar Peyniri", "6 dilim"], ["Tereyağı", "1 tatlı kaşığı"]],
        steps: ["Ekmeklerin arasına kaşar peynirini yerleştirin.", "Tost makinesini ısıtıp ekmeklerin dışına çok az tereyağı sürün.", "Peynir eriyip ekmek kızarana kadar pişirin."]
    },
    {
        category: "Kahvaltılık",
        title: "Patatesli Yumurta",
        imageQuery: "potato omelette",
        exp: "Kızarmış patatesle doyurucu kahvaltılık yumurta.",
        ingredients: [["Patates", "2 adet"], ["Yumurta", "3 adet"], ["Zeytinyağı", "2 yemek kaşığı"], ["Tuz", "1 çay kaşığı"]],
        steps: ["Patatesleri küçük küp doğrayıp nişastasını almak için yıkayın.", "Tavada zeytinyağıyla patatesleri kızartın.", "Çırpılmış yumurtayı ekleyip kısık ateşte pişirin."]
    },
    {
        category: "Kahvaltılık",
        title: "Pankek",
        imageQuery: "pancakes breakfast",
        exp: "Yumuşacık dokulu, kahvaltı sofralarına tatlı dokunuş.",
        ingredients: [["Un", "1 su bardağı"], ["Yumurta", "1 adet"], ["Süt", "1 su bardağı"], ["Şeker", "1 yemek kaşığı"]],
        steps: ["Un, yumurta, süt ve şekeri pürüzsüz kıvama gelene kadar çırpın.", "Isınmış tavaya küçük kepçelerle döküp iki yüzünü pişirin.", "Bal, meyve veya reçelle servis edin."]
    },
    {
        category: "Kahvaltılık",
        title: "Yulaf Lapası",
        imageQuery: "oatmeal bowl breakfast",
        exp: "Sütle pişen hafif ve besleyici sabah kasesi.",
        ingredients: [["Yulaf", "1 çay bardağı"], ["Süt", "1 su bardağı"], ["Bal", "1 tatlı kaşığı"], ["Muz", "1 adet"]],
        steps: ["Yulaf ve sütü küçük tencereye alın.", "Kısık ateşte karıştırarak koyulaşana kadar pişirin.", "Bal ve muz dilimleriyle servis edin."]
    },
    {
        category: "Kahvaltılık",
        title: "Domatesli Biberli Yumurta",
        imageQuery: "shakshuka eggs tomato pepper",
        exp: "Bol sebzeli, tavada kısa sürede hazırlanan yumurta.",
        ingredients: [["Yumurta", "3 adet"], ["Domates", "2 adet"], ["Biber", "2 adet"], ["Zeytinyağı", "2 yemek kaşığı"]],
        steps: ["Domates ve biberleri küçük doğrayın.", "Sebzeleri zeytinyağında soteleyip suyunu çektirin.", "Yumurtaları kırıp kapağı kapalı şekilde pişirin."]
    },
    {
        category: "Kahvaltılık",
        title: "Peynirli Poğaça",
        imageQuery: "cheese pastry pogaca",
        exp: "Çay saatine de yakışan yumuşak kahvaltılık poğaça.",
        ingredients: [["Un", "3 su bardağı"], ["Peynir", "1 su bardağı"], ["Süt", "1 çay bardağı"], ["Tereyağı", "2 yemek kaşığı"]],
        steps: ["Un, süt ve tereyağıyla yumuşak bir hamur hazırlayın.", "Hamuru küçük bezelere ayırıp içine peynir koyun.", "Üzeri kızarana kadar fırında pişirin."]
    },
    {
        category: "Kahvaltılık",
        title: "Avokadolu Yumurta",
        imageQuery: "avocado egg toast",
        exp: "Kremamsı avokado ve yumurtayla modern kahvaltı tabağı.",
        ingredients: [["Yumurta", "2 adet"], ["Avokado", "1 adet"], ["Ekmek", "2 dilim"], ["Limon", "yarım adet"]],
        steps: ["Avokadoyu limon ve tuzla ezip kremamsı hale getirin.", "Ekmekleri kızartın, yumurtaları istediğiniz kıvamda pişirin.", "Avokadoyu ekmeğe sürüp yumurtayla servis edin."]
    },
    {
        category: "Kahvaltılık",
        title: "Zeytinli Açma",
        imageQuery: "bread roll olives breakfast",
        exp: "Zeytinli iç harcıyla yumuşak ve doyurucu açma.",
        ingredients: [["Un", "4 su bardağı"], ["Süt", "1 su bardağı"], ["Zeytin", "1 çay bardağı"], ["Tereyağı", "2 yemek kaşığı"]],
        steps: ["Un ve sütle ele yapışmayan yumuşak bir hamur yoğurun.", "Hamuru açıp zeytinli harçla rulo yapın.", "Tepside mayalandırıp kızarana kadar pişirin."]
    },

    {
        category: "Çorbalar",
        title: "Ezogelin Çorbası",
        imageQuery: "ezogelin soup",
        exp: "Mercimek, pirinç ve bulgurla kıvamlı geleneksel çorba.",
        ingredients: [["Mercimek", "1 su bardağı"], ["Pirinç", "2 yemek kaşığı"], ["Bulgur", "2 yemek kaşığı"], ["Soğan", "1 adet"]],
        steps: ["Bakliyatları yıkayın, soğanı küçük doğrayın.", "Soğanı kavurup bakliyat ve sıcak suyu ekleyin.", "Yumuşayınca baharatlandırıp sıcak servis edin."]
    },
    {
        category: "Çorbalar",
        title: "Yayla Çorbası",
        imageQuery: "Turkish yogurt soup yayla",
        exp: "Yoğurtlu, naneli ve ferah içimli klasik çorba.",
        ingredients: [["Yoğurt", "1 su bardağı"], ["Pirinç", "3 yemek kaşığı"], ["Yumurta", "1 adet"], ["Tereyağı", "1 yemek kaşığı"]],
        steps: ["Pirinci suda yumuşayana kadar haşlayın.", "Yoğurt ve yumurtayı çırpıp tencereye ılıtarak ekleyin.", "Tereyağında nane yakıp çorbanın üzerine gezdirin."]
    },
    {
        category: "Çorbalar",
        title: "Domates Çorbası",
        imageQuery: "tomato soup bowl",
        exp: "Domatesin canlı lezzetiyle pratik ve pürüzsüz çorba.",
        ingredients: [["Domates", "5 adet"], ["Un", "1 yemek kaşığı"], ["Tereyağı", "1 yemek kaşığı"], ["Süt", "1 çay bardağı"]],
        steps: ["Domatesleri rendeleyin ve unu tereyağında kavurun.", "Domatesleri ekleyip birkaç dakika pişirin.", "Sütle kıvam verip blenderdan geçirin."]
    },
    {
        category: "Çorbalar",
        title: "Mantar Çorbası",
        imageQuery: "mushroom soup",
        exp: "Kremamsı dokulu, mantar aroması güçlü bir başlangıç.",
        ingredients: [["Mantar", "300 g"], ["Süt", "1 su bardağı"], ["Un", "1 yemek kaşığı"], ["Tereyağı", "1 yemek kaşığı"]],
        steps: ["Mantarları ince doğrayın ve tereyağında suyunu çekene kadar soteleyin.", "Unu ekleyip kokusu çıkana kadar kavurun.", "Süt ve sıcak suyla kıvamlandırıp pişirin."]
    },
    {
        category: "Çorbalar",
        title: "Tavuk Suyu Çorbası",
        imageQuery: "chicken soup bowl",
        exp: "Şifalı, hafif ve ev yapımı tavuk suyu çorbası.",
        ingredients: [["Tavuk", "1 parça"], ["Havuç", "1 adet"], ["Tel Şehriye", "1 çay bardağı"], ["Limon", "yarım adet"]],
        steps: ["Tavuğu havuçla birlikte haşlayıp suyunu süzün.", "Tavuk suyuna şehriyeyi ekleyip yumuşayana kadar pişirin.", "Didiklenmiş tavuk ve limonla servis edin."]
    },
    {
        category: "Çorbalar",
        title: "Sebze Çorbası",
        imageQuery: "vegetable soup",
        exp: "Bol sebzeli, hafif ve günlük sofraya uygun çorba.",
        ingredients: [["Patates", "1 adet"], ["Havuç", "1 adet"], ["Soğan", "1 adet"], ["Zeytinyağı", "2 yemek kaşığı"]],
        steps: ["Sebzeleri küçük doğrayın.", "Soğanı zeytinyağında kavurup sebzeleri ekleyin.", "Sıcak suyla pişirip blenderdan geçirin."]
    },
    {
        category: "Çorbalar",
        title: "Tarhana Çorbası",
        imageQuery: "tarhana soup",
        exp: "Ekşi aromasıyla Anadolu mutfağından sıcak bir kase.",
        ingredients: [["Tarhana", "3 yemek kaşığı"], ["Tereyağı", "1 yemek kaşığı"], ["Sarımsak", "1 diş"], ["Tuz", "1 çay kaşığı"]],
        steps: ["Tarhanayı bir bardak suyla açın.", "Tereyağında sarımsağı kısa süre çevirin.", "Tarhanayı ekleyip karıştırarak koyulaşana kadar pişirin."]
    },
    {
        category: "Çorbalar",
        title: "Kabak Çorbası",
        imageQuery: "pumpkin soup bowl",
        exp: "Kadifemsi kıvamlı, hafif tatlı aromalı çorba.",
        ingredients: [["Kabak", "500 g"], ["Soğan", "1 adet"], ["Havuç", "1 adet"], ["Süt", "1 çay bardağı"]],
        steps: ["Kabak, soğan ve havucu doğrayın.", "Sebzeleri az yağla çevirip sıcak su ekleyin.", "Yumuşayınca süt ekleyip blenderdan geçirin."]
    },
    {
        category: "Çorbalar",
        title: "Brokoli Çorbası",
        imageQuery: "broccoli soup",
        exp: "Yeşil sebze lezzetini kremamsı kıvamla buluşturan çorba.",
        ingredients: [["Brokoli", "400 g"], ["Patates", "1 adet"], ["Süt", "1 su bardağı"], ["Tereyağı", "1 yemek kaşığı"]],
        steps: ["Brokoli ve patatesi iri doğrayın.", "Sebzeleri yumuşayana kadar haşlayın.", "Süt ve tereyağıyla blenderdan geçirip servis edin."]
    },
    {
        category: "Çorbalar",
        title: "Şehriye Çorbası",
        imageQuery: "noodle soup tomato",
        exp: "Domatesli, pratik ve çocukların da sevdiği çorba.",
        ingredients: [["Tel Şehriye", "1 çay bardağı"], ["Domates", "2 adet"], ["Tereyağı", "1 yemek kaşığı"], ["Limon", "yarım adet"]],
        steps: ["Domatesi rendeleyip tereyağında kavurun.", "Sıcak su ve şehriyeyi ekleyip yumuşayana kadar pişirin.", "Limonla sıcak servis edin."]
    },

    {
        category: "Ana Yemekler",
        title: "Izgara Köfte",
        imageQuery: "grilled kofte",
        exp: "Baharatlı köfte harcıyla dışı kızarmış, içi sulu ana yemek.",
        ingredients: [["Kıyma", "500 g"], ["Soğan", "1 adet"], ["Maydanoz", "yarım demet"], ["Karabiber", "1 çay kaşığı"]],
        steps: ["Kıyma, rendelenmiş soğan, maydanoz ve baharatları yoğurun.", "Harçtan parçalar koparıp köfte şekli verin.", "Izgara veya tavada iki yüzünü kızartıp servis edin."]
    },
    {
        category: "Ana Yemekler",
        title: "Fırında Tavuk",
        imageQuery: "roast chicken vegetables",
        exp: "Sebzelerle aynı tepside pişen pratik tavuk yemeği.",
        ingredients: [["Tavuk", "800 g"], ["Patates", "3 adet"], ["Havuç", "2 adet"], ["Zeytinyağı", "3 yemek kaşığı"]],
        steps: ["Tavuk ve sebzeleri iri doğrayıp tepsiye alın.", "Zeytinyağı, tuz ve baharatlarla harmanlayın.", "Fırında tavuk kızarana kadar pişirin."]
    },
    {
        category: "Ana Yemekler",
        title: "Kuru Fasulye",
        imageQuery: "white bean stew",
        exp: "Pilavla çok yakışan, kıvamlı ve doyurucu bakliyat yemeği.",
        ingredients: [["Kuru Fasulye", "2 su bardağı"], ["Soğan", "1 adet"], ["Domates", "2 adet"], ["Zeytinyağı", "2 yemek kaşığı"]],
        steps: ["Fasulyeyi bir gece önceden ıslatıp haşlayın.", "Soğan ve domatesi kavurup fasulyeyi ekleyin.", "Sıcak suyla kısık ateşte kıvam alana kadar pişirin."]
    },
    {
        category: "Ana Yemekler",
        title: "Nohut Yemeği",
        imageQuery: "chickpea stew",
        exp: "Sade malzemelerle hazırlanan klasik tencere yemeği.",
        ingredients: [["Nohut", "2 su bardağı"], ["Soğan", "1 adet"], ["Domates", "1 adet"], ["Zeytinyağı", "2 yemek kaşığı"]],
        steps: ["Nohudu önceden ıslatıp yumuşayana kadar haşlayın.", "Soğan ve domatesi kavurup nohudu ekleyin.", "Sıcak suyla kısık ateşte pişirip servis edin."]
    },
    {
        category: "Ana Yemekler",
        title: "Karnıyarık",
        imageQuery: "karniyarik Turkish eggplant",
        exp: "Patlıcan, kıyma ve domatesle hazırlanan fırın klasiği.",
        ingredients: [["Patlıcan", "4 adet"], ["Kıyma", "300 g"], ["Soğan", "1 adet"], ["Domates", "2 adet"]],
        steps: ["Patlıcanları közleyin veya kızartıp ortasını açın.", "Kıyma, soğan ve domatesle iç harcı pişirin.", "Patlıcanları doldurup fırında sosuyla pişirin."]
    },
    {
        category: "Ana Yemekler",
        title: "İmam Bayıldı",
        imageQuery: "imam bayildi eggplant",
        exp: "Zeytinyağlı patlıcanın soğanlı domatesli hafif yorumu.",
        ingredients: [["Patlıcan", "4 adet"], ["Soğan", "2 adet"], ["Domates", "2 adet"], ["Zeytinyağı", "4 yemek kaşığı"]],
        steps: ["Patlıcanları alacalı soyup yumuşayana kadar pişirin.", "Soğan ve domatesle zeytinyağlı iç hazırlayın.", "Patlıcanları doldurup kısık ateşte dinlendirerek pişirin."]
    },
    {
        category: "Ana Yemekler",
        title: "Fırında Balık",
        imageQuery: "baked fish lemon",
        exp: "Limon ve sebzelerle hafif, kokusu dengeli balık tarifi.",
        ingredients: [["Balık", "2 adet"], ["Limon", "1 adet"], ["Soğan", "1 adet"], ["Zeytinyağı", "2 yemek kaşığı"]],
        steps: ["Balıkları temizleyip fırın kabına alın.", "Limon, soğan ve zeytinyağıyla lezzetlendirin.", "Fırında balık eti kolay ayrılana kadar pişirin."]
    },
    {
        category: "Ana Yemekler",
        title: "Sebzeli Makarna",
        imageQuery: "vegetable pasta",
        exp: "Renkli sebzelerle kısa sürede hazırlanan doyurucu tabak.",
        ingredients: [["Makarna", "1 paket"], ["Domates", "2 adet"], ["Biber", "2 adet"], ["Zeytinyağı", "3 yemek kaşığı"]],
        steps: ["Makarnayı tuzlu suda haşlayın.", "Sebzeleri zeytinyağında soteleyin.", "Makarnayı sebzelerle harmanlayıp servis edin."]
    },
    {
        category: "Ana Yemekler",
        title: "Kıymalı Patates",
        imageQuery: "potato minced meat stew",
        exp: "Ekonomik, bereketli ve çocukların da sevdiği tencere yemeği.",
        ingredients: [["Patates", "4 adet"], ["Kıyma", "250 g"], ["Soğan", "1 adet"], ["Domates", "1 adet"]],
        steps: ["Soğan ve kıymayı tencerede kavurun.", "Patates ve domatesi ekleyip birkaç dakika çevirin.", "Sıcak suyla patatesler yumuşayana kadar pişirin."]
    },
    {
        category: "Ana Yemekler",
        title: "Tavuklu Pilav",
        imageQuery: "chicken rice pilaf",
        exp: "Tane tane pilav ve didiklenmiş tavukla doyurucu öğün.",
        ingredients: [["Pirinç", "2 su bardağı"], ["Tavuk", "1 parça"], ["Tereyağı", "1 yemek kaşığı"], ["Tuz", "1 çay kaşığı"]],
        steps: ["Tavuğu haşlayıp suyunu ayırın ve eti didikleyin.", "Pirinci tereyağında kavurup tavuk suyuyla pişirin.", "Pilav dinlenince tavukla birlikte servis edin."]
    },

    {
        category: "Salatalar",
        title: "Gavurdağı Salatası",
        imageQuery: "gavurdagi salad",
        exp: "İnce doğranmış sebzeler ve cevizle bol aromalı salata.",
        ingredients: [["Domates", "3 adet"], ["Soğan", "1 adet"], ["Ceviz", "1 çay bardağı"], ["Limon", "1 adet"]],
        steps: ["Sebzeleri olabildiğince küçük doğrayın.", "Cevizi iri kırıp salataya ekleyin.", "Limon ve zeytinyağıyla harmanlayıp servis edin."]
    },
    {
        category: "Salatalar",
        title: "Patates Salatası",
        imageQuery: "potato salad",
        exp: "Haşlanmış patates, yeşillik ve limonla doyurucu salata.",
        ingredients: [["Patates", "4 adet"], ["Maydanoz", "yarım demet"], ["Soğan", "1 adet"], ["Limon", "1 adet"]],
        steps: ["Patatesleri haşlayıp küp doğrayın.", "Maydanoz ve soğanı ince kıyın.", "Limon, zeytinyağı ve tuzla karıştırın."]
    },
    {
        category: "Salatalar",
        title: "Yeşil Salata",
        imageQuery: "green salad",
        exp: "Taze yeşilliklerle her yemeğin yanına yakışan sade salata.",
        ingredients: [["Marul", "1 adet"], ["Salatalık", "2 adet"], ["Limon", "1 adet"], ["Zeytinyağı", "2 yemek kaşığı"]],
        steps: ["Yeşillikleri yıkayıp kurutun.", "Salatalığı doğrayıp geniş kaseye alın.", "Limonlu sosla harmanlayıp bekletmeden servis edin."]
    },
    {
        category: "Salatalar",
        title: "Nohut Salatası",
        imageQuery: "chickpea salad",
        exp: "Haşlanmış nohutla proteinli ve tok tutan salata.",
        ingredients: [["Nohut", "2 su bardağı"], ["Domates", "2 adet"], ["Maydanoz", "yarım demet"], ["Limon", "1 adet"]],
        steps: ["Nohudu haşlayıp süzün.", "Domates ve maydanozu doğrayın.", "Limonlu sosla tüm malzemeyi karıştırın."]
    },
    {
        category: "Salatalar",
        title: "Makarna Salatası",
        imageQuery: "pasta salad",
        exp: "Yoğurtlu sosla kalabalık sofralar için pratik salata.",
        ingredients: [["Makarna", "1 paket"], ["Yoğurt", "1 su bardağı"], ["Maydanoz", "yarım demet"], ["Havuç", "1 adet"]],
        steps: ["Makarnayı haşlayıp soğutun.", "Yoğurt ve doğranmış malzemeleri karıştırın.", "Makarnayla harmanlayıp soğuk servis edin."]
    },
    {
        category: "Salatalar",
        title: "Ton Balıklı Salata",
        imageQuery: "tuna salad",
        exp: "Hafif öğün isteyenler için pratik ve doyurucu salata.",
        ingredients: [["Ton Balığı", "1 kutu"], ["Marul", "1 adet"], ["Domates", "2 adet"], ["Limon", "1 adet"]],
        steps: ["Yeşillikleri doğrayıp servis tabağına alın.", "Ton balığını süzüp salatanın üzerine ekleyin.", "Limonlu sosla karıştırıp servis edin."]
    },
    {
        category: "Salatalar",
        title: "Pancarlı Salata",
        imageQuery: "beet salad",
        exp: "Canlı rengi ve ferah tadıyla sofraya renk katan salata.",
        ingredients: [["Pancar", "2 adet"], ["Yoğurt", "1 su bardağı"], ["Sarımsak", "1 diş"], ["Limon", "yarım adet"]],
        steps: ["Pancarı haşlayıp rendeleyin.", "Yoğurt, sarımsak ve limonla sos hazırlayın.", "Pancarla karıştırıp soğuk servis edin."]
    },
    {
        category: "Salatalar",
        title: "Roka Salatası",
        imageQuery: "arugula salad",
        exp: "Roka, domates ve limonla balık sofralarına uyumlu salata.",
        ingredients: [["Roka", "1 demet"], ["Domates", "2 adet"], ["Limon", "1 adet"], ["Zeytinyağı", "2 yemek kaşığı"]],
        steps: ["Rokayı yıkayıp iri parçalar halinde koparın.", "Domatesleri doğrayıp rokayla birleştirin.", "Limon ve zeytinyağıyla servis edin."]
    },
    {
        category: "Salatalar",
        title: "Bulgur Salatası",
        imageQuery: "bulgur salad kisir",
        exp: "Kısırı andıran, bol yeşillikli doyurucu bulgur salatası.",
        ingredients: [["Bulgur", "1 su bardağı"], ["Domates", "2 adet"], ["Maydanoz", "yarım demet"], ["Limon", "1 adet"]],
        steps: ["Bulguru sıcak suyla ıslatıp şişmesini bekleyin.", "Domates ve yeşillikleri doğrayın.", "Limonlu sosla tüm malzemeyi harmanlayın."]
    },
    {
        category: "Salatalar",
        title: "Kinoalı Salata",
        imageQuery: "quinoa salad",
        exp: "Kinoa ve taze sebzelerle hafif ama doyurucu kase.",
        ingredients: [["Kinoa", "1 su bardağı"], ["Salatalık", "1 adet"], ["Domates", "2 adet"], ["Limon", "1 adet"]],
        steps: ["Kinoayı yıkayıp haşlayın ve soğutun.", "Sebzeleri küçük doğrayın.", "Limonlu sosla karıştırıp servis edin."]
    },

    {
        category: "Tatlılar",
        title: "Baklava",
        imageQuery: "baklava dessert",
        exp: "Kat kat yufka, ceviz ve şerbetle klasik bayram tatlısı.",
        ingredients: [["Baklava Yufkası", "1 paket"], ["Ceviz", "2 su bardağı"], ["Tereyağı", "200 g"], ["Şeker", "2 su bardağı"]],
        steps: ["Yufkaları tepsiye kat kat dizip aralarına tereyağı sürün.", "Cevizi serpiştirip dilimleyin ve fırında kızartın.", "Ilık şerbeti sıcak baklavanın üzerine gezdirin."]
    },
    {
        category: "Tatlılar",
        title: "Revani",
        imageQuery: "revani semolina cake",
        exp: "İrmikli keki ve limonlu şerbetiyle hafif tatlı.",
        ingredients: [["İrmik", "1 su bardağı"], ["Un", "1 su bardağı"], ["Yumurta", "3 adet"], ["Şeker", "1 su bardağı"]],
        steps: ["Yumurta ve şekeri çırpıp irmik ve unu ekleyin.", "Karışımı fırın kabına döküp kızarana kadar pişirin.", "Ilık şerbeti kekin üzerine gezdirin."]
    },
    {
        category: "Tatlılar",
        title: "Kazandibi",
        imageQuery: "kazandibi dessert",
        exp: "Yanık taban aromasıyla sütlü tatlıların sevilen klasiği.",
        ingredients: [["Süt", "1 litre"], ["Şeker", "1 su bardağı"], ["Un", "2 yemek kaşığı"], ["Pirinç Unu", "2 yemek kaşığı"]],
        steps: ["Süt, şeker, un ve pirinç ununu tencerede karıştırın.", "Koyulaşana kadar pişirip tepsiye yayın.", "Tabanını kontrollü yakıp soğuduktan sonra dilimleyin."]
    },
    {
        category: "Tatlılar",
        title: "İrmik Helvası",
        imageQuery: "semolina halva",
        exp: "Tereyağında kavrulmuş irmikle kokusu mutfağı saran tatlı.",
        ingredients: [["İrmik", "1 su bardağı"], ["Tereyağı", "2 yemek kaşığı"], ["Şeker", "1 su bardağı"], ["Süt", "1 su bardağı"]],
        steps: ["İrmiği tereyağında rengi dönene kadar kavurun.", "Süt ve şekeri ekleyip karıştırın.", "Kapağını kapatıp demlendirerek servis edin."]
    },
    {
        category: "Tatlılar",
        title: "Aşure",
        imageQuery: "ashure dessert",
        exp: "Bakliyat, kuru meyve ve kuruyemişlerle bereketli tatlı.",
        ingredients: [["Buğday", "2 su bardağı"], ["Nohut", "1 su bardağı"], ["Şeker", "2 su bardağı"], ["Ceviz", "1 çay bardağı"]],
        steps: ["Buğday ve nohudu ayrı ayrı yumuşayana kadar haşlayın.", "Tüm malzemeyi tencerede şekerle birlikte kaynatın.", "Kaselere paylaştırıp cevizle süsleyin."]
    },
    {
        category: "Tatlılar",
        title: "Tiramisu",
        imageQuery: "tiramisu dessert",
        exp: "Kahveli bisküvi ve kremayla hazırlanan soğuk tatlı.",
        ingredients: [["Kedi Dili", "1 paket"], ["Kahve", "1 su bardağı"], ["Labne", "200 g"], ["Kakao", "2 yemek kaşığı"]],
        steps: ["Bisküvileri kahveyle hafifçe ıslatın.", "Labneli kremayı hazırlayıp katların arasına sürün.", "Üzerine kakao serpip buzdolabında dinlendirin."]
    },
    {
        category: "Tatlılar",
        title: "Cheesecake",
        imageQuery: "cheesecake slice",
        exp: "Bisküvi tabanlı, krem peynir dolgulu ferah tatlı.",
        ingredients: [["Bisküvi", "2 paket"], ["Tereyağı", "100 g"], ["Labne", "400 g"], ["Yumurta", "2 adet"]],
        steps: ["Bisküviyi tereyağıyla karıştırıp kalıba bastırın.", "Labne, yumurta ve şekeri çırpıp tabanın üzerine dökün.", "Fırında pişirip soğuyunca dilimleyin."]
    },
    {
        category: "Tatlılar",
        title: "Profiterol",
        imageQuery: "profiterole dessert",
        exp: "Kremalı hamur topları ve çikolata sosuyla gösterişli tatlı.",
        ingredients: [["Un", "1 su bardağı"], ["Yumurta", "3 adet"], ["Süt", "2 su bardağı"], ["Çikolata", "100 g"]],
        steps: ["Hamuru pişirip yumurtalarla karıştırarak sıkılabilir kıvama getirin.", "Küçük toplar halinde fırında pişirin.", "Kremayla doldurup çikolata sosla servis edin."]
    },
    {
        category: "Tatlılar",
        title: "Magnolia",
        imageQuery: "magnolia pudding dessert",
        exp: "Bisküvi kırıntısı ve meyveyle kat kat sütlü tatlı.",
        ingredients: [["Süt", "1 litre"], ["Un", "2 yemek kaşığı"], ["Şeker", "1 su bardağı"], ["Bisküvi", "1 paket"]],
        steps: ["Süt, un ve şekeri karıştırarak muhallebi pişirin.", "Bisküvileri ufalayın ve kuplara paylaştırın.", "Muhallebi ve meyveyle kat kat dizip soğutun."]
    },
    {
        category: "Tatlılar",
        title: "Keşkül",
        imageQuery: "keskul almond pudding",
        exp: "Badem aromalı, hafif ve zarif sütlü tatlı.",
        ingredients: [["Süt", "1 litre"], ["Şeker", "1 su bardağı"], ["Pirinç Unu", "2 yemek kaşığı"], ["Badem", "1 çay bardağı"]],
        steps: ["Süt, şeker ve pirinç ununu tencereye alın.", "Karıştırarak koyulaşana kadar pişirin.", "Kaselere paylaştırıp bademle servis edin."]
    }
];

function stepKindsForCategory(category) {
    if (category === "Çorbalar") return ["prep", "pot", "serve"];
    if (category === "Tatlılar") return ["mix", "oven", "serve"];
    if (category === "Salatalar") return ["salad", "prep", "serve"];
    if (category === "Kahvaltılık") return ["prep", "pan", "serve"];
    return ["prep", "pan", "serve"];
}

function contentTypeExt(contentType, url) {
    const type = (contentType || "").split(";")[0].toLowerCase();
    if (type === "image/jpeg" || type === "image/jpg") return ".jpg";
    if (type === "image/png") return ".png";
    if (type === "image/webp") return ".webp";
    const clean = url.split("?")[0].toLowerCase();
    if (clean.endsWith(".png")) return ".png";
    if (clean.endsWith(".webp")) return ".webp";
    return ".jpg";
}

function validImageUrl(url) {
    const clean = (url || "").split("?")[0].toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp"].some(ext => clean.endsWith(ext));
}

async function searchImage(query) {
    const url = new URL("https://api.openverse.org/v1/images/");
    url.search = new URLSearchParams({
        format: "json",
        q: query,
        page_size: "12",
        mature: "false"
    });

    for (let attempt = 1; attempt <= 4; attempt++) {
        const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
        if (res.ok) {
            const json = await res.json();
            await sleep(3200);
            return (json.results || []).filter(item => validImageUrl(item.url));
        }

        if ((res.status === 401 || res.status === 429) && attempt < 4) {
            const wait = attempt * 10000;
            console.log(`Openverse ${res.status}; ${wait / 1000}s bekleniyor: ${query}`);
            await sleep(wait);
            continue;
        }

        const body = await res.text().catch(() => "");
        throw new Error(`Openverse ${res.status}: ${query} ${body.slice(0, 120)}`);
    }

    return [];
}

async function downloadImage(item, targetDir, targetBase) {
    const res = await fetch(item.url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`Görsel indirilemedi (${res.status}): ${item.url}`);

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
        throw new Error(`Görsel olmayan içerik: ${contentType}`);
    }

    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 1024) throw new Error("Görsel dosyası çok küçük.");

    const ext = contentTypeExt(contentType, item.url);
    const filename = `${targetBase}${ext}`;
    const absolutePath = path.join(targetDir, filename);
    await fs.writeFile(absolutePath, bytes);

    return {
        filename,
        bytes: bytes.length,
        contentType,
        sourceTitle: item.title || null,
        sourceUrl: item.foreign_landing_url || item.url,
        downloadUrl: item.url,
        creator: item.creator || null,
        creatorUrl: item.creator_url || null,
        license: item.license || null,
        licenseVersion: item.license_version || null,
        licenseUrl: item.license_url || null,
        provider: item.provider || null,
        source: item.source || null
    };
}

async function downloadFirst(queries, targetDir, targetBase) {
    const searchQueries = Array.isArray(queries) ? queries : [queries];
    let lastError = null;

    for (const query of searchQueries.filter(Boolean)) {
        const items = await searchImage(query);
        for (const item of items) {
            try {
                const downloaded = await downloadImage(item, targetDir, targetBase);
                return { query, ...downloaded };
            } catch (err) {
                lastError = err;
            }
        }
    }

    throw lastError || new Error(`Uygun görsel bulunamadı: ${searchQueries.join(", ")}`);
}

async function ensureStepImages(sources) {
    const imagePaths = {};
    for (const [kind, query] of Object.entries(stepImages)) {
        const base = `step-${kind}`;
        const downloaded = await downloadFirst(query, STEP_DIR, base);
        imagePaths[kind] = `/static/uploads/recipes/steps/${downloaded.filename}`;
        sources.push({ type: "step", key: kind, query, file: downloaded.filename, ...downloaded });
        console.log(`Adım görseli hazır: ${kind}`);
    }
    return imagePaths;
}

async function ensureIngredients(items) {
    const ids = [];
    for (const [name, amount] of items) {
        await db.execute("INSERT IGNORE INTO ingredients (name) VALUES (?)", [name]);
        const [rows] = await db.execute("SELECT ingredientid FROM ingredients WHERE name=?", [name]);
        ids.push({ ingredientid: rows[0].ingredientid, amount });
    }
    return ids;
}

async function uniqueSlug(title, currentRecipeId = null) {
    const base = tr(title) || "tarif";
    let slug = base;
    let i = 2;
    while (true) {
        const params = currentRecipeId ? [slug, currentRecipeId] : [slug];
        const sql = currentRecipeId
            ? "SELECT recipeid FROM recipes WHERE slug=? AND recipeid<>?"
            : "SELECT recipeid FROM recipes WHERE slug=?";
        const [rows] = await db.execute(sql, params);
        if (!rows[0]) return slug;
        slug = `${base}-${i++}`;
    }
}

async function upsertRecipe(recipe, categoryMap, chefId, stepImagePaths, sources, isExisting = false) {
    const slug = await uniqueSlug(recipe.title);
    const categoryid = categoryMap.get(recipe.category);
    if (!categoryid && !isExisting) throw new Error(`Kategori bulunamadı: ${recipe.category}`);

    const instructions = recipe.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
    const [existing] = await db.execute(
        "SELECT recipeid, slug, categoryid FROM recipes WHERE title=? LIMIT 1",
        [recipe.title]
    );

    let recipeid;
    let finalSlug = slug;
    if (existing[0]) {
        recipeid = existing[0].recipeid;
        finalSlug = existing[0].slug;
        await db.execute(
            "UPDATE recipes SET exp=?, instructions=? WHERE recipeid=?",
            [recipe.exp || "Özenle hazırlanmış pratik tarif.", instructions, recipeid]
        );
    } else {
        const [inserted] = await db.execute(
            `INSERT INTO recipes (title, slug, exp, instructions, image, categoryid, userid)
             VALUES (?, ?, ?, ?, NULL, ?, ?)`,
            [recipe.title, slug, recipe.exp, instructions, categoryid, chefId]
        );
        recipeid = inserted.insertId;
        finalSlug = slug;
    }

    const mainBase = `${finalSlug}-main`;
    const main = await downloadFirst(
        [
            recipe.imageQuery,
            `${recipe.title} food`,
            categoryImageFallback[recipe.category],
            "homemade food plate"
        ],
        EXTRA_DIR,
        mainBase
    );
    const mainPath = `/static/uploads/recipes/extra/${main.filename}`;
    await db.execute("UPDATE recipes SET image=? WHERE recipeid=?", [mainPath, recipeid]);
    sources.push({
        type: "recipe-main",
        recipeid,
        recipeTitle: recipe.title,
        query: recipe.imageQuery,
        file: main.filename,
        imagePath: mainPath,
        ...main
    });

    if (recipe.ingredients) {
        const ingredientIds = await ensureIngredients(recipe.ingredients);
        await db.execute("DELETE FROM recipe_ingredients WHERE recipeid=?", [recipeid]);
        for (const item of ingredientIds) {
            await db.execute(
                "INSERT INTO recipe_ingredients (recipeid, ingredientid, amount) VALUES (?, ?, ?)",
                [recipeid, item.ingredientid, item.amount]
            );
        }
    }

    const kinds = recipe.stepKind || stepKindsForCategory(recipe.category);
    await db.execute("DELETE FROM recipe_steps WHERE recipeid=?", [recipeid]);
    for (let i = 0; i < recipe.steps.length; i++) {
        const kind = kinds[i] || kinds[kinds.length - 1] || "serve";
        await db.execute(
            "INSERT INTO recipe_steps (recipeid, stepOrder, body, image) VALUES (?, ?, ?, ?)",
            [recipeid, i + 1, recipe.steps[i], stepImagePaths[kind] || null]
        );
    }

    console.log(`Tarif hazır: ${recipe.title}`);
}

(async () => {
    await fs.mkdir(EXTRA_DIR, { recursive: true });
    await fs.mkdir(STEP_DIR, { recursive: true });

    await db.execute(`CREATE TABLE IF NOT EXISTS recipe_steps (
        stepid INT AUTO_INCREMENT PRIMARY KEY,
        recipeid INT NOT NULL,
        stepOrder INT NOT NULL,
        body TEXT NOT NULL,
        image VARCHAR(255) DEFAULT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_recipe_step_order (recipeid, stepOrder),
        FOREIGN KEY (recipeid) REFERENCES recipes(recipeid) ON DELETE CASCADE
    ) ENGINE=InnoDB`);

    const [categories] = await db.execute("SELECT categoryid, name FROM categories");
    const categoryMap = new Map(categories.map(c => [c.name, c.categoryid]));
    const [chefRows] = await db.execute("SELECT userid FROM users WHERE role='chef' ORDER BY userid LIMIT 1");
    const chefId = chefRows[0] ? chefRows[0].userid : 1;
    const sources = [];

    const stepImagePaths = await ensureStepImages(sources);

    for (const recipe of existingEnhancements) {
        await upsertRecipe(recipe, categoryMap, chefId, stepImagePaths, sources, true);
    }

    for (const recipe of extraRecipes) {
        await upsertRecipe(recipe, categoryMap, chefId, stepImagePaths, sources);
    }

    await fs.writeFile(SOURCE_FILE, JSON.stringify(sources, null, 2), "utf8");

    const [countRows] = await db.execute("SELECT COUNT(*) AS c FROM recipes");
    console.log(`Tamam. Toplam tarif: ${countRows[0].c}`);
    console.log(`Kaynak manifesti: ${SOURCE_FILE}`);
})()
    .catch(err => {
        console.error("Ek tarif yükleme hatası:", err);
        process.exitCode = 1;
    })
    .finally(async () => {
        try { await db.end(); } catch (_) { /* yut */ }
    });
