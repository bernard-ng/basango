import { useRouter } from "expo-router";
import { YStack } from "tamagui";

import { Button } from "#mobile/ui/components/button";
import { LogoMark } from "#mobile/ui/components/logo-mark";
import { Screen } from "#mobile/ui/components/screen";
import { Text } from "#mobile/ui/components/text";

export function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen alignItems="center" gap="$4" justifyContent="center" paddingHorizontal="$4">
      <LogoMark />
      <YStack gap="$6" width="100%">
        <YStack gap="$3">
          <Text textAlign="center" variant="display">
            Bienvenue sur Basango
          </Text>
          <Text lineHeight="$1" marginTop="auto" textAlign="center">
            La première plateforme d’actualités intelligente qui vous aide à rester informé sur
            l’actualité congolaise et internationale.
          </Text>
        </YStack>

        <YStack gap="$4">
          <Button onPress={() => router.push("/(auth)/sign-in")}>Se connecter</Button>
          <Text onPress={() => router.push("/(auth)/sign-up")} textAlign="center">
            Ouvrir un compte
          </Text>
        </YStack>

        <Text textAlign="center" variant="caption">
          En continuant, vous acceptez les conditions d’utilisation de Basango et reconnaissez avoir
          lu notre politique de confidentialité.
        </Text>
      </YStack>
    </Screen>
  );
}
