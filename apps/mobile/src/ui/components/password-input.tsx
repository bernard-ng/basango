import { EyeIcon, EyeOffIcon } from "lucide-react-native";
import { useState } from "react";

import { IconButton } from "#mobile/ui/components/icon-button";
import type { InputProps } from "#mobile/ui/components/input";
import { Input } from "#mobile/ui/components/input";
import { useAppColors } from "#mobile/ui/theme";

export function PasswordInput(props: InputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const colors = useAppColors();
  const VisibilityIcon = isVisible ? EyeOffIcon : EyeIcon;

  return (
    <Input
      autoCapitalize="none"
      autoComplete="password"
      secureTextEntry={!isVisible}
      trailing={
        <IconButton
          accessibilityLabel={isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          height={40}
          onPress={() => setIsVisible((value) => !value)}
          width={40}
        >
          <VisibilityIcon color={colors.muted} size={20} strokeWidth={1.8} />
        </IconButton>
      }
      {...props}
    />
  );
}
