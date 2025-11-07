import type React from "react";

import { TamaguiProvider } from "tamagui";

import { config } from "~/tamagui.config";

export const TamaguiConfigProvider = ({ children }: React.PropsWithChildren) => (
    <TamaguiProvider config={config}>{children}</TamaguiProvider>
);
