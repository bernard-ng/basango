import { YStack } from "tamagui";

import BookmarkIllustration from "@/assets/illustrations/BookmarkIllustration";
import { CreateBookmarkSheet } from "@/ui/components/content/bookmark/CreateBookmarkSheet";
import { Heading, Text } from "@/ui/components/typography";

export const BookmarkEmptyState = () => {
  return (
    <YStack alignItems="center" flex={1} gap="$2" justifyContent="center">
      <BookmarkIllustration height={250} width={250} />
      <Heading alignSelf="center">Empty Bookmarks</Heading>
      <Text textAlign="center">
        Create a bookmark to save your favorite articles and access them later.
      </Text>

      <CreateBookmarkSheet />
    </YStack>
  );
};
