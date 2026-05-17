import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import TopBar from "./TopBar.jsx";
import Sidebar from "./Sidebar.jsx";
import Footer from "./Footer.jsx";
import { apiGet } from "../api/client.js";

export default function Layout() {
    const location = useLocation();
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        apiGet("/api/categories")
            .then(d => setCategories(d.categories || []))
            .catch(() => setCategories([]));
    }, []);

    const path = location.pathname;
    const narrow = path === "/login" || path === "/register";
    // Admin sayfaları kendi sidebar'ını gösterir; auth sayfaları sidebar göstermez.
    const skipMainShell = narrow || path.startsWith("/admin");

    return (
        <div className="page">
            <TopBar />
            <main className={"container " + (narrow ? "narrow" : "")}>
                {skipMainShell ? (
                    <Outlet />
                ) : (
                    <div className="layout">
                        <Sidebar categories={categories} />
                        <section className="content">
                            <Outlet />
                        </section>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
