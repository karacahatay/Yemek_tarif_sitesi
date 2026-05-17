import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPostForm } from "../../api/client.js";

export default function Gallery() {
    const [items, setItems] = useState(null);
    const [err, setErr] = useState(null);
    const [title, setTitle] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = () => {
        apiGet("/api/admin/gallery")
            .then(d => setItems(d.items))
            .catch(e => setErr(e.message));
    };

    useEffect(load, []);

    const onUpload = async (e) => {
        e.preventDefault();
        setErr(null);
        if (!imageFile) {
            setErr("Görsel seç.");
            return;
        }
        setBusy(true);
        try {
            const fd = new FormData();
            fd.append("title", title);
            fd.append("image", imageFile);
            await apiPostForm("/api/admin/gallery", fd);
            setTitle("");
            setImageFile(null);
            // input[type=file]'i temizle
            e.target.reset();
            load();
        } catch (e2) {
            setErr(e2.message);
        } finally {
            setBusy(false);
        }
    };

    const onDelete = async (id) => {
        if (!confirm("Bu görseli sil?")) return;
        try {
            await apiPost("/api/admin/gallery/" + id + "/delete");
            setItems(its => its.filter(g => g.galleryid !== id));
        } catch (e) {
            alert(e.message);
        }
    };

    if (err && items === null) return <div className="alert error">{err}</div>;
    if (items === null) return <p className="muted">Yükleniyor…</p>;

    return (
        <>
            <h1>Galeri</h1>
            {err && <div className="alert error">{err}</div>}

            <form className="form" onSubmit={onUpload}>
                <label>
                    <span>Başlık</span>
                    <input
                        type="text"
                        placeholder="Görsel başlığı"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        maxLength={200}
                    />
                </label>
                <label>
                    <span>Görsel (max 5MB)</span>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => setImageFile(e.target.files?.[0] || null)}
                        required
                    />
                </label>
                <button type="submit" disabled={busy}>{busy ? "Yükleniyor…" : "Yükle"}</button>
            </form>

            <h2>Galerideki Görseller ({items.length})</h2>

            {items.length === 0 ? (
                <p className="muted">Henüz görsel yok.</p>
            ) : (
                <div className="gallery-grid">
                    {items.map(g => (
                        <div key={g.galleryid} className="gallery-item">
                            <img src={g.image} alt={g.title} />
                            <div className="gallery-body">
                                <div className="gallery-title">{g.title}</div>
                                <div className="small muted">
                                    {g.userName} {g.userSurname} ·{" "}
                                    {new Date(g.createdAt).toLocaleDateString("tr-TR")}
                                </div>
                                <button type="button" className="btn-danger" onClick={() => onDelete(g.galleryid)}>
                                    Sil
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
