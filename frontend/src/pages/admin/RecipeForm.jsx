import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPostForm } from "../../api/client.js";

export default function RecipeForm() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [form, setForm] = useState({
        title: "", exp: "", instructions: "", categoryid: ""
    });
    const [imageFile, setImageFile] = useState(null);
    // ingState[id] = { selected: bool, amount: string }
    const [ingState, setIngState] = useState({});
    const [err, setErr] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        apiGet("/api/categories")
            .then(d => setCategories(d.categories || []))
            .catch(() => { /* yut */ });
        apiGet("/api/ingredients")
            .then(d => setIngredients(d.ingredients || []))
            .catch(() => { /* yut */ });
    }, []);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const toggleIng = (id) => {
        setIngState(s => ({
            ...s,
            [id]: { ...(s[id] || { amount: "" }), selected: !s[id]?.selected }
        }));
    };
    const setAmount = (id, val) => {
        setIngState(s => ({
            ...s,
            [id]: { selected: s[id]?.selected || false, amount: val }
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr(null);
        if (!form.title || !form.exp || !form.instructions || !form.categoryid) {
            setErr("Tüm alanları doldurun.");
            return;
        }
        setBusy(true);
        try {
            const fd = new FormData();
            fd.append("title", form.title);
            fd.append("exp", form.exp);
            fd.append("instructions", form.instructions);
            fd.append("categoryid", form.categoryid);
            if (imageFile) fd.append("image", imageFile);

            // Seçilen malzemeleri ing_<id>=on + amt_<id>=miktar olarak gönder
            for (const id of Object.keys(ingState)) {
                const st = ingState[id];
                if (st.selected) {
                    fd.append("ing_" + id, "on");
                    if (st.amount) fd.append("amt_" + id, st.amount);
                }
            }

            await apiPostForm("/api/admin/recipes", fd);
            navigate("/admin/recipes");
        } catch (e2) {
            setErr(e2.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <h1>Yeni Tarif</h1>
            {err && <div className="alert error">{err}</div>}

            <form className="form" onSubmit={onSubmit}>
                <label>
                    <span>Başlık</span>
                    <input type="text" value={form.title} onChange={set("title")} required maxLength={200} />
                </label>

                <label>
                    <span>Kısa açıklama</span>
                    <textarea rows="2" value={form.exp} onChange={set("exp")} required />
                </label>

                <label>
                    <span>Yapılışı</span>
                    <textarea rows="6" value={form.instructions} onChange={set("instructions")} required />
                </label>

                <label>
                    <span>Kategori</span>
                    <select value={form.categoryid} onChange={set("categoryid")} required>
                        <option value="">— Kategori seç —</option>
                        {categories.map(c => (
                            <option key={c.categoryid} value={c.categoryid}>{c.name}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Kapak görseli (opsiyonel, max 5MB)</span>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => setImageFile(e.target.files?.[0] || null)}
                    />
                </label>

                <fieldset className="ing-fieldset">
                    <legend>Malzemeler</legend>
                    <p className="muted small">Kullandığın malzemeleri işaretle, yanına miktar yaz.</p>
                    <div className="ing-form-grid">
                        {ingredients.map(i => (
                            <div className="ing-row" key={i.ingredientid}>
                                <label className="ing-item">
                                    <input
                                        type="checkbox"
                                        checked={!!ingState[i.ingredientid]?.selected}
                                        onChange={() => toggleIng(i.ingredientid)}
                                    />
                                    <span>{i.name}</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="miktar (örn: 2 yemek kaşığı)"
                                    value={ingState[i.ingredientid]?.amount || ""}
                                    onChange={e => setAmount(i.ingredientid, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </fieldset>

                <button type="submit" disabled={busy}>
                    {busy ? "Kaydediliyor…" : "Tarifi Kaydet"}
                </button>
            </form>
        </>
    );
}
