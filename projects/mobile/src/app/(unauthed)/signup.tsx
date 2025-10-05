import React from "react";

import { joiResolver } from "@hookform/resolvers/joi";
import { User } from "@tamagui/lucide-icons";
import { Link, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import Toast from "react-native-toast-message";
import { YStack } from "tamagui";

import { useRegister } from "@/api/request/identity-and-access/register";
import { RegisterPayload, RegisterPayloadSchema } from "@/api/schema/identity-and-access/register";
import { ErrorResponse, safeMessage } from "@/api/shared";
import { FormEmailInput, FormPasswordInput, FormTextInput } from "@/ui/components/controls/forms";
import { SubmitButton } from "@/ui/components/controls/SubmitButton";
import { ScreenView } from "@/ui/components/layout";
import { Caption, Heading, Text } from "@/ui/components/typography";

export default function SingUp() {
    const router = useRouter();
    const { mutate, isPending } = useRegister();

    const { control, handleSubmit, formState } = useForm<RegisterPayload>({
        resolver: joiResolver(RegisterPayloadSchema),
    });

    const onSubmit = (data: RegisterPayload) => {
        mutate(data, {
            onSuccess: () => {
                Toast.show({
                    text1: "Félicitations !",
                    text2: "les détails de votre compte vous ont été envoyés par e-mail.",
                    type: "success",
                });
                router.replace("/(unauthed)/signin");
            },
            onError: (error: ErrorResponse) => {
                Toast.show({
                    text1: "Erreur",
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
                    <Heading>Inscription</Heading>
                    <Text>Rejoignez la communauté CongoNews et restez informé des dernières actualités</Text>
                </YStack>

                <YStack gap="$2">
                    <FormTextInput
                        control={control}
                        name="name"
                        leadingAdornment={User}
                        label="Nom complet"
                        placeholder="John Doe"
                    />
                    <FormEmailInput control={control} name="email" />
                    <FormPasswordInput control={control} name="password" />
                </YStack>
                <Caption>
                    En continuant, vous acceptez les conditions d&#39;utilisation de CongoNews et reconnaissez avoir lu
                    notre politique de confidentialité.
                </Caption>
                <Link href="/signin">
                    <Text>Vous avez un compte ? Connectez-vous</Text>
                </Link>
            </YStack>
            <SubmitButton
                label="Créer un compte"
                onPress={handleSubmit(onSubmit)}
                isPending={isPending}
                isValid={formState.isValid}
            />
        </ScreenView>
    );
}
