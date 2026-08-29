import { loginSchema } from "@basango/domain/models";
import { Link } from "expo-router";
import { Controller } from "react-hook-form";
import { ScrollView, YStack } from "tamagui";
import type z from "zod";

import { authClient } from "#mobile/application/auth/auth-client";
import { useZodForm } from "#mobile/application/hooks/use-zod-form";
import { getAuthErrorMessage } from "#mobile/features/identity/auth/auth-error";
import { Button } from "#mobile/ui/components/button";
import { Input } from "#mobile/ui/components/input";
import { PasswordInput } from "#mobile/ui/components/password-input";
import { KeyboardScreen } from "#mobile/ui/components/screen";
import { Text } from "#mobile/ui/components/text";

type LoginForm = z.infer<typeof loginSchema>;

export function SignInScreen() {
  const form = useZodForm(loginSchema, {
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });
  const error = form.formState.errors.root?.message;

  async function handleSignIn(values: LoginForm) {
    form.clearErrors("root");

    const result = await authClient.signIn.email(values);

    if (result.error) {
      form.setError("root", {
        message: getAuthErrorMessage(
          result.error,
          "Vérifiez votre adresse e-mail et votre mot de passe.",
        ),
      });
    }
  }

  return (
    <KeyboardScreen hasNativeHeader>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          gap: 16,
          justifyContent: "space-between",
          paddingBottom: 24,
          paddingHorizontal: 16,
          paddingTop: 20,
        }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <YStack flex={1} gap="$4">
          <Text>Bienvenue sur Basango, la plateforme d’actualités intelligente.</Text>

          <YStack gap="$2">
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Input
                  autoCapitalize="none"
                  autoComplete="email"
                  error={fieldState.error?.message}
                  keyboardType="email-address"
                  label="Adresse e-mail"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="vous@exemple.com"
                  value={field.value}
                />
              )}
            />
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <PasswordInput
                  error={fieldState.error?.message}
                  label="Mot de passe"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Votre mot de passe"
                  value={field.value}
                />
              )}
            />

            <Link asChild href="/(auth)/forgot-password">
              <Text color="$primary">Mot de passe oublié ?</Text>
            </Link>

            {error ? (
              <Text color="$danger" variant="caption">
                {error}
              </Text>
            ) : null}
          </YStack>

          <Text variant="caption">
            En continuant, vous acceptez les conditions d’utilisation de Basango et reconnaissez
            avoir lu notre politique de confidentialité.
          </Text>

          <Link asChild href="/(auth)/sign-up">
            <Text>Vous n’avez pas de compte ? Créer un compte</Text>
          </Link>
        </YStack>

        <Button
          disabled={!form.formState.isValid}
          isLoading={form.formState.isSubmitting}
          onPress={form.handleSubmit(handleSignIn)}
        >
          Se connecter
        </Button>
      </ScrollView>
    </KeyboardScreen>
  );
}
