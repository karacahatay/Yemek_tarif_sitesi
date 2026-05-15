// dialog-node ile bloklayan dialog. Sadece masaüstünde çalışır.
let dialog;
try {
    dialog = require("dialog-node");
} catch (e) {
    dialog = null;
}

module.exports = (title, message, cb) => {
    if (!dialog) {
        if (typeof cb === "function") cb();
        return;
    }
    try {
        dialog.info(message, title, () => {
            if (typeof cb === "function") cb();
        });
    } catch (e) {
        if (typeof cb === "function") cb();
    }
};
