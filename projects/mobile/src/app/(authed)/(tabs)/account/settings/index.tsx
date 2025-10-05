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
            onSuccess: () => authState.logout(),
            onError: () => authState.logout(),
        });
    };

    return (
        <ScreenView>
            <ScreenView.Heading title="Paramètres" />

            <YStack width="100%">
                <Button
                    disabled={isPending}
                    onPress={handleLogout}
                    theme={isPending ? "disabled" : "accent"}
                    fontWeight="bold"
                >
                    {isPending ? <ActivityIndicator /> : "Déconnexion"}
                </Button>
            </YStack>
        </ScreenView>
    );
}
