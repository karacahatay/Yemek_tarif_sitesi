import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminSidebar() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    return (
        <aside className="side admin-side">
            <h3>Panel</h3>
            <ul className="cat-list">
                <li><Link to="/admin">Ana Panel</Link></li>
                <li><Link to="/admin/recipes">Tarifler</Link></li>
                <li><Link to="/admin/recipes/new">+ Yeni Tarif</Link></li>
                {isAdmin && (
                    <>
                        <li className="muted">— Yönetici —</li>
                        <li><Link to="/admin/announcements">Duyurular</Link></li>
                        <li><Link to="/admin/gallery">Galeri</Link></li>
                    </>
                )}
                <li className="sep"></li>
                <li><Link to="/">← Siteye dön</Link></li>
            </ul>
        </aside>
    );
}
