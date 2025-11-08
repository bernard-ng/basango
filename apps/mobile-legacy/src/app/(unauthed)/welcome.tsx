import { Link, useRouter } from "expo-router";
import { Button, YStack } from "tamagui";

import { AppIcon } from "@/ui/components/AppIcon";
import { ScreenView } from "@/ui/components/layout";
import { Caption, Display, Text } from "@/ui/components/typography";

export default function Welcome() {
  const router = useRouter();

  return (
    <ScreenView justifyContent="center">
      <AppIcon height={120} width={120} />
      <YStack gap="$6" width="100%">
        <YStack gap="$3">
          <Display textAlign="center">Bienvenue sur Basango</Display>
          <Text lineHeight="$1" marginTop="auto" textAlign="center">
            La première plateforme d&#39;actualités intelligente qui vous aide à rester informé sur
            congolaise et internationale.
          </Text>
        </YStack>

        <YStack gap="$4">
          <Button fontWeight="bold" onPress={() => router.push("/signin")} theme="accent">
            Se connecter
          </Button>
          <Link asChild href="/signup">
            <Text textAlign="center">Ouvrir un compte</Text>
          </Link>
        </YStack>

        <Caption textAlign="center">
          En continuant, vous acceptez les conditions d&#39;utilisation de Basango et reconnaissez
          avoir lu notre politique de confidentialité.
        </Caption>
      </YStack>
    </ScreenView>
  );
}
