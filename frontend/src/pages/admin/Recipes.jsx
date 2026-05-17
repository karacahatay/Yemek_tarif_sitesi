import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Recipes() {
    const { user } = useAuth();
    const [recipes, setRecipes] = useState(null);
    const [err, setErr] = useState(null);

    const load = () => {
        apiGet("/api/admin/recipes")
            .then(d => setRecipes(d.recipes))
            .catch(e => setErr(e.message));
    };

    useEffect(load, []);

    const onDelete = async (id) => {
        if (!confirm("Bu tarifi silmek istediğine emin misin?")) return;
        try {
            await apiPost("/api/admin/recipes/" + id + "/delete");
            setRecipes(rs => rs.filter(r => r.recipeid !== id));
        } catch (e) {
            alert(e.message);
        }
    };

    if (err) return <div className="alert error">{err}</div>;
    if (recipes === null) return <p className="muted">Yükleniyor…</p>;

    const isAdmin = user?.role === "admin";

    return (
        <>
            <div className="page-head">
                <h1>{isAdmin ? "Tüm Tarifler" : "Tariflerim"}</h1>
                <Link to="/admin/recipes/new" className="btn">+ Yeni Tarif</Link>
            </div>

            {recipes.length === 0 ? (
                <p className="muted">Henüz tarif yok.</p>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Görsel</th>
                            <th>Başlık</th>
                            <th>Kategori</th>
                            {isAdmin && <th>Şef</th>}
                            <th>Tarih</th>
                            <th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recipes.map(r => (
                            <tr key={r.recipeid}>
                                <td>
                                    {r.image
                                        ? <img src={r.image} alt="" className="thumb" />
                                        : <span className="muted small">—</span>}
                                </td>
                                <td><Link to={"/recipe/" + r.slug}>{r.title}</Link></td>
                                <td>{r.categoryName}</td>
                                {isAdmin && <td>{r.chefName} {r.chefSurname}</td>}
                                <td className="small muted">
                                    {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                                </td>
                                <td>
                                    <button type="button" className="btn-danger" onClick={() => onDelete(r.recipeid)}>
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
