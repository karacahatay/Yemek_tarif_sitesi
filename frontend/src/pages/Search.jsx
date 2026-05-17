import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet } from "../api/client.js";
import RecipeCard from "../components/RecipeCard.jsx";

export default function Search() {
    const [params] = useSearchParams();
    const q = params.get("q") || "";
    const [results, setResults] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        setResults(null);
        setErr(null);
        if (!q) {
            setResults([]);
            return;
        }
        apiGet("/api/search?q=" + encodeURIComponent(q))
            .then(d => setResults(d.results))
            .catch(e => setErr(e.message));
    }, [q]);

    if (err) return <div className="alert error">{err}</div>;

    return (
        <>
            <h1>{q ? `"${q}" için sonuçlar` : "Arama"}</h1>
            {!q ? (
                <p className="muted">Üst menüden bir tarif adı veya malzeme yazıp arama yapabilirsin.</p>
            ) : results === null ? (
                <p className="muted">Yükleniyor…</p>
            ) : results.length === 0 ? (
                <p className="muted">Sonuç bulunamadı.</p>
            ) : (
                <>
                    <p className="muted">{results.length} sonuç</p>
                    <div className="recipe-grid">
                        {results.map(r => <RecipeCard key={r.recipeid} r={r} />)}
                    </div>
                </>
            )}
        </>
    );
}
