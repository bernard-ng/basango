import { Link } from "expo-router";
import { StyleSheet } from "react-native";
import { XStack, YStack } from "tamagui";

import { FollowButton } from "#mobile/features/content/sources/components/follow-button";
import type { Source } from "#mobile/features/content/types";
import { SourceAvatar } from "#mobile/ui/components/source-avatar";
import { Text } from "#mobile/ui/components/text";

type SourceCardProps = {
  horizontal?: boolean;
  showSeparator?: boolean;
  source: Source;
};

export function SourceCard({ horizontal = false, showSeparator = true, source }: SourceCardProps) {
  if (horizontal) {
    return (
      <YStack alignItems="center" flexShrink={0} gap="$2" maxWidth={100}>
        <Link asChild href={{ params: { id: source.id }, pathname: "/(app)/(tabs)/sources/[id]" }}>
          <YStack alignItems="center" gap="$2" pressStyle={{ opacity: 0.72 }}>
            <SourceAvatar name={source.displayName ?? source.name} size="large" />
            <Text
              fontSize="$3"
              fontWeight="bold"
              maxWidth="100%"
              numberOfLines={1}
              textAlign="center"
            >
              {source.displayName ?? source.name}
            </Text>
          </YStack>
        </Link>
        <FollowButton source={source} />
      </YStack>
    );
  }

  return (
    <XStack
      alignItems="center"
      borderBottomColor="$separator"
      borderBottomWidth={showSeparator ? StyleSheet.hairlineWidth : 0}
      gap="$4"
      paddingVertical="$2"
    >
      <Link asChild href={{ params: { id: source.id }, pathname: "/(app)/(tabs)/sources/[id]" }}>
        <XStack alignItems="center" flex={1} gap="$3" pressStyle={{ opacity: 0.72 }}>
          <SourceAvatar name={source.displayName ?? source.name} />
          <YStack flex={1} gap="$1">
            <Text fontSize="$4" fontWeight="bold" numberOfLines={1}>
              {source.displayName ?? source.name}
            </Text>
            <Text numberOfLines={1} variant="caption">
              {source.articlesCount} articles
            </Text>
          </YStack>
        </XStack>
      </Link>
      <FollowButton source={source} />
    </XStack>
  );
}
