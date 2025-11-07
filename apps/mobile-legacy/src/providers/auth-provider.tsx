import React, { createContext, useContext, useEffect, useState } from "react";

import { useRouter, SplashScreen } from "expo-router";

import { clearTokens, setTokens, getAccessToken, getRefreshToken } from "@/store/auth";

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
    isReady: false,
    isLoggedIn: false,
    login: () => {},
    logout: () => {},
    accessToken: null,
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
                const [storedAccess, storedRefresh] = await Promise.all([getAccessToken(), getRefreshToken()]);

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
                isReady,
                isLoggedIn,
                login,
                logout,
                accessToken,
                refreshToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
