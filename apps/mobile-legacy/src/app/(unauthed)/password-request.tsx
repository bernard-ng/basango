import React from "react";

import { joiResolver } from "@hookform/resolvers/joi";
import { Link, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import Toast from "react-native-toast-message";
import { YStack } from "tamagui";

import { usePasswordForgotten } from "@/api/request/identity-and-access/password";
import { RequestPasswordPayload, RequestPasswordPayloadSchema } from "@/api/schema/identity-and-access/password";
import { ErrorResponse, safeMessage } from "@/api/shared";
import { FormEmailInput } from "@/ui/components/controls/forms";
import { SubmitButton } from "@/ui/components/controls/SubmitButton";
import { ScreenView } from "@/ui/components/layout";
import { Heading, Text } from "@/ui/components/typography";

export default function PasswordRequest() {
    const { mutate, isPending } = usePasswordForgotten();
    const router = useRouter();

    const { control, handleSubmit, formState } = useForm<RequestPasswordPayload>({
        resolver: joiResolver(RequestPasswordPayloadSchema),
    });

    const onSubmit = (data: RequestPasswordPayload) => {
        mutate(data, {
            onSuccess: () => {
                Toast.show({
                    text1: "Succès",
                    text2: "Un mail avec les instructions vous a été envoyé",
                    type: "success",
                });
                router.push("/(unauthed)/signin");
            },
            onError: (error: ErrorResponse) => {
                Toast.show({
                    text1: "Erreur de connexion",
                    text2: safeMessage(error),
                    type: "error",
                });
            },
        });
    };

    return (
        <ScreenView>
            <YStack flex={1} gap="$4" width="100%" justifyContent="flex-start">
                <YStack gap="$4">
                    <Heading>Mot de passe oublié ?</Heading>
                    <Text>
                        Veuillez entrer votre adresse e-mail pour recevoir un lien de réinitialisation de mot de passe.
                    </Text>
                </YStack>

                <FormEmailInput control={control} name="email" />

                <Link href="/signin" asChild>
                    <Text>Vous avez pas de compte ? Se connecter</Text>
                </Link>
            </YStack>
            <SubmitButton
                label="Réinitialiser le mot de passe"
                onPress={handleSubmit(onSubmit)}
                isPending={isPending}
                isValid={formState.isValid}
            />
        </ScreenView>
    );
}
