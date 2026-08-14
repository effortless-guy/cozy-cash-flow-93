import { useState, useEffect } from "react";
import { getDBItem, setDBItem } from "./db";

export type AuthState = {
  pin: string | null;
  isEnabled: boolean;
};

export function useAuth() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAuth() {
      const data = await getDBItem<AuthState>("auth", "data");
      if (data) {
        setAuth(data);
        if (!data.isEnabled) {
          setIsAuthenticated(true);
        }
      } else {
        const defaultAuth: AuthState = { pin: null, isEnabled: false };
        await setDBItem("auth", "data", defaultAuth);
        setAuth(defaultAuth);
        setIsAuthenticated(true);
      }
      setLoading(false);
    }
    loadAuth();
  }, []);

  const enableLock = async (pin: string) => {
    const newAuth: AuthState = { pin, isEnabled: true };
    await setDBItem("auth", "data", newAuth);
    setAuth(newAuth);
    setIsAuthenticated(true);
  };

  const disableLock = async () => {
    const newAuth: AuthState = { pin: null, isEnabled: false };
    await setDBItem("auth", "data", newAuth);
    setAuth(newAuth);
    setIsAuthenticated(true);
  };

  const changePin = async (newPin: string) => {
    if (!auth) return;
    const newAuth: AuthState = { ...auth, pin: newPin };
    await setDBItem("auth", "data", newAuth);
    setAuth(newAuth);
  };

  const login = (pin: string) => {
    if (auth && auth.pin === pin) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (auth?.isEnabled) {
      setIsAuthenticated(false);
    }
  };

  return {
    auth,
    isAuthenticated,
    loading,
    enableLock,
    disableLock,
    changePin,
    login,
    logout,
  };
}
