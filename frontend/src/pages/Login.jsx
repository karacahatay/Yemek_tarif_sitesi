import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiGet } from "../api/client.js";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const back = params.get("url") || "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [hatirla, setHatirla] = useState(false);
    const [err, setErr] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        // Beni hatırla cookie'lerini önceden doldur
        apiGet("/api/auth/remembered").then(d => {
            if (d.email) setEmail(d.email);
            if (d.password) setPassword(d.password);
            if (d.email && d.password) setHatirla(true);
        }).catch(() => { /* yut */ });
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr(null);
        setBusy(true);
        try {
            await login(email, password, hatirla);
            navigate(back, { replace: true });
        } catch (e2) {
            setErr(e2.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                    fontSize: 48, marginBottom: 8, display: "inline-block",
                    width: 80, height: 80, borderRadius: "50%",
                    background: "var(--grad-warm)", color: "#fff",
                    lineHeight: "80px", boxShadow: "var(--sh-warm)"
                }}>🍳</div>
                <h1 style={{ margin: 0 }}>Tekrar Hoş Geldin</h1>
                <p className="muted" style={{ margin: "8px 0 0" }}>
                    Tarif keşfine devam etmek için giriş yap.
                </p>
            </div>
            {err && <div className="alert error">{err}</div>}
            <form className="form" onSubmit={onSubmit}>
                <label>
                    <span>Email</span>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </label>
                <label>
                    <span>Şifre</span>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </label>
                <label className="inline">
                    <input type="checkbox" checked={hatirla} onChange={e => setHatirla(e.target.checked)} />
                    <span>Beni hatırla</span>
                </label>
                <button type="submit" disabled={busy}>{busy ? "Gönderiliyor…" : "Giriş Yap"}</button>
            </form>
            <p className="muted">Hesabın yok mu? <Link to="/register">Kayıt ol</Link></p>
        </>
    );
}
