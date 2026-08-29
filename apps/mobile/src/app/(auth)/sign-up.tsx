import { signUpSchema } from "@basango/domain/models";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, YStack } from "tamagui";
import type z from "zod";

import { authClient } from "#mobile/application/auth/auth-client";
import { getAuthErrorMessage } from "#mobile/features/identity/auth/auth-error";
import { Button } from "#mobile/ui/components/button";
import { Input } from "#mobile/ui/components/input";
import { PasswordInput } from "#mobile/ui/components/password-input";
import { KeyboardScreen } from "#mobile/ui/components/screen";
import { Text } from "#mobile/ui/components/text";

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUpRoute() {
  const form = useForm<SignUpForm>({
    defaultValues: { email: "", name: "", password: "" },
    mode: "onChange",
    resolver: zodResolver(signUpSchema),
  });
  const error = form.formState.errors.root?.message;

  async function handleSignUp(values: SignUpForm) {
    form.clearErrors("root");

    const result = await authClient.signUp.email(values);

    if (result.error) {
      form.setError("root", {
        message: getAuthErrorMessage(result.error, "Impossible de créer votre compte."),
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
          <Text>Rejoignez la communauté Basango et restez informé des dernières actualités.</Text>

          <YStack gap="$2">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Input
                  autoComplete="name"
                  error={fieldState.error?.message}
                  label="Nom complet"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Votre nom"
                  value={field.value}
                />
              )}
            />
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
                  autoComplete="new-password"
                  error={fieldState.error?.message}
                  label="Mot de passe"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="8 caractères minimum"
                  value={field.value}
                />
              )}
            />

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

          <Link asChild href="/(auth)/sign-in">
            <Text>Vous avez un compte ? Connectez-vous</Text>
          </Link>
        </YStack>

        <Button
          disabled={!form.formState.isValid}
          isLoading={form.formState.isSubmitting}
          onPress={form.handleSubmit(handleSignUp)}
        >
          Créer un compte
        </Button>
      </ScrollView>
    </KeyboardScreen>
  );
}
