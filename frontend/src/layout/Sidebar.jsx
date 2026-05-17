import { Link } from "react-router-dom";

export default function Sidebar({ categories }) {
    return (
        <aside className="side">
            <h3>Kategoriler</h3>
            <ul className="cat-list">
                {(categories || []).map(c => (
                    <li key={c.categoryid}>
                        <Link to={"/category/" + c.slug}>{c.name}</Link>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
