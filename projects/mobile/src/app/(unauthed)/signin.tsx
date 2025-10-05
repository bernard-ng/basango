import React from "react";

import { joiResolver } from "@hookform/resolvers/joi";
import { Link, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import Toast from "react-native-toast-message";
import { YStack } from "tamagui";

import { useLogin } from "@/api/request/identity-and-access/login";
import { LoginPayload, LoginPayloadSchema, LoginResponse } from "@/api/schema/identity-and-access/login";
import { ErrorResponse, safeMessage } from "@/api/shared";
import { useAuth } from "@/providers/auth-provider";
import { FormEmailInput, FormPasswordInput } from "@/ui/components/controls/forms";
import { SubmitButton } from "@/ui/components/controls/SubmitButton";
import { ScreenView } from "@/ui/components/layout";
import { Caption, Heading, Text } from "@/ui/components/typography";

export default function SignIn() {
    const { mutate, isPending } = useLogin();
    const auth = useAuth();
    const router = useRouter();

    if (auth.isLoggedIn) {
        router.replace("/(authed)/(tabs)/articles");
    }

    const { control, handleSubmit, formState } = useForm<LoginPayload>({
        resolver: joiResolver(LoginPayloadSchema),
    });

    const onSubmit = (data: LoginPayload) => {
        mutate(data, {
            onSuccess: async (data: LoginResponse) => {
                auth.login(data.token, data.refresh_token);
                Toast.show({ text1: "Connexion réussie", type: "success" });
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
                    <Heading>Connexion</Heading>
                    <Text>Bienvenue sur CongoNews, la plateforme d&#39;actualités intelligente</Text>
                </YStack>

                <YStack gap="$2">
                    <FormEmailInput control={control} name="username" />
                    <YStack gap="$2">
                        <FormPasswordInput control={control} name="password" />
                        <Link href="/password-request" asChild>
                            <Text color="$accent6"> Mot de passe oublié ?</Text>
                        </Link>
                    </YStack>
                </YStack>

                <Caption>
                    En continuant, vous acceptez les conditions d&#39;utilisation de CongoNews et reconnaissez avoir lu
                    notre politique de confidentialité.
                </Caption>
                <Link href="/signup" asChild>
                    <Text>Vous n&#39;avez pas de compte ? Créer un compte</Text>
                </Link>
            </YStack>
            <SubmitButton
                label="Se connecter"
                isPending={isPending}
                isValid={formState.isValid}
                onPress={handleSubmit(onSubmit)}
            />
        </ScreenView>
    );
}
