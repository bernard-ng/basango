import { endpoint } from "@/api/endpoint";
import { RegisterPayload } from "@/api/schema/identity-and-access/register";
import { useGetQuery, usePostQuery } from "@/api/shared";

export const useRegister = () => {
    return usePostQuery<RegisterPayload>(endpoint.identityAndAccess.register);
};

export const useConfirmAccount = (token: string) => {
    return useGetQuery(endpoint.identityAndAccess.confirmAccount(token));
};
