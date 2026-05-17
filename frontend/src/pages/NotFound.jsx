import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div>
            <h1>404 - Sayfa Bulunamadı</h1>
            <p className="muted">Aradığın sayfa burada değil.</p>
            <p><Link to="/">← Ana sayfaya dön</Link></p>
        </div>
    );
}
