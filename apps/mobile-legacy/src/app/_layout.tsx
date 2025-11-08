import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Theme } from "tamagui";

import { RootProviders } from "@/providers/root-providers";

export { ErrorBoundary } from "expo-router";

Sentry.init({
  debug: __DEV__,
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  spotlight: __DEV__,
  tracePropagationTargets: [/.*?/],
  tracesSampleRate: 1.0,
});

function RootLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <React.StrictMode>
      <RootProviders>
        <Theme name={colorScheme || "dark"}>
          <Stack screenOptions={{ headerShown: false }} />
          <Toast position="top" topOffset={insets.top + 10} visibilityTime={6_000} />
        </Theme>
      </RootProviders>
    </React.StrictMode>
  );
}

export default Sentry.wrap(RootLayout);
