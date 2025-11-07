import Joi from "joi";

export type LoginPayload = {
    username: string;
    password: string;
};

export type LoginResponse = {
    token: string;
    refresh_token: string;
};

export type RefreshTokenPayload = {
    refresh_token: string;
};

export type RefreshTokenResponse = {
    token: string;
};

export const LoginPayloadSchema = Joi.object<LoginPayload>({
    username: Joi.string().required().messages({
        "string.empty": "L'email est requis",
        "any.required": "L'email est requis",
    }),
    password: Joi.string().min(4).required().messages({
        "string.empty": "Le mot de passe est requis",
        "string.min": "Le mot de passe doit comporter au moins 4 caractères",
        "any.required": "Le mot de passe est requis",
    }),
});
