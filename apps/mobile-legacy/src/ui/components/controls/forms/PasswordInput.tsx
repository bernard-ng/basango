import { Eye, EyeOff, Lock } from "@tamagui/lucide-icons";
import { useState } from "react";
import { XStack } from "tamagui";

import { Input, InputProps } from "@/ui/components/controls/forms/Input";
import { withController } from "@/ui/components/controls/forms/withController";

export const PasswordInput = (props: InputProps) => {
  const { label = "Mot de passe", onChangeText, caption, error, ...rest } = props;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      caption={caption}
      error={error}
      label={label}
      leadingAdornment={Lock}
      onChangeText={onChangeText}
      paddingRight="$6"
      placeholder="Mot de passe"
      secureTextEntry={!showPassword}
      trailingAdornment={
        <XStack
          hitSlop={{ bottom: 10, left: 10, right: 10, top: 10 }}
          onPress={() => setShowPassword(!showPassword)}
          paddingRight="$3"
        >
          {showPassword ? <Eye color="$gray9" size="$1" /> : <EyeOff color="$gray9" size="$1" />}
        </XStack>
      }
      {...rest}
    />
  );
};

export const FormPasswordInput = withController<InputProps>(PasswordInput);
