import { ActivityIndicator } from "react-native";
import { View } from "tamagui";

import { Caption } from "@/ui/components/typography";

export const LoadingView = () => (
  <View
    alignItems="center"
    backgroundColor="$background"
    flex={1}
    gap="$4"
    justifyContent="center"
    padding="$4"
  >
    <ActivityIndicator />
    <Caption>Chargement...</Caption>
  </View>
);
