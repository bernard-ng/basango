import { endpoint } from "@/api/endpoint";
import { LoginPayload, LoginResponse } from "@/api/schema/identity-and-access/login";
import { useGetQuery, usePostQuery } from "@/api/shared";

export const useLogin = () => {
    return usePostQuery<LoginPayload, LoginResponse>(endpoint.identityAndAccess.login);
};

export const useLogout = () => {
    return usePostQuery(endpoint.identityAndAccess.logout);
};

export const useUnlockAccount = (token: string) => {
    return useGetQuery(endpoint.identityAndAccess.unlockAccount(token));
};
