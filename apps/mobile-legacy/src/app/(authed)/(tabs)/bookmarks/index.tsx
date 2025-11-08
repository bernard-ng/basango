import { Plus, Search } from "@tamagui/lucide-icons";
import { YStack } from "tamagui";

import { useBookmarkList } from "@/api/request/feed-management/bookmark";
import { Bookmark } from "@/api/schema/feed-management/bookmark";
import { useFlattenedItems } from "@/hooks/use-flattened-items";
import { BookmarkList } from "@/ui/components/content/bookmark";
import { IconButton } from "@/ui/components/controls/IconButton";
import { LoadingView } from "@/ui/components/LoadingView";
import { ScreenView } from "@/ui/components/layout";

export default function Index() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useBookmarkList();
  const bookmarks: Bookmark[] = useFlattenedItems(data);

  return (
    <ScreenView>
      <ScreenView.Heading
        leadingAction={<IconButton icon={<Plus size="$1" />} onPress={() => {}} />}
        title="Bookmarks"
        trailingActions={<IconButton icon={<Search size="$1" />} onPress={() => {}} />}
      />

      <YStack width="100%">
        {isLoading && <LoadingView />}
        {!isLoading && (
          <BookmarkList
            data={bookmarks}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            infiniteScroll={true}
            isFetchingNextPage={isFetchingNextPage}
            onRefresh={refetch}
            refreshing={isLoading}
          />
        )}
      </YStack>
    </ScreenView>
  );
}
