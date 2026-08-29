import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { authClient } from "#mobile/application/auth/auth-client";
import { RootProvider } from "#mobile/application/root-provider";
import { LoadingState } from "#mobile/ui/components/status-state";
import { useStackScreenOptions } from "#mobile/ui/navigation/use-stack-screen-options";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <RootProvider>
      <RootNavigator />
    </RootProvider>
  );
}

function RootNavigator() {
  const screenOptions = useStackScreenOptions();
  const session = authClient.useSession();

  useEffect(() => {
    if (!session.isPending) {
      void SplashScreen.hideAsync();
    }
  }, [session.isPending]);

  if (session.isPending) {
    return <LoadingState label="Ouverture de Basango…" />;
  }

  const isAuthenticated = Boolean(session.data);

  return (
    <Stack screenOptions={{ ...screenOptions, headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="reset-password"
        options={{ headerShown: true, title: "Nouveau mot de passe" }}
      />

      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
