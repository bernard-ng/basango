import Joi from "joi";

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export const RegisterPayloadSchema = Joi.object<RegisterPayload>({
  email: Joi.string().required().messages({
    "any.required": "L'email est requis",
    "string.empty": "L'email est requis",
  }),
  name: Joi.string().required().messages({
    "any.required": "Le nom est requis",
    "string.empty": "Le nom est requis",
  }),
  password: Joi.string().min(6).required().messages({
    "any.required": "Le mot de passe est requis",
    "string.empty": "Le mot de passe est requis",
    "string.min": "Le mot de passe doit comporter au moins 4 caractères",
  }),
});
