import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// /api ve /static, Express backend'ine proxy'lenir.
// Aynı origin'den gibi davrandığı için cookie/CSRF sorun olmaz.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            "/api":    "http://localhost:3000",
            "/static": "http://localhost:3000"
        }
    }
});
