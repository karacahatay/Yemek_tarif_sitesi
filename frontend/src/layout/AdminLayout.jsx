import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar.jsx";

// /admin/* için iç layout. Ana Layout (topbar + footer) zaten dış katmanda.
// Burada genel sidebar yerine AdminSidebar gösteriyoruz.
export default function AdminLayout() {
    return (
        <div className="admin-shell">
            <AdminSidebar />
            <section className="content">
                <Outlet />
            </section>
        </div>
    );
}
