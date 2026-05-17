import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function TopBar() {
    const { user, signout } = useAuth();
    const navigate = useNavigate();
    const [q, setQ] = useState("");

    const onSearch = (e) => {
        e.preventDefault();
        if (q.trim()) navigate("/search?q=" + encodeURIComponent(q.trim()));
    };

    const onSignout = async () => {
        await signout();
        navigate("/");
    };

    return (
        <header className="topbar">
            <div className="topbar-inner">
                <Link className="brand" to="/">
                    <span className="brand-mark" aria-hidden="true">🍳</span>
                    <span>Tarif Sitesi</span>
                </Link>

                <form className="searchbar" onSubmit={onSearch} role="search">
                    <input
                        type="text"
                        name="q"
                        placeholder="Tarif adı veya malzeme ara..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <button type="submit">Ara</button>
                    <Link to="/search/ingredients" className="btn-ghost">Malzemeye göre</Link>
                </form>

                <nav className="topnav">
                    {user ? (
                        <>
                            <span className="hello">Merhaba, {user.fullname}</span>
                            <Link to="/saved">Kayıtlarım</Link>
                            {(user.role === "chef" || user.role === "admin") && (
                                <Link to="/admin">Panel</Link>
                            )}
                            <button type="button" className="link-btn" onClick={onSignout}>Çıkış</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Giriş</Link>
                            <Link to="/register">Kayıt</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
