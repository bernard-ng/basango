import type { SwitchProps as NativeSwitchProps } from "react-native";
import { Switch as NativeSwitch } from "react-native";

import { useAppColors } from "#mobile/ui/theme";

type SwitchProps = Omit<NativeSwitchProps, "onValueChange" | "value"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function Switch({ checked, onCheckedChange, ...props }: SwitchProps) {
  const colors = useAppColors();

  return (
    <NativeSwitch
      ios_backgroundColor={colors.border}
      onValueChange={onCheckedChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      value={checked}
      {...props}
    />
  );
}
