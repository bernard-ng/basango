import { ActivityIndicator } from "react-native";
import { Button, GetProps, styled } from "tamagui";

const StyledButton = styled(Button, {
  fontWeight: "bold",
  width: "100%",
});

type SubmitButtonProps = GetProps<typeof StyledButton> & {
  label: string;
  isValid: boolean;
  isPending: boolean;
};

export const SubmitButton = (props: SubmitButtonProps) => {
  const { isValid, isPending, label, ...rest } = props;

  return (
    <StyledButton
      disabled={isPending}
      fontWeight="bold"
      theme={!isValid || isPending ? "disabled" : "accent"}
      {...rest}
    >
      {isPending ? <ActivityIndicator /> : label}
    </StyledButton>
  );
};
