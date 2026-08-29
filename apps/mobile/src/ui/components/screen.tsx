import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { GetProps } from "tamagui";
import { YStack } from "tamagui";

type ScreenProps = GetProps<typeof YStack> & {
  children: ReactNode;
  hasNativeHeader?: boolean;
  hasTabBar?: boolean;
};

export function Screen({
  backgroundColor = "$background",
  children,
  hasNativeHeader = false,
  hasTabBar = false,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <YStack
      {...props}
      backgroundColor={backgroundColor}
      collapsable={hasNativeHeader ? false : props.collapsable}
      flex={1}
      paddingBottom={hasTabBar ? 0 : insets.bottom}
      paddingTop={hasNativeHeader ? 0 : insets.top}
    >
      {children}
    </YStack>
  );
}

type KeyboardScreenProps = ScreenProps;

export function KeyboardScreen({ children, ...props }: KeyboardScreenProps) {
  return (
    <Screen {...props}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {children}
      </KeyboardAvoidingView>
    </Screen>
  );
}
