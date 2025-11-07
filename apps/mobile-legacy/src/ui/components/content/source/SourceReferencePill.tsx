import React from "react";

import { Link } from "expo-router";
import { Avatar, GetProps, XStack } from "tamagui";

import { SourceReference } from "@/api/schema/feed-management/source";
import { Text } from "@/ui/components/typography";

type SourceReferencePillProps = GetProps<typeof XStack> & {
    data: SourceReference;
};

export function SourceReferencePill(props: SourceReferencePillProps) {
    const { data, ...rest } = props;

    return (
        <Link href={`/(authed)/(tabs)/sources/${data.name}`}>
            <XStack alignItems="center" gap="$2" justifyContent="flex-start" {...rest}>
                <Avatar circular size="$1">
                    <Avatar.Image
                        accessibilityLabel={data.name}
                        objectFit="contain"
                        backgroundColor="white"
                        source={{
                            uri: data.image,
                            cache: "force-cache",
                        }}
                    />
                    <Avatar.Fallback backgroundColor="$gray10" />
                </Avatar>
                <Text size="$2" fontWeight="bold">
                    {data.displayName ?? data.name}
                </Text>
            </XStack>
        </Link>
    );
}
