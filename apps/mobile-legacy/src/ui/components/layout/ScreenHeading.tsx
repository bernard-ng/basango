import React from "react";

import { styled, View, XStack } from "tamagui";

import { Text } from "@/ui/components/typography";

const ActionContainer = styled(XStack, {
  alignItems: "center",
  gap: "$1",
  minWidth: "$5",
});

interface ScreenHeadingProps {
  leadingAction?: React.ReactNode;
  title?: string;
  trailingActions?: React.ReactNode | React.ReactNode[];
  paddingHorizontal?: number | string;
  marginBottom?: number | string;
}

export const ScreenHeading = (props: ScreenHeadingProps) => {
  const {
    leadingAction,
    title,
    trailingActions,
    paddingHorizontal = "$4",
    marginBottom = "$2",
  } = props;
  const trailingActionsArray = Array.isArray(trailingActions)
    ? trailingActions
    : trailingActions
      ? [trailingActions]
      : [];

  return (
    <XStack
      alignItems="center"
      backgroundColor="$background"
      height="$6"
      justifyContent="space-between"
      marginBottom={marginBottom}
      paddingHorizontal={paddingHorizontal}
    >
      <ActionContainer>{leadingAction}</ActionContainer>
      <XStack flex={1} justifyContent="center">
        {title ? (
          <Text fontSize="$6" fontWeight="600">
            {title}
          </Text>
        ) : (
          <View />
        )}
      </XStack>
      <ActionContainer>
        {trailingActionsArray.map((action, index) => (
          <React.Fragment key={index}>{action}</React.Fragment>
        ))}
      </ActionContainer>
    </XStack>
  );
};
