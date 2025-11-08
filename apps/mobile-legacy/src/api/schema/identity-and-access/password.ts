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
    "any.required": "L'email est requis",
    "string.empty": "L'email est requis",
  }),
});

export const ResetPasswordPayloadSchema = Joi.object<ResetPasswordPayload>({
  confirm: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Les mots de passe ne correspondent pas",
    "any.required": "La confirmation du mot de passe est requise",
    "string.empty": "La confirmation du mot de passe est requise",
  }),
  password: Joi.string().min(6).required().messages({
    "any.required": "Le mot de passe est requis",
    "string.empty": "Le mot de passe est requis",
    "string.min": "Le mot de passe doit comporter au moins 6 caractères",
  }),
});

export const UpdatePasswordPayloadSchema = Joi.object<UpdatePasswordPayload>({
  confirm: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Les mots de passe ne correspondent pas",
    "any.required": "La confirmation du nouveau mot de passe est requise",
    "string.empty": "La confirmation du nouveau mot de passe est requise",
  }),
  current: Joi.string().required().messages({
    "any.required": "Le mot de passe actuel est requis",
    "string.empty": "Le mot de passe actuel est requis",
  }),
  password: Joi.string().min(6).required().messages({
    "any.required": "Le nouveau mot de passe est requis",
    "string.empty": "Le nouveau mot de passe est requis",
    "string.min": "Le nouveau mot de passe doit comporter au moins 6 caractères",
  }),
});
