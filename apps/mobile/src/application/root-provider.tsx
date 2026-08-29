import { focusManager, onlineManager } from "@tanstack/react-query";
import * as Network from "expo-network";
import type { PropsWithChildren } from "react";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppearanceProvider } from "#mobile/application/appearance";
import { DataProvider } from "#mobile/application/trpc/client";

focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener("change", (state) => {
    handleFocus(state === "active");
  });

  return () => subscription.remove();
});

onlineManager.setEventListener((setOnline) => {
  const subscription = Network.addNetworkStateListener((state) => {
    setOnline(Boolean(state.isConnected));
  });

  return () => subscription.remove();
});

export function RootProvider(props: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppearanceProvider>
        <SafeAreaProvider>
          <DataProvider>{props.children}</DataProvider>
        </SafeAreaProvider>
      </AppearanceProvider>
    </GestureHandlerRootView>
  );
}
