import { useTheme } from "tamagui";

export function useAppColors() {
  const theme = useTheme();

  return {
    background: theme.background.val,
    border: theme.borderColor.val,
    foreground: theme.color.val,
    groupedBackground: theme.groupedBackground?.val ?? theme.background.val,
    muted: theme.mutedColor.val,
    primary: theme.primary.val,
    separator: theme.separator?.val ?? theme.borderColor.val,
  };
}
