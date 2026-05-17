import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "../api/client.js";
import RecipeCard from "../components/RecipeCard.jsx";

export default function Category() {
    const { slug } = useParams();
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        setData(null);
        setErr(null);
        apiGet("/api/category/" + encodeURIComponent(slug))
            .then(setData)
            .catch(e => setErr(e.message));
    }, [slug]);

    if (err) return <div className="alert error">{err}</div>;
    if (!data) return <p className="muted">Yükleniyor…</p>;

    const { category, recipes } = data;

    return (
        <>
            <h1>Kategori: {category.name}</h1>
            {(!recipes || recipes.length === 0) ? (
                <p className="muted">Bu kategoride tarif yok.</p>
            ) : (
                <div className="recipe-grid">
                    {recipes.map(r => <RecipeCard key={r.recipeid} r={r} showCategory={false} />)}
                </div>
            )}
        </>
    );
}
