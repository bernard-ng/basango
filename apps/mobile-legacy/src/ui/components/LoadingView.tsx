import { ActivityIndicator } from "react-native";
import { View } from "tamagui";

import { Caption } from "@/ui/components/typography";

export const LoadingView = () => (
    <View flex={1} padding="$4" backgroundColor="$background" alignItems="center" justifyContent="center" gap="$4">
        <ActivityIndicator />
        <Caption>Chargement...</Caption>
    </View>
);
