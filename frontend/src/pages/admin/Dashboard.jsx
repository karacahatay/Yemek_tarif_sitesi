import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../api/client.js";

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        apiGet("/api/admin/dashboard")
            .then(setData)
            .catch(e => setErr(e.message));
    }, []);

    if (err) return <div className="alert error">{err}</div>;
    if (!data) return <p className="muted">Yükleniyor…</p>;

    const isAdmin = data.role === "admin";

    return (
        <>
            <h1>Panel</h1>
            <p className="muted">Rol: <strong>{data.role}</strong></p>

            <div className="stat-cards">
                <div className="stat-card">
                    <span className="stat-num">{data.myRecipeCount}</span>
                    <span className="stat-lbl">
                        {isAdmin ? "Toplam Tarif" : "Tariflerim"}
                    </span>
                </div>
                {isAdmin && (
                    <>
                        <div className="stat-card">
                            <span className="stat-num">{data.ancCount}</span>
                            <span className="stat-lbl">Duyuru</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-num">{data.galleryCount}</span>
                            <span className="stat-lbl">Galeri Görseli</span>
                        </div>
                    </>
                )}
            </div>

            <div className="quick">
                <Link to="/admin/recipes/new" className="btn">+ Yeni Tarif Ekle</Link>
                <Link to="/admin/recipes" className="btn ghost">Tarifleri Yönet</Link>
                {isAdmin && (
                    <>
                        <Link to="/admin/announcements/new" className="btn ghost">+ Yeni Duyuru</Link>
                        <Link to="/admin/gallery" className="btn ghost">Galeri</Link>
                    </>
                )}
            </div>
        </>
    );
}
