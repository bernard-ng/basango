import { joiResolver } from "@hookform/resolvers/joi";
import { Link, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import Toast from "react-native-toast-message";
import { YStack } from "tamagui";

import { useLogin } from "@/api/request/identity-and-access/login";
import {
  LoginPayload,
  LoginPayloadSchema,
  LoginResponse,
} from "@/api/schema/identity-and-access/login";
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
      onError: (error: ErrorResponse) => {
        Toast.show({
          text1: "Erreur de connexion",
          text2: safeMessage(error),
          type: "error",
        });
      },
      onSuccess: async (data: LoginResponse) => {
        auth.login(data.token, data.refresh_token);
        Toast.show({ text1: "Connexion réussie", type: "success" });
      },
    });
  };

  return (
    <ScreenView>
      <YStack flex={1} gap="$4" justifyContent="flex-start" width="100%">
        <YStack gap="$4">
          <Heading>Connexion</Heading>
          <Text>Bienvenue sur Basango, la plateforme d&#39;actualités intelligente</Text>
        </YStack>

        <YStack gap="$2">
          <FormEmailInput control={control} name="username" />
          <YStack gap="$2">
            <FormPasswordInput control={control} name="password" />
            <Link asChild href="/password-request">
              <Text color="$accent6"> Mot de passe oublié ?</Text>
            </Link>
          </YStack>
        </YStack>

        <Caption>
          En continuant, vous acceptez les conditions d&#39;utilisation de Basango et reconnaissez
          avoir lu notre politique de confidentialité.
        </Caption>
        <Link asChild href="/signup">
          <Text>Vous n&#39;avez pas de compte ? Créer un compte</Text>
        </Link>
      </YStack>
      <SubmitButton
        isPending={isPending}
        isValid={formState.isValid}
        label="Se connecter"
        onPress={handleSubmit(onSubmit)}
      />
    </ScreenView>
  );
}
