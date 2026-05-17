import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../../api/client.js";

export default function AnnouncementForm() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ title: "", exp: "", isactive: true });
    const [err, setErr] = useState(null);
    const [busy, setBusy] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr(null);
        if (!form.title.trim() || !form.exp.trim()) {
            setErr("Başlık ve içerik zorunlu.");
            return;
        }
        setBusy(true);
        try {
            await apiPost("/api/admin/announcements", form);
            navigate("/admin/announcements");
        } catch (e2) {
            setErr(e2.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <h1>Yeni Duyuru</h1>
            {err && <div className="alert error">{err}</div>}
            <form className="form" onSubmit={onSubmit}>
                <label>
                    <span>Başlık</span>
                    <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        required
                        maxLength={200}
                    />
                </label>
                <label>
                    <span>İçerik</span>
                    <textarea
                        rows="5"
                        value={form.exp}
                        onChange={e => setForm({ ...form, exp: e.target.value })}
                        required
                    />
                </label>
                <label className="inline">
                    <input
                        type="checkbox"
                        checked={form.isactive}
                        onChange={e => setForm({ ...form, isactive: e.target.checked })}
                    />
                    <span>Aktif (yayında)</span>
                </label>
                <button type="submit" disabled={busy}>
                    {busy ? "Yayınlanıyor…" : "Duyuruyu Yayınla"}
                </button>
            </form>
        </>
    );
}
