import { Spinner, YStack } from "tamagui";

import { Button } from "#mobile/ui/components/button";

type ArticleListFooterProps = {
  hasError: boolean;
  isLoading: boolean;
  onRetry: () => void;
};

export function ArticleListFooter({ hasError, isLoading, onRetry }: ArticleListFooterProps) {
  if (!hasError && !isLoading) {
    return null;
  }

  return (
    <YStack alignItems="center" paddingVertical="$4">
      {isLoading ? (
        <Spinner color="$primary" size="small" />
      ) : (
        <Button onPress={onRetry} size="$2" variant="ghost">
          Réessayer
        </Button>
      )}
    </YStack>
  );
}
