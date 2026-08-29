import { useSourceFollowAction } from "#mobile/features/content/sources/hooks/use-source-follow-action";
import type { Source } from "#mobile/features/content/types";
import { Button } from "#mobile/ui/components/button";

type FollowButtonProps = {
  presentation?: "compact" | "regular";
  source: Pick<Source, "followed" | "id">;
};

export function FollowButton({ presentation = "compact", source }: FollowButtonProps) {
  const followAction = useSourceFollowAction(source);
  const isRegular = presentation === "regular";

  return (
    <Button
      flex={isRegular ? 1 : undefined}
      height={isRegular ? 44 : 30}
      hitSlop={{ bottom: 8, left: 4, right: 4, top: 8 }}
      isLoading={followAction.isPending}
      minHeight={isRegular ? 44 : 30}
      minWidth={isRegular ? 0 : 80}
      onPress={followAction.toggleFollow}
      paddingHorizontal={isRegular ? "$4" : "$2"}
      size={isRegular ? "$4" : "$2"}
      variant={source.followed ? "outline" : "primary"}
    >
      {source.followed ? "Suivi" : "Suivre"}
    </Button>
  );
}
