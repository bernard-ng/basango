import { SplashScreen, useRouter } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/store/auth";

SplashScreen.preventAutoHideAsync();

type AuthState = {
  isReady: boolean;
  isLoggedIn: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  accessToken: string | null;
  refreshToken: string | null;
};

const AuthContext = createContext<AuthState>({
  accessToken: null,
  isLoggedIn: false,
  isReady: false,
  login: () => {},
  logout: () => {},
  refreshToken: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const router = useRouter();

  const isLoggedIn = !!(accessToken && refreshToken);

  const login = (access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    setTokens(access, refresh);
    router.replace("/(authed)/(tabs)/articles");
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    clearTokens();
    router.replace("/signin");
  };

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const [storedAccess, storedRefresh] = await Promise.all([
          getAccessToken(),
          getRefreshToken(),
        ]);

        if (storedAccess && storedRefresh) {
          setAccessToken(storedAccess);
          setRefreshToken(storedRefresh);
        }
      } catch (error) {
        console.error("Unable to retrieve auth tokens", error);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };
    loadTokens();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isLoggedIn,
        isReady,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
