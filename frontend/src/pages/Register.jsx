import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "", surname: "", email: "", password: "", role: "user"
    });
    const [err, setErr] = useState(null);
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr(null);
        setMsg(null);
        setBusy(true);
        try {
            await register(form);
            setMsg("Kayıt başarılı. Yönlendiriliyorsun…");
            setTimeout(() => navigate("/login"), 600);
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
                }}>🥗</div>
                <h1 style={{ margin: 0 }}>Aramıza Katıl</h1>
                <p className="muted" style={{ margin: "8px 0 0" }}>
                    Ücretsiz hesap aç, tarifleri kaydet ve beğen.
                </p>
            </div>
            {err && <div className="alert error">{err}</div>}
            {msg && <div className="alert">{msg}</div>}
            <form className="form" onSubmit={onSubmit}>
                <label>
                    <span>Ad</span>
                    <input type="text" value={form.name} onChange={set("name")} required />
                </label>
                <label>
                    <span>Soyad</span>
                    <input type="text" value={form.surname} onChange={set("surname")} required />
                </label>
                <label>
                    <span>Email</span>
                    <input type="email" value={form.email} onChange={set("email")} required />
                </label>
                <label>
                    <span>Şifre</span>
                    <input type="password" value={form.password} onChange={set("password")} required />
                </label>
                <label>
                    <span>Rol</span>
                    <select value={form.role} onChange={set("role")}>
                        <option value="user">Normal Kullanıcı</option>
                        <option value="chef">Şef</option>
                    </select>
                </label>
                <button type="submit" disabled={busy}>{busy ? "Gönderiliyor…" : "Kayıt Ol"}</button>
            </form>
            <p className="muted">Zaten hesabın var mı? <Link to="/login">Giriş yap</Link></p>
        </>
    );
}
