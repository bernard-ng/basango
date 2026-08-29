import { Stack } from "expo-router";

import { useStackScreenOptions } from "#mobile/ui/navigation/use-stack-screen-options";

export default function AuthLayout() {
  const screenOptions = useStackScreenOptions();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ title: "Connexion" }} />
      <Stack.Screen name="sign-up" options={{ title: "Créer un compte" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Mot de passe oublié" }} />
    </Stack>
  );
}
