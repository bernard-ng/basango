import { requestPasswordResetSchema } from "@basango/domain/models";
import { Link } from "expo-router";
import { Controller } from "react-hook-form";
import { YStack } from "tamagui";
import type z from "zod";

import { authClient } from "#mobile/application/auth/auth-client";
import { useZodForm } from "#mobile/application/hooks/use-zod-form";
import { getAuthErrorMessage } from "#mobile/features/identity/auth/auth-error";
import { Button } from "#mobile/ui/components/button";
import { Input } from "#mobile/ui/components/input";
import { KeyboardScreen } from "#mobile/ui/components/screen";
import { Text } from "#mobile/ui/components/text";

type ForgotPasswordForm = z.infer<typeof requestPasswordResetSchema>;

export function ForgotPasswordScreen() {
  const form = useZodForm(requestPasswordResetSchema, {
    defaultValues: { email: "" },
    mode: "onChange",
  });
  const message = form.formState.errors.root?.message;

  async function handleRequest(values: ForgotPasswordForm) {
    form.clearErrors("root");

    const result = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "basango://reset-password",
    });

    if (result.error) {
      form.setError("root", {
        message: getAuthErrorMessage(
          result.error,
          "Impossible d’envoyer le lien de réinitialisation.",
        ),
      });
      return;
    }

    form.setError("root", {
      message: "Si cette adresse est associée à un compte, un lien vient de vous être envoyé.",
      type: "success",
    });
  }

  const isSuccess = form.formState.errors.root?.type === "success";

  return (
    <KeyboardScreen hasNativeHeader>
      <YStack
        flex={1}
        gap="$4"
        justifyContent="space-between"
        paddingBottom="$6"
        paddingHorizontal="$4"
        paddingTop="$5"
      >
        <YStack flex={1} gap="$4">
          <Text>
            Veuillez entrer votre adresse e-mail pour recevoir un lien de réinitialisation de mot de
            passe.
          </Text>

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

          {message ? (
            <Text color={isSuccess ? "$primary" : "$danger"} variant="caption">
              {message}
            </Text>
          ) : null}

          <Link asChild href="/(auth)/sign-in">
            <Text>Vous avez déjà un compte ? Se connecter</Text>
          </Link>
        </YStack>

        <Button
          disabled={!form.formState.isValid}
          isLoading={form.formState.isSubmitting}
          onPress={form.handleSubmit(handleRequest)}
        >
          Réinitialiser le mot de passe
        </Button>
      </YStack>
    </KeyboardScreen>
  );
}
