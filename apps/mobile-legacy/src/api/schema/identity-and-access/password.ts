import Joi from "joi";

export type RequestPasswordPayload = {
    email: string;
};

export type ResetPasswordPayload = {
    password: string;
    confirm: string;
};

export type UpdatePasswordPayload = {
    current: string;
    password: string;
    confirm: string;
};

export const RequestPasswordPayloadSchema = Joi.object<RequestPasswordPayload>({
    email: Joi.string().required().messages({
        "string.empty": "L'email est requis",
        "any.required": "L'email est requis",
    }),
});

export const ResetPasswordPayloadSchema = Joi.object<ResetPasswordPayload>({
    password: Joi.string().min(6).required().messages({
        "string.empty": "Le mot de passe est requis",
        "string.min": "Le mot de passe doit comporter au moins 6 caractères",
        "any.required": "Le mot de passe est requis",
    }),
    confirm: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "Les mots de passe ne correspondent pas",
        "string.empty": "La confirmation du mot de passe est requise",
        "any.required": "La confirmation du mot de passe est requise",
    }),
});

export const UpdatePasswordPayloadSchema = Joi.object<UpdatePasswordPayload>({
    current: Joi.string().required().messages({
        "string.empty": "Le mot de passe actuel est requis",
        "any.required": "Le mot de passe actuel est requis",
    }),
    password: Joi.string().min(6).required().messages({
        "string.empty": "Le nouveau mot de passe est requis",
        "string.min": "Le nouveau mot de passe doit comporter au moins 6 caractères",
        "any.required": "Le nouveau mot de passe est requis",
    }),
    confirm: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "Les mots de passe ne correspondent pas",
        "string.empty": "La confirmation du nouveau mot de passe est requise",
        "any.required": "La confirmation du nouveau mot de passe est requise",
    }),
});
