import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet, apiPost } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Recipe() {
    const { slug } = useParams();
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);
    const [commentBody, setCommentBody] = useState("");
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        setData(null);
        setErr(null);
        apiGet("/api/recipe/" + encodeURIComponent(slug))
            .then(setData)
            .catch(e => setErr(e.message));
    }, [slug]);

    if (err) return <div className="alert error">{err}</div>;
    if (!data) return <p className="muted">Yükleniyor…</p>;

    const { recipe, ingredients, steps, comments, userLiked, userSaved } = data;

    const onLike = async () => {
        try {
            const r = await apiPost("/api/recipe/" + recipe.recipeid + "/like");
            setData(d => ({ ...d, userLiked: r.liked, recipe: { ...d.recipe, likeCount: r.likeCount } }));
        } catch (e) { alert(e.message); }
    };
    const onSave = async () => {
        try {
            const r = await apiPost("/api/recipe/" + recipe.recipeid + "/save");
            setData(d => ({ ...d, userSaved: r.saved }));
        } catch (e) { alert(e.message); }
    };
    const onComment = async (e) => {
        e.preventDefault();
        if (!commentBody.trim()) return;
        setPosting(true);
        try {
            const r = await apiPost("/api/recipe/" + recipe.recipeid + "/comment", { body: commentBody });
            setData(d => ({ ...d, comments: [r.comment, ...d.comments] }));
            setCommentBody("");
        } catch (e) {
            alert(e.message);
        } finally {
            setPosting(false);
        }
    };

    const loginUrl = "/login?url=" + encodeURIComponent("/recipe/" + recipe.slug);

    return (
        <article className="recipe-detail">
            <div className="meta">
                <Link to={"/category/" + recipe.categorySlug} className="badge">{recipe.categoryName}</Link>
                <span className="muted">Şef: {recipe.chefName} {recipe.chefSurname}</span>
                <span className="muted">❤ {recipe.likeCount} beğeni</span>
            </div>

            <h1>{recipe.title}</h1>
            <p className="lead">{recipe.exp}</p>

            <div className="recipe-facts" aria-label="Tarif bilgileri">
                <div>
                    <span>Kaç kişilik</span>
                    <strong>{recipe.servings || 4} kişilik</strong>
                </div>
                <div>
                    <span>Hazırlama</span>
                    <strong>{recipe.prepMinutes || 0} dk</strong>
                </div>
                <div>
                    <span>Pişirme</span>
                    <strong>{recipe.cookMinutes || 0} dk</strong>
                </div>
                <div>
                    <span>Toplam</span>
                    <strong>{(recipe.prepMinutes || 0) + (recipe.cookMinutes || 0)} dk</strong>
                </div>
            </div>

            {recipe.image && (
                <img className="recipe-hero" src={recipe.image} alt={recipe.title} />
            )}

            {user ? (
                <div className="actions">
                    <button className={"btn-action " + (userLiked ? "on" : "")} onClick={onLike}>
                        {userLiked ? "♥ Beğenildi" : "♡ Beğen"}
                    </button>
                    <button className={"btn-action " + (userSaved ? "on" : "")} onClick={onSave}>
                        {userSaved ? "★ Kayıtlı" : "☆ Kaydet"}
                    </button>
                </div>
            ) : (
                <p className="muted small">
                    Beğenmek, kaydetmek ve yorum yapmak için <Link to={loginUrl}>giriş yap</Link>.
                </p>
            )}

            <h2>Malzemeler</h2>
            {(!ingredients || ingredients.length === 0) ? (
                <p className="muted">Malzeme listesi yok.</p>
            ) : (
                <ul className="ingredients">
                    {ingredients.map((i, idx) => (
                        <li key={idx}>
                            <strong>{i.name}</strong>
                            {i.amount && <> — {i.amount}</>}
                        </li>
                    ))}
                </ul>
            )}

            <h2>Yapılışı</h2>
            {steps && steps.length > 0 ? (
                <ol className="recipe-steps">
                    {steps.map(step => (
                        <li key={step.stepid || step.stepOrder} className="recipe-step">
                            <div className="step-text">{step.body}</div>
                        </li>
                    ))}
                </ol>
            ) : (
                <div className="instructions">{recipe.instructions}</div>
            )}

            <h2 id="yorumlar">Yorumlar ({comments.length})</h2>

            {user ? (
                <form className="form comment-form" onSubmit={onComment}>
                    <label>
                        <span>Yorumun</span>
                        <textarea
                            rows="3"
                            placeholder="Bu tarif hakkında ne düşünüyorsun?"
                            value={commentBody}
                            onChange={e => setCommentBody(e.target.value)}
                            required
                        />
                    </label>
                    <button type="submit" disabled={posting}>{posting ? "Gönderiliyor…" : "Yorum Gönder"}</button>
                </form>
            ) : (
                <p className="muted small">
                    Yorum yapmak için <Link to={loginUrl + "#yorumlar"}>giriş yap</Link>.
                </p>
            )}

            {(!comments || comments.length === 0) ? (
                <p className="muted">Henüz yorum yok.</p>
            ) : (
                <ul className="comments">
                    {comments.map(c => (
                        <li key={c.commentid}>
                            <div className="comment-head">
                                <strong>{c.userName} {c.userSurname}</strong>
                                <span className="muted small">
                                    {new Date(c.createdAt).toLocaleString("tr-TR")}
                                </span>
                            </div>
                            <div className="comment-body">{c.body}</div>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}
