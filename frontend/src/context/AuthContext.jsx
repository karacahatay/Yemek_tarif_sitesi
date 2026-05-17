import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiGet, apiPost } from "../api/client.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const data = await apiGet("/api/session");
            setUser(data.user);
        } catch {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        (async () => {
            await refresh();
            setLoading(false);
        })();

        const onUnauth = () => setUser(null);
        window.addEventListener("auth:unauthorized", onUnauth);
        return () => window.removeEventListener("auth:unauthorized", onUnauth);
    }, [refresh]);

    const login = async (email, password, hatirla) => {
        const data = await apiPost("/api/auth/login", { email, password, hatirla });
        setUser(data.user);
        return data.user;
    };

    const register = async (payload) => {
        await apiPost("/api/auth/register", payload);
    };

    const signout = async () => {
        try { await apiPost("/api/auth/signout"); } catch { /* ignore */ }
        setUser(null);
    };

    return (
        <AuthCtx.Provider value={{ user, loading, login, register, signout, refresh }}>
            {children}
        </AuthCtx.Provider>
    );
}

export function useAuth() {
    return useContext(AuthCtx);
}
