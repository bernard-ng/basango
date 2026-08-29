import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { getPublicApiUrl } from "#mobile/application/environment";

export const authClient = createAuthClient({
  baseURL: getPublicApiUrl(),
  plugins: [
    expoClient({
      scheme: "basango",
      storage: SecureStore,
      storagePrefix: "basango",
    }),
  ],
});
