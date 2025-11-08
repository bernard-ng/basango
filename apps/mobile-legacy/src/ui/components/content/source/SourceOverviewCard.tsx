import { Link } from "expo-router";
import { GetProps, XStack, YStack, styled } from "tamagui";

import { SourceOverview } from "@/api/schema/feed-management/source";
import { SourceFollowButton } from "@/ui/components/content/source/SourceFollowButton";
import { SourceProfileImage } from "@/ui/components/content/source/SourceProfileImage";
import { Text } from "@/ui/components/typography";

const SourceCardFrame = styled(YStack, {
  alignItems: "center",
  borderRadius: "$4",
  gap: "$2",

  variants: {
    horizontal: {
      false: {
        flexDirection: "row",
        gap: "$4",
        justifyContent: "space-between",
        paddingVertical: "$2",
        width: "100%",
      },
      true: {
        flexShrink: 0,
        maxWidth: 100,
      },
    },
  },
} as const);

type SourceCardProps = GetProps<typeof SourceCardFrame> & {
  data: SourceOverview;
  horizontal?: boolean;
};

export const SourceOverviewCard = (props: SourceCardProps) => {
  const { data, horizontal = true, ...rest } = props;

  const nameFontSize = horizontal ? "$3" : "$4";

  return (
    <SourceCardFrame horizontal={horizontal} {...rest}>
      <Link href={`/(authed)/(tabs)/sources/${data.name}`}>
        <SourceProfileImage image={data.image} name={data.name} size={horizontal ? 65 : 50} />
      </Link>

      <Link asChild href={`/(authed)/(tabs)/sources/${data.name}`}>
        {horizontal ? (
          <Text
            fontSize={nameFontSize}
            fontWeight="bold"
            maxWidth="100%"
            numberOfLines={1}
            textAlign="center"
          >
            {data.displayName ?? data.name}
          </Text>
        ) : (
          <YStack flex={1} gap="$1">
            <XStack alignItems="center" gap="$1">
              <Text fontSize={nameFontSize} fontWeight="bold" numberOfLines={1}>
                {data.displayName ?? data.name}
              </Text>
            </XStack>

            <Text color="$accent6" fontSize="$3" numberOfLines={1}>
              {data.url}
            </Text>
          </YStack>
        )}
      </Link>

      <SourceFollowButton
        followed={data.followed}
        id={data.id}
        name={data.displayName ?? data.name}
      />
    </SourceCardFrame>
  );
};
