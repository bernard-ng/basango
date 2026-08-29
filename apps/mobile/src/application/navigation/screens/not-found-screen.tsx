import { useRouter } from "expo-router";

import { Button } from "#mobile/ui/components/button";
import { Screen } from "#mobile/ui/components/screen";
import { Text } from "#mobile/ui/components/text";

export function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen alignItems="center" gap="$4" justifyContent="center" paddingHorizontal="$8">
      <Text textAlign="center" variant="heading">
        Cette page n’existe pas
      </Text>
      <Text textAlign="center" variant="caption">
        Revenez aux actualités pour continuer.
      </Text>
      <Button onPress={() => router.replace("/")}>Retour à l’accueil</Button>
    </Screen>
  );
}
