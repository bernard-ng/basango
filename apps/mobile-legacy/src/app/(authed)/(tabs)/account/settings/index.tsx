import { ActivityIndicator } from "react-native";
import { Button, YStack } from "tamagui";

import { useLogout } from "@/api/request/identity-and-access/login";
import { useAuth } from "@/providers/auth-provider";
import { ScreenView } from "@/ui/components/layout";

export default function Index() {
  const authState = useAuth();
  const { mutate, isPending } = useLogout();

  const handleLogout = async () => {
    mutate(undefined, {
      onError: () => authState.logout(),
      onSuccess: () => authState.logout(),
    });
  };

  return (
    <ScreenView>
      <ScreenView.Heading title="Paramètres" />

      <YStack width="100%">
        <Button
          disabled={isPending}
          fontWeight="bold"
          onPress={handleLogout}
          theme={isPending ? "disabled" : "accent"}
        >
          {isPending ? <ActivityIndicator /> : "Déconnexion"}
        </Button>
      </YStack>
    </ScreenView>
  );
}
