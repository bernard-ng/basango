import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "#mobile/application/trpc/client";
import type { Source } from "#mobile/features/content/types";
import { Button } from "#mobile/ui/components/button";

type FollowButtonProps = {
  presentation?: "compact" | "regular";
  source: Pick<Source, "followed" | "id">;
};

export function FollowButton({ presentation = "compact", source }: FollowButtonProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const follow = useMutation(
    trpc.feed.sources.follow.mutationOptions({
      onSuccess: invalidateSources,
    }),
  );
  const unfollow = useMutation(
    trpc.feed.sources.unfollow.mutationOptions({
      onSuccess: invalidateSources,
    }),
  );

  function invalidateSources() {
    void queryClient.invalidateQueries(trpc.feed.sources.list.queryFilter());
    void queryClient.invalidateQueries(trpc.feed.sources.get.queryFilter());
  }

  const action = source.followed ? unfollow : follow;
  const isRegular = presentation === "regular";

  return (
    <Button
      flex={isRegular ? 1 : undefined}
      height={isRegular ? 44 : 30}
      hitSlop={{ bottom: 8, left: 4, right: 4, top: 8 }}
      isLoading={action.isPending}
      minHeight={isRegular ? 44 : 30}
      minWidth={isRegular ? 0 : 80}
      onPress={() => action.mutate({ id: source.id })}
      paddingHorizontal={isRegular ? "$4" : "$2"}
      size={isRegular ? "$4" : "$2"}
      variant={source.followed ? "outline" : "primary"}
    >
      {source.followed ? "Suivi" : "Suivre"}
    </Button>
  );
}
