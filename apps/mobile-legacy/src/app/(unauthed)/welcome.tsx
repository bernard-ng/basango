import { Link, useRouter } from "expo-router";
import { Button, YStack } from "tamagui";

import { AppIcon } from "@/ui/components/AppIcon";
import { ScreenView } from "@/ui/components/layout";
import { Caption, Display, Text } from "@/ui/components/typography";

export default function Welcome() {
    const router = useRouter();

    return (
        <ScreenView justifyContent="center">
            <AppIcon width={120} height={120} />
            <YStack width="100%" gap="$6">
                <YStack gap="$3">
                    <Display textAlign="center">Bienvenue sur Basango</Display>
                    <Text textAlign="center" lineHeight="$1" marginTop="auto">
                        La première plateforme d&#39;actualités intelligente qui vous aide à rester informé sur
                        congolaise et internationale.
                    </Text>
                </YStack>

                <YStack gap="$4">
                    <Button onPress={() => router.push("/signin")} theme="accent" fontWeight="bold">
                        Se connecter
                    </Button>
                    <Link href="/signup" asChild>
                        <Text textAlign="center">Ouvrir un compte</Text>
                    </Link>
                </YStack>

                <Caption textAlign="center">
                    En continuant, vous acceptez les conditions d&#39;utilisation de Basango et reconnaissez avoir lu
                    notre politique de confidentialité.
                </Caption>
            </YStack>
        </ScreenView>
    );
}
