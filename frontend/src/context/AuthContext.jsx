import { useState, useEffect, useCallback } from "react";
import AuthContext from "./authContext";
import authService from "../services/auth.service";
import userService from "../services/user.service";

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());

  const persistUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("user");
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await userService.getMyProfile();
      if (data?.user) {
        const synced = {
          id: data.user._id || data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          phone: data.user.phone || "",
          profileImage: data.user.profileImage || "",
          isActive: data.user.isActive,
        };
        persistUser(synced);
        return synced;
      }
    } catch {
      return null;
    }
    return null;
  }, [persistUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      persistUser(null);
    };

    window.addEventListener("gympro:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("gympro:unauthorized", handleUnauthorized);
  }, [persistUser]);

  useEffect(() => {
    let active = true;
    if (!user) return undefined;

    userService
      .getMyProfile()
      .then((data) => {
        if (!active || !data?.user) return;
        const synced = {
          id: data.user._id || data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          phone: data.user.phone || "",
          profileImage: data.user.profileImage || "",
          isActive: data.user.isActive,
        };
        persistUser(synced);
      })
      .catch(() => {
        // 401 is handled via gympro:unauthorized listener
      });

    return () => {
      active = false;
    };
    // Only sync once on mount if a cached user exists
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    (userData) => {
      persistUser(userData);
    },
    [persistUser]
  );

  const updateAuthUser = useCallback(
    (partial) => {
      setUser((prev) => {
        const updated = prev ? { ...prev, ...partial } : partial;
        if (updated) {
          localStorage.setItem("user", JSON.stringify(updated));
        }
        return updated;
      });
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Clear local session regardless of network failure
    } finally {
      persistUser(null);
    }
  }, [persistUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: false,
        login,
        logout,
        refreshUser,
        updateAuthUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
