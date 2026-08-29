import { resetPasswordSchema } from "@basango/domain/models";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { YStack } from "tamagui";
import type z from "zod";

import { authClient } from "#mobile/application/auth/auth-client";
import { useZodForm } from "#mobile/application/hooks/use-zod-form";
import { Button } from "#mobile/ui/components/button";
import { PasswordInput } from "#mobile/ui/components/password-input";
import { KeyboardScreen } from "#mobile/ui/components/screen";
import { Text } from "#mobile/ui/components/text";

import { getAuthErrorMessage } from "../auth-error";

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const router = useRouter();
  const token = firstParam(params.token);
  const form = useZodForm(resetPasswordSchema, {
    defaultValues: { confirmPassword: "", password: "" },
    mode: "onChange",
  });
  const error = form.formState.errors.root?.message;

  async function handleReset(values: ResetPasswordForm) {
    if (!token) {
      form.setError("root", { message: "Ce lien de réinitialisation est incomplet." });
      return;
    }

    form.clearErrors("root");

    const result = await authClient.resetPassword({ newPassword: values.password, token });

    if (result.error) {
      form.setError("root", {
        message: getAuthErrorMessage(result.error, "Ce lien est invalide ou a expiré."),
      });
      return;
    }

    router.replace("/(auth)/sign-in");
  }

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
          <Text>Choisissez un mot de passe d’au moins huit caractères.</Text>

          <YStack gap="$2">
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <PasswordInput
                  autoComplete="new-password"
                  error={fieldState.error?.message}
                  label="Nouveau mot de passe"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  value={field.value}
                />
              )}
            />
            <Controller
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <PasswordInput
                  autoComplete="new-password"
                  error={fieldState.error?.message}
                  label="Confirmer le mot de passe"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
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
        </YStack>

        <Button
          disabled={!form.formState.isValid || !token}
          isLoading={form.formState.isSubmitting}
          onPress={form.handleSubmit(handleReset)}
        >
          Enregistrer le mot de passe
        </Button>
      </YStack>
    </KeyboardScreen>
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
