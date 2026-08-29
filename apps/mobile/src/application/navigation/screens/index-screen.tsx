import { Redirect } from "expo-router";

import { authClient } from "#mobile/application/auth/auth-client";

export function IndexScreen() {
  const session = authClient.useSession();

  if (session.isPending) {
    return null;
  }

  return session.data ? (
    <Redirect href="/(app)/(tabs)/articles" />
  ) : (
    <Redirect href="/(auth)/welcome" />
  );
}
