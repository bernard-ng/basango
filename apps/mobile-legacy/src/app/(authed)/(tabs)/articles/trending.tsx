import { useRouter } from "expo-router";

import { useInfiniteArticleOverviewList } from "@/api/request/feed-management/article";
import { TrendingArticle } from "@/api/schema/feed-management/article";
import { useFlattenedItems } from "@/hooks/use-flattened-items";
import { ArticleList, ArticleSkeletonList } from "@/ui/components/content/article";
import { BackButton } from "@/ui/components/controls/BackButton";
import { ScreenView } from "@/ui/components/layout";

export default function Trending() {
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteArticleOverviewList({ limit: 20 });
  const articles: TrendingArticle[] = useFlattenedItems(data);

  return (
    <ScreenView paddingBottom={0}>
      <ScreenView.Heading
        leadingAction={<BackButton onPress={() => router.dismissTo("/(authed)/(tabs)/articles")} />}
        title="Actualités"
      />

      {isLoading && <ArticleSkeletonList displayMode="magazine" />}
      {!isLoading && (
        <ArticleList
          data={articles}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          infiniteScroll={true}
          isFetchingNextPage={isFetchingNextPage}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </ScreenView>
  );
}
