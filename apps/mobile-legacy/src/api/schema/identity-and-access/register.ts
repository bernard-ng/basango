import Joi from "joi";

export type RegisterPayload = {
    name: string;
    email: string;
    password: string;
};

export const RegisterPayloadSchema = Joi.object<RegisterPayload>({
    name: Joi.string().required().messages({
        "string.empty": "Le nom est requis",
        "any.required": "Le nom est requis",
    }),
    email: Joi.string().required().messages({
        "string.empty": "L'email est requis",
        "any.required": "L'email est requis",
    }),
    password: Joi.string().min(6).required().messages({
        "string.empty": "Le mot de passe est requis",
        "string.min": "Le mot de passe doit comporter au moins 4 caractères",
        "any.required": "Le mot de passe est requis",
    }),
});
