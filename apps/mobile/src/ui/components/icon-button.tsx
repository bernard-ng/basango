import type { ReactNode } from "react";
import type { GetProps } from "tamagui";
import { Button as TamaguiButton } from "tamagui";

type IconButtonProps = Omit<GetProps<typeof TamaguiButton>, "children"> & {
  accessibilityLabel: string;
  children: ReactNode;
};

export function IconButton({ accessibilityLabel, children, ...props }: IconButtonProps) {
  return (
    <TamaguiButton
      accessibilityLabel={accessibilityLabel}
      accessibilityLargeContentTitle={accessibilityLabel}
      accessibilityRole="button"
      accessibilityShowsLargeContentViewer
      backgroundColor="transparent"
      borderWidth={0}
      circular
      height="$4"
      hitSlop={4}
      padding={0}
      pressStyle={{ backgroundColor: "$surface", opacity: 0.72, scale: 0.94 }}
      size="$4"
      width="$4"
      {...props}
    >
      {children}
    </TamaguiButton>
  );
}
