import { Stack } from "expo-router";

import { useStackScreenOptions } from "#mobile/ui/navigation/use-stack-screen-options";
import { useAppColors } from "#mobile/ui/theme";

export default function ArticlesLayout() {
  const colors = useAppColors();
  const screenOptions = useStackScreenOptions();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index">
        <Stack.Title
          large
          largeStyle={{ color: colors.foreground }}
          style={{ color: colors.foreground }}
        >
          Actualités
        </Stack.Title>
      </Stack.Screen>
      <Stack.Screen name="all">
        <Stack.Title
          large
          largeStyle={{ color: colors.foreground }}
          style={{ color: colors.foreground }}
        >
          Actualités
        </Stack.Title>
      </Stack.Screen>
      <Stack.Screen name="[id]" options={{ title: "" }} />
    </Stack>
  );
}
