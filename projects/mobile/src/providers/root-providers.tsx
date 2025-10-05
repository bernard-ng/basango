import type React from "react";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/providers/auth-provider";
import { FontsLoaderProvider } from "@/providers/fonts-loader-provider";
import { NetworkProvider } from "@/providers/network-provider";
import { TamaguiConfigProvider } from "@/providers/tamagui-config-provider";
import { TanstackQueryProvider } from "@/providers/tanstack-query-provider";

export const RootProviders = ({ children }: React.PropsWithChildren) => (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <TanstackQueryProvider>
            <SafeAreaProvider>
                <FontsLoaderProvider>
                    <TamaguiConfigProvider>
                        <NetworkProvider>
                            <AuthProvider>{children}</AuthProvider>
                        </NetworkProvider>
                    </TamaguiConfigProvider>
                </FontsLoaderProvider>
            </SafeAreaProvider>
        </TanstackQueryProvider>
    </GestureHandlerRootView>
);
