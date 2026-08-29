import type { ReactNode } from "react";
import type { GetProps } from "tamagui";
import { Spinner, Button as TamaguiButton, styled } from "tamagui";

const StyledButton = styled(TamaguiButton, {
  borderRadius: "$4",
  borderWidth: 0,

  defaultVariants: {
    variant: "primary",
  },
  fontSize: "$5",
  fontWeight: "600",
  minHeight: 44,
  paddingHorizontal: "$4",
  size: "$4",

  variants: {
    variant: {
      destructive: {
        backgroundColor: "$danger",
        color: "white",
        pressStyle: { opacity: 0.82, scale: 0.985 },
      },
      ghost: {
        backgroundColor: "transparent",
        color: "$color",
        pressStyle: { backgroundColor: "$surface", scale: 0.985 },
      },
      outline: {
        backgroundColor: "$card",
        borderColor: "$borderColor",
        borderWidth: 1,
        color: "$color",
        pressStyle: { backgroundColor: "$surface", scale: 0.985 },
      },
      primary: {
        backgroundColor: "$primary",
        color: "$primaryForeground",
        pressStyle: { opacity: 0.82, scale: 0.985 },
      },
      secondary: {
        backgroundColor: "$surface",
        color: "$color",
        pressStyle: { opacity: 0.78, scale: 0.985 },
      },
    },
  } as const,
});

type ButtonProps = Omit<GetProps<typeof StyledButton>, "children"> & {
  children: ReactNode;
  isLoading?: boolean;
};

export function Button({
  accessibilityState,
  children,
  disabled,
  isLoading = false,
  variant,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const resolvedVariant = variant ?? "primary";

  return (
    <StyledButton
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        busy: isLoading,
        disabled: Boolean(isDisabled),
      }}
      disabled={isDisabled}
      icon={
        isLoading ? (
          <Spinner
            color={
              resolvedVariant === "primary"
                ? "$primaryForeground"
                : resolvedVariant === "destructive"
                  ? "white"
                  : "$color"
            }
          />
        ) : undefined
      }
      opacity={isDisabled ? 0.38 : 1}
      variant={resolvedVariant}
      {...props}
    >
      {isLoading ? null : children}
    </StyledButton>
  );
}
