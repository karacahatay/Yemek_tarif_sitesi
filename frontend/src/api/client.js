// Tüm API çağrılarının tek noktası.
// - credentials: 'include' → session cookie taşınır
// - CSRF token cache'lenir, POST'larda X-CSRF-Token header'a eklenir
// - 401 yakalanırsa AuthContext'e güncelleme tetiklenir (window event)

let csrfToken = null;

async function ensureCsrf() {
    if (csrfToken) return csrfToken;
    const r = await fetch("/api/csrf-token", { credentials: "include" });
    if (!r.ok) throw new Error("CSRF alınamadı");
    const data = await r.json();
    csrfToken = data.csrfToken;
    return csrfToken;
}

function invalidateCsrf() {
    csrfToken = null;
}

async function handle(res) {
    if (res.status === 204) return null;
    let data = null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
        data = await res.json();
    } else {
        data = { error: await res.text() };
    }
    if (!res.ok) {
        if (res.status === 401) {
            window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        }
        // CSRF hatasıysa token'ı sıfırla; bir sonraki POST yeniden alır
        if (res.status === 403 && data.error && /CSRF/i.test(data.error)) {
            invalidateCsrf();
        }
        const err = new Error(data.error || "Hata");
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

export async function apiGet(path) {
    const r = await fetch(path, { credentials: "include" });
    return handle(r);
}

export async function apiPost(path, body) {
    const token = await ensureCsrf();
    const r = await fetch(path, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": token
        },
        body: body ? JSON.stringify(body) : "{}"
    });
    return handle(r);
}

// Multipart (multer ile) yükleme — FormData ile çağrılır
export async function apiPostForm(path, formData) {
    const token = await ensureCsrf();
    const r = await fetch(path, {
        method: "POST",
        credentials: "include",
        headers: {
            "X-CSRF-Token": token
            // Content-Type'ı browser otomatik atar (boundary için)
        },
        body: formData
    });
    return handle(r);
}
