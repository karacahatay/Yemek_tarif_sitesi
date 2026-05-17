import { useEffect, useState } from "react";
import { apiGet } from "../api/client.js";

export default function Gallery() {
    const [items, setItems] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        apiGet("/api/gallery")
            .then(d => setItems(d.items))
            .catch(e => setErr(e.message));
    }, []);

    if (err) return <div className="alert error">{err}</div>;
    if (items === null) return <p className="muted">Yükleniyor…</p>;

    return (
        <>
            <h1>Resim Galerisi</h1>
            {items.length === 0 ? (
                <p className="muted">Galeride henüz görsel yok.</p>
            ) : (
                <div className="gallery-grid public">
                    {items.map(g => (
                        <figure key={g.galleryid} className="gallery-item">
                            <img src={g.image} alt={g.title} loading="lazy" />
                            <figcaption>{g.title}</figcaption>
                        </figure>
                    ))}
                </div>
            )}
        </>
    );
}
