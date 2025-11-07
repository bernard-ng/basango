import React, { useCallback } from "react";

import { ActivityIndicator, FlatList, FlatListProps } from "react-native";
import { YStack } from "tamagui";

import { Bookmark } from "@/api/schema/feed-management/bookmark";
import { BookmarkCard } from "@/ui/components/content/bookmark/BookmarkCard";
import { BookmarkEmptyState } from "@/ui/components/content/bookmark/BookmarkEmptyState";

const VerticalSeparator = () => <YStack height="$0.75" />;

const LoadingIndicator = () => (
    <>
        <YStack height="$1" />
        <ActivityIndicator />
        <YStack height="$1" />
    </>
);

type BookmarkListProps = Omit<FlatListProps<Bookmark>, "renderItem"> & {
    data: Bookmark[];
    infiniteScroll?: boolean;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage?: () => void;
};

type BookmarkListComponent = React.FC<BookmarkListProps> & {
    VerticalSeparator: typeof VerticalSeparator;
    LoadingIndicator: typeof LoadingIndicator;
};

const keyExtractor = (item: Bookmark) => item.id;

const renderItem = ({ item }: { item: Bookmark }) => {
    return <BookmarkCard data={item} />;
};

const BookmarkList: BookmarkListComponent = (props: BookmarkListProps) => {
    const { data, infiniteScroll = false, hasNextPage, isFetchingNextPage, fetchNextPage, refreshing, ...rest } = props;

    const handleOnEndReached = useCallback(async () => {
        if (infiniteScroll && hasNextPage && !isFetchingNextPage && fetchNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, infiniteScroll]);

    return (
        <FlatList
            {...rest}
            data={data}
            renderItem={renderItem}
            onEndReached={handleOnEndReached}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={VerticalSeparator}
            showsHorizontalScrollIndicator={false}
            initialNumToRender={5}
            onEndReachedThreshold={0.5}
            removeClippedSubviews={true}
            refreshing={refreshing}
            ListEmptyComponent={<BookmarkEmptyState />}
            ListFooterComponent={infiniteScroll && refreshing ? LoadingIndicator : undefined}
        />
    );
};

BookmarkList.VerticalSeparator = VerticalSeparator;
BookmarkList.LoadingIndicator = LoadingIndicator;

export { BookmarkList };
