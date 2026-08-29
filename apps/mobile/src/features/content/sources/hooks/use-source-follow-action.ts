import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

import { useTRPC } from "#mobile/application/trpc/client";
import type { Source } from "#mobile/features/content/types";

type SourceFollowActionSource = Pick<Source, "followed" | "id">;

export function useSourceFollowAction(source: SourceFollowActionSource) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  function invalidateSources() {
    void queryClient.invalidateQueries(trpc.feed.sources.list.queryFilter());
    void queryClient.invalidateQueries(trpc.feed.sources.get.queryFilter());
  }

  function showError(error: unknown) {
    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : "Impossible de modifier le suivi de cette source.";

    Alert.alert("Action impossible", message);
  }

  const follow = useMutation(
    trpc.feed.sources.follow.mutationOptions({
      onError: showError,
      onSuccess: invalidateSources,
    }),
  );
  const unfollow = useMutation(
    trpc.feed.sources.unfollow.mutationOptions({
      onError: showError,
      onSuccess: invalidateSources,
    }),
  );
  const action = source.followed ? unfollow : follow;

  function toggleFollow() {
    action.mutate({ id: source.id });
  }

  return {
    isPending: action.isPending,
    toggleFollow,
  };
}
