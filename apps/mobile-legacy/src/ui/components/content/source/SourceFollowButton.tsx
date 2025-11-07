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
                        text: "Annuler",
                        style: "cancel",
                    },
                    {
                        text: "Ne plus suivre",
                        style: "destructive",
                        onPress: () => {
                            unfollow();
                            setIsFollowed(prev => !prev);
                        },
                    },
                ],
                { cancelable: false }
            );
        } else {
            follow();
            setIsFollowed(prev => !prev);
        }
    }, [isFollowed, name, unfollow, follow, setIsFollowed]);

    return (
        <Button
            size="$2"
            theme={isFollowed ? "alt1" : "surface1"}
            chromeless={isFollowed}
            disabled={loading}
            onPress={handlePress}
            minWidth={80}
            paddingHorizontal="$2"
            {...rest}
        >
            {loading ? <ActivityIndicator /> : isFollowed ? "Suivi" : "Suivre"}
        </Button>
    );
};
