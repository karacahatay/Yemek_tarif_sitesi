import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Sitemap() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        apiGet("/api/sitemap")
            .then(setData)
            .catch(e => setErr(e.message));
    }, []);

    if (err) return <div className="alert error">{err}</div>;
    if (!data) return <p className="muted">Yükleniyor…</p>;

    return (
        <>
            <h1>Site Haritası</h1>
            <div className="sitemap-grid">
                <div>
                    <h3>Genel</h3>
                    <ul>
                        <li><Link to="/">Ana Sayfa</Link></li>
                        <li><Link to="/search">Arama</Link></li>
                        <li><Link to="/search/ingredients">Malzemeye Göre Arama</Link></li>
                        <li><Link to="/announcements">Duyurular</Link></li>
                        <li><Link to="/gallery">Galeri</Link></li>
                        <li><Link to="/sitemap">Site Haritası</Link></li>
                    </ul>
                </div>
                <div>
                    <h3>Hesap</h3>
                    <ul>
                        {user ? (
                            <>
                                <li><Link to="/saved">Kayıtlarım</Link></li>
                                {(user.role === "chef" || user.role === "admin") && (
                                    <li><Link to="/admin">Panel</Link></li>
                                )}
                            </>
                        ) : (
                            <>
                                <li><Link to="/login">Giriş</Link></li>
                                <li><Link to="/register">Kayıt</Link></li>
                            </>
                        )}
                    </ul>
                </div>
                <div>
                    <h3>Kategoriler</h3>
                    <ul>
                        {data.categories.map(c => (
                            <li key={c.slug}><Link to={"/category/" + c.slug}>{c.name}</Link></li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3>Tarifler</h3>
                    <ul className="sitemap-recipes">
                        {data.recipes.map(r => (
                            <li key={r.slug}><Link to={"/recipe/" + r.slug}>{r.title}</Link></li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}
