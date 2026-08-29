import { useAppColors } from "#mobile/ui/theme";

export function useStackScreenOptions(backgroundColor?: string) {
  const colors = useAppColors();
  const resolvedBackgroundColor = backgroundColor ?? colors.background;

  return {
    contentStyle: { backgroundColor: resolvedBackgroundColor },
    headerBackButtonDisplayMode: "minimal" as const,
    headerBackButtonMenuEnabled: true,
    headerLargeTitleStyle: { color: colors.foreground },
    headerTintColor: colors.primary,
    headerTitleStyle: { color: colors.foreground },
    scrollEdgeEffects: { top: "soft" as const },
  };
}
