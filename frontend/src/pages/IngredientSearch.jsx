import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet } from "../api/client.js";
import RecipeCard from "../components/RecipeCard.jsx";

export default function IngredientSearch() {
    const [params, setParams] = useSearchParams();
    const [ingredients, setIngredients] = useState([]);
    const [results, setResults] = useState(null);
    const [err, setErr] = useState(null);

    const selected = useMemo(() => {
        return params.getAll("ing").map(x => parseInt(x, 10)).filter(Number.isInteger);
    }, [params]);

    useEffect(() => {
        apiGet("/api/ingredients")
            .then(d => setIngredients(d.ingredients || []))
            .catch(() => setIngredients([]));
    }, []);

    useEffect(() => {
        setErr(null);
        if (selected.length === 0) {
            setResults([]);
            return;
        }
        const qs = selected.map(id => "ing=" + id).join("&");
        apiGet("/api/search/ingredients?" + qs)
            .then(d => setResults(d.results))
            .catch(e => setErr(e.message));
    }, [selected]);

    const toggle = (id) => {
        const set = new Set(selected);
        if (set.has(id)) set.delete(id); else set.add(id);
        const next = new URLSearchParams();
        for (const v of set) next.append("ing", v);
        setParams(next);
    };

    return (
        <>
            <h1>Malzemeye Göre Arama</h1>
            <p className="muted">
                Seçtiğin malzemelerin <strong>tamamını</strong> içeren tarifler listelenir.
            </p>

            <div className="form ing-form">
                <div className="ing-grid">
                    {ingredients.map(i => (
                        <label key={i.ingredientid} className="ing-item">
                            <input
                                type="checkbox"
                                checked={selected.includes(i.ingredientid)}
                                onChange={() => toggle(i.ingredientid)}
                            />
                            <span>{i.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            {err && <div className="alert error">{err}</div>}

            {selected.length === 0 ? (
                <p className="muted">Bir malzeme seç.</p>
            ) : results === null ? (
                <p className="muted">Yükleniyor…</p>
            ) : results.length === 0 ? (
                <p className="muted">Eşleşen tarif yok.</p>
            ) : (
                <>
                    <h2>{results.length} sonuç</h2>
                    <div className="recipe-grid">
                        {results.map(r => <RecipeCard key={r.recipeid} r={r} />)}
                    </div>
                </>
            )}
        </>
    );
}
