import React from "react";

import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Theme } from "tamagui";

import { RootProviders } from "@/providers/root-providers";

export { ErrorBoundary } from "expo-router";

Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,
    debug: __DEV__,
    tracesSampleRate: 1.0,
    tracePropagationTargets: [/.*?/],
    spotlight: __DEV__,
});

function RootLayout() {
    const colorScheme = useColorScheme();
    const insets = useSafeAreaInsets();

    return (
        <React.StrictMode>
            <RootProviders>
                <Theme name={colorScheme || "dark"}>
                    <Stack screenOptions={{ headerShown: false }} />
                    <Toast topOffset={insets.top + 10} position="top" visibilityTime={6_000} />
                </Theme>
            </RootProviders>
        </React.StrictMode>
    );
}

export default Sentry.wrap(RootLayout);
