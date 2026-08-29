import { CheckIcon, ChevronRightIcon } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { XStack, YStack } from "tamagui";

import type { Bookmark } from "#mobile/features/content/types";
import { Text } from "#mobile/ui/components/text";
import { useAppColors } from "#mobile/ui/theme";

type BookmarkRowProps = {
  bookmark: Bookmark;
  disabled?: boolean;
  isSelected?: boolean;
  onPress: () => void;
  showDisclosure?: boolean;
  showSeparator?: boolean;
};

export function BookmarkRow({
  bookmark,
  disabled = false,
  isSelected = false,
  onPress,
  showDisclosure = false,
  showSeparator = false,
}: BookmarkRowProps) {
  const colors = useAppColors();

  return (
    <XStack
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: isSelected }}
      alignItems="center"
      borderBottomColor="$separator"
      borderBottomWidth={showSeparator ? StyleSheet.hairlineWidth : 0}
      disabled={disabled}
      minHeight={62}
      onPress={onPress}
      paddingHorizontal="$4"
      paddingVertical="$3"
      pressStyle={{ opacity: 0.72 }}
    >
      <YStack flex={1} gap="$1">
        <Text numberOfLines={1} variant="title">
          {bookmark.name}
        </Text>
        <Text variant="caption">{bookmark.articlesCount} articles</Text>
      </YStack>
      {isSelected ? (
        <CheckIcon color={colors.primary} size={21} strokeWidth={2.2} />
      ) : showDisclosure ? (
        <ChevronRightIcon color={colors.muted} size={20} strokeWidth={1.8} />
      ) : null}
    </XStack>
  );
}
