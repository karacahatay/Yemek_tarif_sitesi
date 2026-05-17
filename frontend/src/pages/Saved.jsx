import { useEffect, useState } from "react";
import { apiGet } from "../api/client.js";
import RecipeCard from "../components/RecipeCard.jsx";

export default function Saved() {
    const [items, setItems] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        apiGet("/api/saved")
            .then(d => setItems(d.items))
            .catch(e => setErr(e.message));
    }, []);

    if (err) return <div className="alert error">{err}</div>;
    if (items === null) return <p className="muted">Yükleniyor…</p>;

    return (
        <>
            <h1>Kayıtlı Tarifler</h1>
            {items.length === 0 ? (
                <p className="muted">Henüz kaydettiğin tarif yok. Bir tarif sayfasında "Kaydet" butonuna bas.</p>
            ) : (
                <>
                    <p className="muted">{items.length} kayıtlı tarif</p>
                    <div className="recipe-grid">
                        {items.map(r => <RecipeCard key={r.recipeid} r={r} />)}
                    </div>
                </>
            )}
        </>
    );
}
