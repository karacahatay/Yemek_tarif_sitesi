import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiGet } from "../api/client.js";

export default function Footer() {
    const [stats, setStats] = useState({ visitorCount: 0, onlineCount: 0 });

    useEffect(() => {
        const load = () => {
            apiGet("/api/stats")
                .then(setStats)
                .catch(() => { /* yut */ });
        };
        load();
        // Online count'un canlı kalması için periyodik güncelleme
        const id = setInterval(load, 30000);
        return () => clearInterval(id);
    }, []);

    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-links">
                    <Link to="/announcements">Duyurular</Link>
                    <Link to="/gallery">Galeri</Link>
                    <Link to="/sitemap">Site Haritası</Link>
                </div>
                <div className="footer-stats">
                    <span>Ziyaretçi: <strong>{stats.visitorCount}</strong></span>
                    <span>Online: <strong>{stats.onlineCount}</strong></span>
                </div>
            </div>
        </footer>
    );
}
