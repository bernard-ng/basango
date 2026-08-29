import { Stack } from "expo-router";

import { fadeHeaderOptions } from "#mobile/ui/navigation/fade-header-options";
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
      <Stack.Screen name="[id]" options={{ ...fadeHeaderOptions, title: "" }} />
      <Stack.Screen
        name="bookmark-picker"
        options={{
          ...fadeHeaderOptions,
          presentation: "pageSheet",
          title: "Ajouter à un signet",
        }}
      />
      <Stack.Screen
        name="comments"
        options={{
          ...fadeHeaderOptions,
          presentation: "pageSheet",
          title: "Commentaires",
        }}
      />
    </Stack>
  );
}
