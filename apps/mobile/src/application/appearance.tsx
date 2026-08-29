import * as SecureStore from "expo-secure-store";
import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, useColorScheme } from "react-native";
import { TamaguiProvider } from "tamagui";

import { tamaguiConfig } from "../../tamagui.config";

export type AppearancePreference = "dark" | "light" | "system";

type AppearanceContextValue = {
  preference: AppearancePreference;
  resolvedScheme: "dark" | "light";
  setPreference: (preference: AppearancePreference) => void;
};

const appearanceStorageKey = "basango.appearance";
const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export const appearanceLabels: Record<AppearancePreference, string> = {
  dark: "Sombre",
  light: "Clair",
  system: "Système",
};

export function AppearanceProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<AppearancePreference>(getStoredPreference);

  useEffect(() => {
    Appearance.setColorScheme(preference === "system" ? "unspecified" : preference);
  }, [preference]);

  const setPreference = useCallback((nextPreference: AppearancePreference) => {
    setPreferenceState(nextPreference);
    void SecureStore.setItemAsync(appearanceStorageKey, nextPreference).catch(() => undefined);
  }, []);

  const resolvedScheme =
    preference === "dark" || preference === "light"
      ? preference
      : systemScheme === "dark"
        ? "dark"
        : "light";
  const value = useMemo(
    () => ({ preference, resolvedScheme, setPreference }),
    [preference, resolvedScheme, setPreference],
  );

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={resolvedScheme}>
      <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
    </TamaguiProvider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);

  if (!context) {
    throw new Error("useAppearance must be used inside AppearanceProvider");
  }

  return context;
}

function isAppearancePreference(value: string | null): value is AppearancePreference {
  return value === "dark" || value === "light" || value === "system";
}

function getStoredPreference(): AppearancePreference {
  try {
    const storedPreference = SecureStore.getItem(appearanceStorageKey);

    return isAppearancePreference(storedPreference) ? storedPreference : "system";
  } catch {
    return "system";
  }
}
