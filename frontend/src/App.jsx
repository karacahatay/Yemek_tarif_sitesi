import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { RequireAuth } from "./components/Guards.jsx";

import Layout from "./layout/Layout.jsx";
import AdminLayout from "./layout/AdminLayout.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Recipe from "./pages/Recipe.jsx";
import Category from "./pages/Category.jsx";
import Search from "./pages/Search.jsx";
import IngredientSearch from "./pages/IngredientSearch.jsx";
import Saved from "./pages/Saved.jsx";
import Announcements from "./pages/Announcements.jsx";
import Gallery from "./pages/Gallery.jsx";
import Sitemap from "./pages/Sitemap.jsx";
import NotFound from "./pages/NotFound.jsx";

import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminRecipes from "./pages/admin/Recipes.jsx";
import AdminRecipeForm from "./pages/admin/RecipeForm.jsx";
import AdminAnnouncements from "./pages/admin/Announcements.jsx";
import AdminAnnouncementForm from "./pages/admin/AnnouncementForm.jsx";
import AdminGallery from "./pages/admin/Gallery.jsx";

export default function App() {
    const { loading } = useAuth();
    if (loading) {
        return <div style={{ padding: 24 }}>Yükleniyor…</div>;
    }
    return (
        <Routes>
            <Route element={<Layout />}>
                {/* Public */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/recipe/:slug"       element={<Recipe />} />
                <Route path="/category/:slug"     element={<Category />} />
                <Route path="/search"             element={<Search />} />
                <Route path="/search/ingredients" element={<IngredientSearch />} />
                <Route path="/announcements"     element={<Announcements />} />
                <Route path="/gallery"            element={<Gallery />} />
                <Route path="/sitemap"            element={<Sitemap />} />

                {/* Auth-gated */}
                <Route path="/saved" element={<RequireAuth><Saved /></RequireAuth>} />

                {/* Admin (chef + admin) */}
                <Route
                    path="/admin"
                    element={
                        <RequireAuth roles={["chef", "admin"]}>
                            <AdminLayout />
                        </RequireAuth>
                    }
                >
                    <Route index                         element={<AdminDashboard />} />
                    <Route path="recipes"                element={<AdminRecipes />} />
                    <Route path="recipes/new"            element={<AdminRecipeForm />} />
                    <Route path="recipes/:id/edit"       element={<AdminRecipeForm />} />
                    {/* Admin-only — backend ayrıca 403 döner; UI guard rol kontrolü yapar */}
                    <Route path="announcements"          element={<RequireAuth roles={["admin"]}><AdminAnnouncements /></RequireAuth>} />
                    <Route path="announcements/new"      element={<RequireAuth roles={["admin"]}><AdminAnnouncementForm /></RequireAuth>} />
                    <Route path="gallery"                element={<RequireAuth roles={["admin"]}><AdminGallery /></RequireAuth>} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
}
