import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiGet } from "../api/client.js";
import RecipeCard from "../components/RecipeCard.jsx";

function Hero({ recipeCount, categoryCount }) {
    return (
        <section className="hero">
            <div className="hero-inner">
                <div>
                    <span className="hero-eyebrow">👨‍🍳 Türk Mutfağı</span>
                    <h1>
                        Lezzetli tariflerle <span className="accent">mutfağına ilham</span> kat
                    </h1>
                    <p className="hero-tagline">
                        Geleneksel tatlardan modern yorumlara; tarif keşfet, kaydet,
                        beğen ve yorum yap. Malzemelerine göre arama yap, hızlıca pişir.
                    </p>
                    <div className="hero-cta">
                        <a href="#populer" className="btn">Popüler Tariflere Bak</a>
                        <Link to="/search/ingredients" className="btn ghost">
                            🥕 Malzemeye Göre Ara
                        </Link>
                    </div>
                    <div className="hero-stats">
                        <div className="hero-stat">
                            <span className="num">{recipeCount || "5+"}</span>
                            <span className="lbl">Tarif</span>
                        </div>
                        <div className="hero-stat">
                            <span className="num">{categoryCount || 5}</span>
                            <span className="lbl">Kategori</span>
                        </div>
                        <div className="hero-stat">
                            <span className="num">20+</span>
                            <span className="lbl">Malzeme</span>
                        </div>
                    </div>
                </div>
                <div className="hero-art" aria-hidden="true">
                    <div className="plate">🍲</div>
                    <div className="float-card fc-1">
                        <span className="dot">⭐</span>
                        <span>Günün Tarifi</span>
                    </div>
                    <div className="float-card fc-2">
                        <span className="dot">❤</span>
                        <span>Favorilerin</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function Home() {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        apiGet("/api/home")
            .then(setData)
            .catch(e => setErr(e.message));
    }, []);

    if (err) return <div className="alert error">{err}</div>;
    if (!data) return <p className="muted">Yükleniyor…</p>;

    const { popular, dailyMenu, announcements } = data;

    return (
        <>
            <Hero
                recipeCount={popular ? popular.length : null}
                categoryCount={dailyMenu ? dailyMenu.length : null}
            />

            {announcements && announcements.length > 0 && (
                <div className="anc-banner">
                    <h3>Duyurular</h3>
                    <ul>
                        {announcements.map(a => (
                            <li key={a.noticeid}>
                                <strong>{a.title}</strong>
                                <span className="muted small">
                                    {" · "}{new Date(a.createdAt).toLocaleDateString("tr-TR")}
                                </span>
                                <div>{a.exp}</div>
                            </li>
                        ))}
                    </ul>
                    <Link to="/announcements" className="muted small">Tüm duyurular →</Link>
                </div>
            )}

            {dailyMenu && dailyMenu.length > 0 && (
                <>
                    <h2>Günün Menüsü</h2>
                    <p className="muted">Her kategoriden bugün için seçilmiş bir tarif.</p>
                    <div className="recipe-grid daily">
                        {dailyMenu.map(r => <RecipeCard key={r.slug} r={r} />)}
                    </div>
                </>
            )}

            <h2 id="populer">Popüler Tarifler</h2>
            {(!popular || popular.length === 0) ? (
                <p className="muted">Henüz tarif yok.</p>
            ) : (
                <div className="recipe-grid">
                    {popular.map(r => <RecipeCard key={r.recipeid} r={r} />)}
                </div>
            )}
        </>
    );
}
