import React, { useCallback } from "react";

import { ActivityIndicator, Dimensions, FlatList, FlatListProps } from "react-native";
import { View, XStack, YStack } from "tamagui";

import { ArticleOverview } from "@/api/schema/feed-management/article";
import { ArticleMagazineCard } from "@/ui/components/content/article/ArticleMagazineCard";
import { ArticleOverviewCard } from "@/ui/components/content/article/ArticleOverviewCard";
import { ArticleTextOnlyCard } from "@/ui/components/content/article/ArticleTextOnlyCard";
import { Text } from "@/ui/components/typography";

const { width: screenWidth } = Dimensions.get("window");

const HorizontalSeparator = () => <XStack width="$1" />;
const VerticalSeparator = () => <YStack height="$1" />;

const LoadingIndicator = () => (
    <>
        <YStack height="$1" />
        <ActivityIndicator />
        <YStack height="$1" />
    </>
);

export type ArticleListDisplayMode = "card" | "magazine" | "text-only";

type ArticleListProps = Omit<FlatListProps<ArticleOverview>, "renderItem"> & {
    data: ArticleOverview[];
    horizontal?: boolean;
    infiniteScroll?: boolean;
    displayMode?: ArticleListDisplayMode;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage?: () => void;
};

type ArticleListComponent = React.FC<ArticleListProps> & {
    HorizontalSeparator: typeof HorizontalSeparator;
    VerticalSeparator: typeof VerticalSeparator;
    LoadingIndicator: typeof LoadingIndicator;
};

const keyExtractor = (item: ArticleOverview) => item.id;

const selectDisplayComponent = (mode: ArticleListDisplayMode) => {
    switch (mode) {
        case "card":
            return ArticleOverviewCard;
        case "magazine":
            return ArticleMagazineCard;
        case "text-only":
            return ArticleTextOnlyCard;
        default:
            throw new Error(`Unknown display mode: ${mode}`);
    }
};

const ArticleList: ArticleListComponent = (props: ArticleListProps) => {
    const {
        data,
        displayMode = "magazine",
        horizontal = false,
        infiniteScroll = false,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        refreshing,
        ...rest
    } = props;

    const renderItem = useCallback(
        ({ item }: { item: ArticleOverview }) => {
            const itemWidth = horizontal ? screenWidth * 0.7 : undefined;
            const DisplayComponent = selectDisplayComponent(displayMode);

            return (
                <View style={{ width: itemWidth }}>
                    <DisplayComponent data={item} />
                </View>
            );
        },
        [horizontal, displayMode]
    );

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
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={horizontal ? HorizontalSeparator : VerticalSeparator}
            horizontal={horizontal}
            showsHorizontalScrollIndicator={false}
            initialNumToRender={5}
            onEndReachedThreshold={0.5}
            removeClippedSubviews={true}
            onEndReached={handleOnEndReached}
            refreshing={refreshing}
            ListFooterComponent={infiniteScroll ? LoadingIndicator : undefined}
            ListEmptyComponent={() => <Text>Pas d’articles disponibles pour le moment.</Text>}
        />
    );
};

ArticleList.HorizontalSeparator = HorizontalSeparator;
ArticleList.VerticalSeparator = VerticalSeparator;
ArticleList.LoadingIndicator = LoadingIndicator;

export { ArticleList };
