import { endpoint } from "@/api/endpoint";
import {
    RequestPasswordPayload,
    ResetPasswordPayload,
    UpdatePasswordPayload,
} from "@/api/schema/identity-and-access/password";
import { usePostQuery, usePutQuery } from "@/api/shared";

export const usePasswordForgotten = () => {
    return usePostQuery<RequestPasswordPayload>(endpoint.identityAndAccess.requestPassword);
};

export const usePasswordReset = (token: string) => {
    return usePostQuery<ResetPasswordPayload>(endpoint.identityAndAccess.resetPassword(token));
};

export const usePasswordUpdate = () => {
    return usePutQuery<UpdatePasswordPayload>(endpoint.identityAndAccess.updatePassword);
};
