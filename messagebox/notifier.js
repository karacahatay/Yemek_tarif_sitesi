// node-notifier ile masaüstü toast bildirim. Headless ortamda atlanır.
const notifier = require("node-notifier");
const path = require("path");

module.exports = (title, message, cb) => {
    try {
        notifier.notify(
            {
                title: title,
                message: message,
                icon: path.join(__dirname, "..", "public", "favicon.ico"),
                sound: true,
                wait: false
            },
            () => {
                if (typeof cb === "function") cb();
            }
        );
    } catch (e) {
        // Headless ortam - sessizce devam et
        if (typeof cb === "function") cb();
    }
};
