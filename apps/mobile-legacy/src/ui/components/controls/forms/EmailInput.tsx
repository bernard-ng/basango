import { Mail } from "@tamagui/lucide-icons";

import { Input, InputProps } from "@/ui/components/controls/forms/Input";
import { withController } from "@/ui/components/controls/forms/withController";

export const EmailInput = (props: InputProps) => {
  const { label = "Email", caption, error, onChangeText, ...rest } = props;

  return (
    <Input
      autoCapitalize="none"
      autoCorrect={false}
      caption={caption}
      error={error}
      keyboardType="email-address"
      label={label}
      leadingAdornment={Mail}
      onChangeText={onChangeText}
      placeholder="votre@email.com..."
      {...rest}
    />
  );
};

export const FormEmailInput = withController<InputProps>(EmailInput);
