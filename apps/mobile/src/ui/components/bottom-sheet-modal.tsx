import type { ReactNode } from "react";
import { Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

import { Button } from "#mobile/ui/components/button";
import { Text } from "#mobile/ui/components/text";

type BottomSheetModalProps = {
  children: ReactNode;
  onClose: () => void;
  title: string;
  visible: boolean;
};

export function BottomSheetModal({ children, onClose, title, visible }: BottomSheetModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      accessibilityViewIsModal
      allowSwipeDismissal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <YStack backgroundColor="$groupedBackground" flex={1} paddingBottom={insets.bottom}>
        <XStack
          alignItems="center"
          backgroundColor="$card"
          borderBottomColor="$separator"
          borderBottomWidth={0.5}
          minHeight={52}
          paddingHorizontal="$1"
        >
          <Button
            color="$primary"
            minHeight={44}
            onPress={onClose}
            paddingHorizontal="$3"
            variant="ghost"
          >
            Annuler
          </Button>
          <Text
            fontSize="$5"
            fontWeight="600"
            left={80}
            numberOfLines={1}
            position="absolute"
            right={80}
            textAlign="center"
          >
            {title}
          </Text>
        </XStack>
        <YStack flex={1} paddingTop="$4">
          {children}
        </YStack>
      </YStack>
    </Modal>
  );
}
