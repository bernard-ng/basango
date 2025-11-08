import { useCallback } from "react";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";
import { Dimensions, FlatList } from "react-native";
import { View } from "tamagui";

import { ArticleList, ArticleListDisplayMode } from "@/ui/components/content/article/ArticleList";

const { width: screenWidth } = Dimensions.get("window");
const data: number[] = new Array(5).fill(0);

type ArticleSkeletonListProps = {
  horizontal?: boolean;
  displayMode?: ArticleListDisplayMode;
};

const OverviewCardSkeleton = (props: any) => (
  <ContentLoader
    animate={true}
    backgroundColor="#D4D5D8"
    foregroundColor="white"
    height={350}
    interval={0.3}
    speed={1}
    width="100%"
    {...props}
  >
    <Rect height="200" rx="8" ry="8" width="100%" x="0" y="0" />
    <Rect height="10" rx="4" ry="4" width="80%" x="0" y="216" />
    <Rect height="10" rx="4" ry="4" width="100%" x="0" y="232" />

    <Rect height="10" rx="4" ry="4" width="100%" x="0" y="256" />
    <Rect height="10" rx="4" ry="4" width="60%" x="0" y="272" />

    <Circle cx="10" cy="310" r="9" />
    <Rect height="10" rx="4" ry="4" width="15%" x="30" y="305" />
    <Rect height="10" rx="4" ry="4" width="20%" x="215" y="305" />
  </ContentLoader>
);

const MagazineCardSkeleton = (props: any) => (
  <ContentLoader
    animate={true}
    backgroundColor="#D4D5D8"
    foregroundColor="white"
    height={140}
    speed={1.5}
    width="100%"
    {...props}
  >
    <Rect height="90" rx="8" ry="8" width="120" x="235" y="0" />

    <Rect height="10" rx="4" ry="4" width="54%" x="0" y="0" />
    <Rect height="10" rx="4" ry="4" width="56%" x="0" y="16" />
    <Rect height="10" rx="4" ry="4" width="55%" x="0" y="40" />
    <Rect height="10" rx="4" ry="4" width="55%" x="0" y="56" />
    <Rect height="10" rx="4" ry="4" width="55%" x="0" y="72" />

    <Circle cx="10" cy="110" r="9" />
    <Rect height="10" rx="4" ry="4" width="15%" x="30" y="105" />
    <Rect height="10" rx="4" ry="4" width="40" x="315" y="105" />
  </ContentLoader>
);

const TextOnlyCardSkeleton = (props: any) => (
  <ContentLoader
    animate={true}
    backgroundColor="#D4D5D8"
    foregroundColor="white"
    height={150}
    speed={1.5}
    width="100%"
    {...props}
  >
    <Rect height="10" rx="4" ry="4" width="80%" x="0" y="16" />
    <Rect height="10" rx="4" ry="4" width="100%" x="0" y="32" />

    <Rect height="10" rx="4" ry="4" width="100%" x="0" y="56" />
    <Rect height="10" rx="4" ry="4" width="60%" x="0" y="72" />

    <Circle cx="10" cy="110" r="9" />
    <Rect height="10" rx="4" ry="4" width="15%" x="30" y="105" />
    <Rect height="10" rx="4" ry="4" width="20%" x="215" y="105" />
  </ContentLoader>
);

const keyExtractor = (_: number, index: number) => index.toString();

const selectSkeletonComponent = (displayMode: ArticleListDisplayMode) => {
  switch (displayMode) {
    case "magazine":
      return MagazineCardSkeleton;
    case "text-only":
      return TextOnlyCardSkeleton;
    default:
      return OverviewCardSkeleton;
  }
};

export const ArticleSkeletonList = (props: ArticleSkeletonListProps) => {
  const { horizontal = false, displayMode = "magazine" } = props;

  const ItemSeparator = horizontal
    ? ArticleList.HorizontalSeparator
    : ArticleList.VerticalSeparator;

  const renderItem = useCallback(() => {
    const itemWidth = horizontal ? screenWidth * 0.7 : screenWidth;
    const SkeletonComponent = selectSkeletonComponent(displayMode);

    return (
      <View style={{ width: itemWidth }}>
        <SkeletonComponent />
      </View>
    );
  }, [horizontal, displayMode]);

  return (
    <FlatList
      contentContainerStyle={{ paddingBottom: 0 }}
      data={data}
      horizontal={horizontal}
      ItemSeparatorComponent={ItemSeparator}
      keyExtractor={keyExtractor}
      removeClippedSubviews={true}
      renderItem={renderItem}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
    />
  );
};
