import { XStack } from "tamagui";

import type { ArticleOverview } from "#mobile/features/content/types";
import { SourceAvatar } from "#mobile/ui/components/source-avatar";
import { Text } from "#mobile/ui/components/text";

type SourceReferenceProps = {
  source: ArticleOverview["source"];
};

export function SourceReference({ source }: SourceReferenceProps) {
  return (
    <XStack alignItems="center" gap="$2">
      <SourceAvatar name={source.displayName ?? source.name} size="small" />
      <Text fontSize="$2" fontWeight="bold" maxWidth={176} numberOfLines={1}>
        {source.displayName ?? source.name}
      </Text>
    </XStack>
  );
}
