import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { BookmarkPicker } from "#mobile/features/content/bookmarks/components/bookmark-picker";
import { ErrorState } from "#mobile/ui/components/status-state";

export function ArticleBookmarkPickerScreen() {
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
        <BookmarkPicker articleId={articleId} />
      ) : (
        <ErrorState description="Cet article est introuvable." />
      )}
    </>
  );
}
