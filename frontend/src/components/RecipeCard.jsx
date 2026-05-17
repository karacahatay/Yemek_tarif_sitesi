import { Link } from "react-router-dom";

export default function RecipeCard({ r, showCategory = true }) {
    return (
        <article className="recipe-card">
            <Link to={"/recipe/" + r.slug} className="recipe-card-link">
                {r.image
                    ? <img src={r.image} alt={r.title} />
                    : <div className="recipe-noimg">Görsel yok</div>}
                <div className="recipe-body">
                    {showCategory && r.categoryName && (
                        <span className="badge">{r.categoryName}</span>
                    )}
                    <h3>{r.title}</h3>
                    <p>{r.exp}</p>
                </div>
            </Link>
        </article>
    );
}
