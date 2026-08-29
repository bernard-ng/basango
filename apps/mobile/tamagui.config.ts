import { defaultConfig } from "@tamagui/config/v5";
import { createTamagui } from "tamagui";

const compactBodyFont = {
  ...defaultConfig.fonts.body,
  lineHeight: {
    1: 16,
    2: 18,
    3: 19,
    4: 20,
    5: 21,
    6: 24,
    7: 29,
    8: 34,
    9: 39,
    10: 50,
    11: 56,
    12: 62,
    13: 70,
    14: 80,
    15: 92,
    16: 104,
    true: 20,
  },
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 13,
    5: 14,
    6: 16,
    7: 19,
    8: 23,
    9: 26,
    10: 35,
    11: 40,
    12: 46,
    13: 53,
    14: 62,
    15: 75,
    16: 88,
    true: 13,
  },
} as const;

const themes = {
  dark: {
    ...defaultConfig.themes.dark,
    background: "#000000",
    card: "#1c1c1e",
    danger: "#ff453a",
    groupedBackground: "#000000",
    mutedColor: "#98989d",
    primary: "#0a84ff",
    primaryForeground: "#ffffff",
    separator: "#38383a",
    surface: "#1c1c1e",
  },
  light: {
    ...defaultConfig.themes.light,
    background: "#ffffff",
    card: "#ffffff",
    danger: "#ff3b30",
    groupedBackground: "#f2f2f7",
    mutedColor: "#6e6e73",
    primary: "#007aff",
    primaryForeground: "#ffffff",
    separator: "#c6c6c8",
    surface: "#f2f2f7",
  },
} as const;

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  fonts: {
    ...defaultConfig.fonts,
    body: compactBodyFont,
  },
  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: false,
  },
  themes,
});

type BasangoTamaguiConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends BasangoTamaguiConfig {}
}
