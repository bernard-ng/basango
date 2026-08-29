import { Link } from "expo-router";
import { BookmarkIcon, ChevronRightIcon, Globe2Icon, LockIcon } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { XStack, YStack } from "tamagui";

import type { Bookmark } from "#mobile/features/content/types";
import { Text } from "#mobile/ui/components/text";
import { useAppColors } from "#mobile/ui/theme";

type BookmarkCardProps = {
  bookmark: Bookmark;
  showSeparator?: boolean;
};

export function BookmarkCard({ bookmark, showSeparator = false }: BookmarkCardProps) {
  const colors = useAppColors();

  return (
    <Link asChild href={{ params: { id: bookmark.id }, pathname: "/(app)/(tabs)/bookmarks/[id]" }}>
      <XStack
        alignItems="center"
        borderBottomColor="$separator"
        borderBottomWidth={showSeparator ? StyleSheet.hairlineWidth : 0}
        gap="$4"
        paddingHorizontal="$4"
        paddingVertical="$3"
        pressStyle={{ opacity: 0.72 }}
      >
        <YStack
          alignItems="center"
          backgroundColor="$surface"
          borderRadius="$5"
          height={52}
          justifyContent="center"
          width={52}
        >
          <BookmarkIcon color={colors.primary} size={23} strokeWidth={1.8} />
        </YStack>
        <YStack flex={1} gap="$1">
          <Text numberOfLines={1} variant="title">
            {bookmark.name}
          </Text>
          <XStack alignItems="center" gap="$2">
            <Text variant="caption">{bookmark.articlesCount} articles</Text>
            {bookmark.isPublic ? (
              <Globe2Icon color={colors.muted} size={14} strokeWidth={1.8} />
            ) : (
              <LockIcon color={colors.muted} size={14} strokeWidth={1.8} />
            )}
          </XStack>
        </YStack>
        <ChevronRightIcon color={colors.muted} size={20} strokeWidth={1.8} />
      </XStack>
    </Link>
  );
}
