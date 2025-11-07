import * as SecureStore from "expo-secure-store";

export const getAccessToken = () => SecureStore.getItemAsync("user_access_token");
export const getRefreshToken = () => SecureStore.getItemAsync("user_refresh_token");

export const setTokens = async (access: string, refresh: string) => {
    try {
        await Promise.all([
            SecureStore.setItemAsync("user_access_token", access),
            SecureStore.setItemAsync("user_refresh_token", refresh),
        ]);
    } catch (error) {
        console.log(access, refresh);
        console.error("Unable to save auth tokens", error);
    }
};

export const clearTokens = async () => {
    try {
        await Promise.all([
            SecureStore.deleteItemAsync("user_access_token"),
            SecureStore.deleteItemAsync("user_refresh_token"),
        ]);
    } catch (error) {
        console.error("Unable to clear auth tokens", error);
    }
};
