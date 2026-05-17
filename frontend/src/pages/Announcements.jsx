import { useEffect, useState } from "react";
import { apiGet } from "../api/client.js";

export default function Announcements() {
    const [items, setItems] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        apiGet("/api/announcements")
            .then(d => setItems(d.announcements))
            .catch(e => setErr(e.message));
    }, []);

    if (err) return <div className="alert error">{err}</div>;
    if (items === null) return <p className="muted">Yükleniyor…</p>;

    return (
        <>
            <h1>Duyurular</h1>
            {items.length === 0 ? (
                <p className="muted">Şu an yayında duyuru yok.</p>
            ) : (
                <ul className="anc-list">
                    {items.map(a => (
                        <li key={a.noticeid} className="anc-item">
                            <div className="anc-head">
                                <strong>{a.title}</strong>
                                <span className="muted small">
                                    {new Date(a.createdAt).toLocaleDateString("tr-TR")}
                                </span>
                            </div>
                            <div className="anc-body">{a.exp}</div>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
