import { Stack } from "expo-router";

import { fadeHeaderOptions } from "#mobile/ui/navigation/fade-header-options";
import { useStackScreenOptions } from "#mobile/ui/navigation/use-stack-screen-options";
import { useAppColors } from "#mobile/ui/theme";

export default function BookmarksLayout() {
  const colors = useAppColors();
  const screenOptions = useStackScreenOptions(colors.groupedBackground);

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index">
        <Stack.Title
          large
          largeStyle={{ color: colors.foreground }}
          style={{ color: colors.foreground }}
        >
          Signets
        </Stack.Title>
      </Stack.Screen>
      <Stack.Screen name="[id]" options={{ ...fadeHeaderOptions, title: "" }} />
      <Stack.Screen
        name="form"
        options={{
          ...fadeHeaderOptions,
          presentation: "pageSheet",
          title: "Nouveau signet",
        }}
      />
    </Stack>
  );
}
