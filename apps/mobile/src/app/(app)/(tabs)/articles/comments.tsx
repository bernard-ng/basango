import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { ArticleComments } from "#mobile/features/content/comments/components/article-comments";
import { ErrorState } from "#mobile/ui/components/status-state";

export default function ArticleCommentsRoute() {
  const { articleId } = useLocalSearchParams<{ articleId?: string }>();
  const router = useRouter();

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          accessibilityLabel="Fermer"
          icon="xmark"
          onPress={() => router.back()}
        />
      </Stack.Toolbar>
      {articleId ? (
        <ArticleComments articleId={articleId} enabled />
      ) : (
        <ErrorState description="Cet article est introuvable." />
      )}
    </>
  );
}
