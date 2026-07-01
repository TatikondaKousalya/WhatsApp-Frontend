import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authApi from "../api/auth";
// socket.js pulls in sockjs-client, which touches Node-style globals at
// import time. Loading it statically here would drag it into the bundle
// that's evaluated on every route, including /login. Instead we
// dynamic-import it lazily, only once we actually have a logged-in user.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketReady, setSocketReady] = useState(false);

  // On mount: if we have a token, try to load the current user.
  useEffect(() => {
    const hasToken = !!localStorage.getItem("accessToken");
    if (!hasToken) {
      setLoading(false);
      return;
    }
    authApi
      .getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Once we know who the user is, lazily load the socket module and open the
  // chat connection, then announce presence. The dynamic import() ensures
  // sockjs-client is only fetched/evaluated after login, never on /login.
  useEffect(() => {
    if (!user) return;

    let cleanup = () => {};
    let cancelled = false;

    import("../api/socket").then(({ connectSocket, disconnectSocket, sendPresence }) => {
      if (cancelled) return; // user logged out again before the chunk loaded

      connectSocket({
        onConnect: () => {
          setSocketReady(true);
          sendPresence("online", { userId: user.id, username: user.email, online: true });
        },
        onError: () => setSocketReady(false),
      });

      const handleUnload = () => {
        sendPresence("offline", { userId: user.id, username: user.email, online: false });
      };
      window.addEventListener("beforeunload", handleUnload);

      cleanup = () => {
        handleUnload();
        disconnectSocket();
        setSocketReady(false);
        window.removeEventListener("beforeunload", handleUnload);
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [user]);

  const login = useCallback(async (credentials) => {
    const auth = await authApi.login(credentials);
    setUser(auth.user);
    return auth;
  }, []);

  const register = useCallback(async (payload) => {
    const auth = await authApi.register(payload);
    setUser(auth.user);
    return auth;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, socketReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
