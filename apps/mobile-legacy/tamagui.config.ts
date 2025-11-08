import { defaultConfig } from "@tamagui/config/v4";
import { createTamagui } from "tamagui";

import { themes } from "./themes";

export const config = createTamagui({
  ...defaultConfig,
  themes,
});
