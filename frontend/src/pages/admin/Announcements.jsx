import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../../api/client.js";

export default function Announcements() {
    const [items, setItems] = useState(null);
    const [err, setErr] = useState(null);

    const load = () => {
        apiGet("/api/admin/announcements")
            .then(d => setItems(d.announcements))
            .catch(e => setErr(e.message));
    };

    useEffect(load, []);

    const onToggle = async (id) => {
        try {
            const r = await apiPost("/api/admin/announcements/" + id + "/toggle");
            setItems(its => its.map(a =>
                a.noticeid === id ? { ...a, isactive: r.isactive } : a
            ));
        } catch (e) {
            alert(e.message);
        }
    };
    const onDelete = async (id) => {
        if (!confirm("Bu duyuruyu sil?")) return;
        try {
            await apiPost("/api/admin/announcements/" + id + "/delete");
            setItems(its => its.filter(a => a.noticeid !== id));
        } catch (e) {
            alert(e.message);
        }
    };

    if (err) return <div className="alert error">{err}</div>;
    if (items === null) return <p className="muted">Yükleniyor…</p>;

    return (
        <>
            <div className="page-head">
                <h1>Duyurular</h1>
                <Link to="/admin/announcements/new" className="btn">+ Yeni Duyuru</Link>
            </div>

            {items.length === 0 ? (
                <p className="muted">Henüz duyuru yok.</p>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Durum</th>
                            <th>Başlık</th>
                            <th>İçerik</th>
                            <th>Ekleyen</th>
                            <th>Tarih</th>
                            <th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(a => (
                            <tr key={a.noticeid}>
                                <td>
                                    {a.isactive
                                        ? <span className="badge active">Aktif</span>
                                        : <span className="badge passive">Pasif</span>}
                                </td>
                                <td><strong>{a.title}</strong></td>
                                <td className="anc-exp">{a.exp}</td>
                                <td>{a.userName} {a.userSurname}</td>
                                <td className="small muted">
                                    {new Date(a.createdAt).toLocaleDateString("tr-TR")}
                                </td>
                                <td className="row-actions">
                                    <button type="button" className="btn-ghost-sm" onClick={() => onToggle(a.noticeid)}>
                                        {a.isactive ? "Pasifleştir" : "Aktifleştir"}
                                    </button>
                                    <button type="button" className="btn-danger" onClick={() => onDelete(a.noticeid)}>
                                        Sil
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}
