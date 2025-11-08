import { StatusBar } from "expo-status-bar";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, styled } from "tamagui";

import { ScreenHeading } from "@/ui/components/layout/ScreenHeading";
import { ScreenSection } from "@/ui/components/layout/ScreenSection";

type ScreenViewProps = React.ComponentProps<typeof YStack> & {
  showStatusBar?: boolean;
  statusBarStyle?: "auto" | "inverted" | "light" | "dark";
  statusBarBackgroundColor?: string;
  children?: React.ReactNode;
};

type ScreenViewComponent = React.FC<React.PropsWithChildren<ScreenViewProps>> & {
  Heading: typeof ScreenHeading;
  Section: typeof ScreenSection;
};

const ScreenContent = styled(YStack, {
  alignItems: "center",
  gap: "$4",
  paddingHorizontal: "$4",
});

const ScreenView: ScreenViewComponent = (props: React.PropsWithChildren<ScreenViewProps>) => {
  const {
    showStatusBar = true,
    statusBarStyle = "auto",
    statusBarBackgroundColor = "transparent",
    padding,
    children,
    ...rest
  } = props;
  const insets = useSafeAreaInsets();

  let headingElement: React.ReactNode | null = null;
  const otherChildren: React.ReactNode[] = [];

  // Iterate through children to find the Heading and separate others
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === ScreenView.Heading) {
        headingElement = child;
      } else {
        otherChildren.push(child);
      }
    } else {
      otherChildren.push(child);
    }
  });

  return (
    <>
      {showStatusBar ? (
        <StatusBar backgroundColor={statusBarBackgroundColor} style={statusBarStyle} />
      ) : null}

      <YStack backgroundColor="$background" flex={1} paddingTop={insets.top}>
        {headingElement}

        <ScreenContent
          flex={1}
          paddingBottom={insets.bottom}
          paddingHorizontal={padding ?? rest.paddingHorizontal ?? "$4"}
          {...rest}
        >
          {otherChildren}
        </ScreenContent>
      </YStack>
    </>
  );
};

ScreenView.Heading = ScreenHeading;
ScreenView.Section = ScreenSection;

export { ScreenView };
