import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        setIsLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = async () => {
        api.post("/auth/logout");
        setUser(null);
        localStorage.removeItem("user");
    };

    const value = {
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside AuthProvider");
    return context;
};

export { AuthProvider, useAuth };
