import { useCallback, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { Button, GetProps } from "tamagui";

import { useFollowSource, useUnfollowSource } from "@/api/request/feed-management/source";

type SourceFollowButtonProps = GetProps<typeof Button> & {
  id: string;
  name: string;
  followed: boolean;
};

export const SourceFollowButton = (props: SourceFollowButtonProps) => {
  const { id, followed, name, ...rest } = props;
  const [isFollowed, setIsFollowed] = useState<boolean>(followed);
  const { mutate: follow, isPending: following } = useFollowSource(id);
  const { mutate: unfollow, isPending: unfollowing } = useUnfollowSource(id);
  const loading = following || unfollowing;

  const handlePress = useCallback(() => {
    if (isFollowed) {
      Alert.alert(
        "Confirmation",
        `Êtes-vous sûr de vouloir ne plus suivre ${name} ?`,
        [
          {
            style: "cancel",
            text: "Annuler",
          },
          {
            onPress: () => {
              unfollow();
              setIsFollowed((prev) => !prev);
            },
            style: "destructive",
            text: "Ne plus suivre",
          },
        ],
        { cancelable: false },
      );
    } else {
      follow();
      setIsFollowed((prev) => !prev);
    }
  }, [isFollowed, name, unfollow, follow]);

  return (
    <Button
      chromeless={isFollowed}
      disabled={loading}
      minWidth={80}
      onPress={handlePress}
      paddingHorizontal="$2"
      size="$2"
      theme={isFollowed ? "alt1" : "surface1"}
      {...rest}
    >
      {loading ? <ActivityIndicator /> : isFollowed ? "Suivi" : "Suivre"}
    </Button>
  );
};
