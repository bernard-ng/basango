import React from "react";

import { Plus, Search } from "@tamagui/lucide-icons";
import { YStack } from "tamagui";

import { useBookmarkList } from "@/api/request/feed-management/bookmark";
import { Bookmark } from "@/api/schema/feed-management/bookmark";
import { useFlattenedItems } from "@/hooks/use-flattened-items";
import { BookmarkList } from "@/ui/components/content/bookmark";
import { IconButton } from "@/ui/components/controls/IconButton";
import { ScreenView } from "@/ui/components/layout";
import { LoadingView } from "@/ui/components/LoadingView";

export default function Index() {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useBookmarkList();
    const bookmarks: Bookmark[] = useFlattenedItems(data);

    return (
        <ScreenView>
            <ScreenView.Heading
                title="Bookmarks"
                leadingAction={<IconButton onPress={() => {}} icon={<Plus size="$1" />} />}
                trailingActions={<IconButton onPress={() => {}} icon={<Search size="$1" />} />}
            />

            <YStack width="100%">
                {isLoading && <LoadingView />}
                {!isLoading && (
                    <BookmarkList
                        data={bookmarks}
                        refreshing={isLoading}
                        onRefresh={refetch}
                        infiniteScroll={true}
                        hasNextPage={hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        fetchNextPage={fetchNextPage}
                    />
                )}
            </YStack>
        </ScreenView>
    );
}
