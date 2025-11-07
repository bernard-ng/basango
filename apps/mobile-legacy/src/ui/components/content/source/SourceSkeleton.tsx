import React, { useCallback } from "react";

import ContentLoader, { Circle, Rect } from "react-content-loader/native";
import { FlatList } from "react-native";
import { YStack } from "tamagui";

import { SourceList } from "@/ui/components/content/source/SourceList";

const data: number[] = new Array(5).fill(0);

type SourceSkeletonListProps = {
    horizontal?: boolean;
};

const VerticalSkeleton = (props: any) => (
    <ContentLoader
        speed={1.5}
        backgroundColor="#D4D5D8"
        foregroundColor="white"
        height={70}
        animate={true}
        width="100%"
        {...props}
    >
        <Circle cx="25" cy="30" r="25" />
        <Rect x="70" y="10" rx="4" ry="4" width="25%" height="10" />
        <Rect x="70" y="40" rx="4" ry="4" width="45%" height="10" />
        <Rect x="280" y="15" rx="4" ry="4" width="20%" height="30" />
    </ContentLoader>
);

const HorizontalSkeleton = (props: any) => (
    <ContentLoader
        speed={1.5}
        backgroundColor="#D4D5D8"
        foregroundColor="white"
        height={180}
        animate={true}
        width={110}
        {...props}
    >
        <Circle cx="60" cy="40" r="33" />
        <Rect x="10" y="85" rx="4" ry="4" width="100" height="10" />
        <Rect x="25" y="105" rx="8" ry="8" width="70" height="25" />
    </ContentLoader>
);

const keyExtractor = (_: number, index: number) => index.toString();

const selectSkeletonComponent = (horizontal: boolean) => {
    return horizontal ? (
        <HorizontalSkeleton />
    ) : (
        <YStack width="100%">
            <VerticalSkeleton />
        </YStack>
    );
};

export const SourceSkeletonList = (props: SourceSkeletonListProps) => {
    const { horizontal = false } = props;

    const ItemSeparator = horizontal ? SourceList.HorizontalSeparator : SourceList.VerticalSeparator;

    const renderItem = useCallback(() => {
        return selectSkeletonComponent(horizontal);
    }, [horizontal]);

    return (
        <FlatList
            data={data}
            scrollEnabled={false}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={ItemSeparator}
            horizontal={horizontal}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 0 }}
            removeClippedSubviews={true}
        />
    );
};
