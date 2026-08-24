import { XIcon } from "lucide-react";

import { Button } from "../button";
import { Input } from "../input";

type DataTableFilterInputProps = {
  className?: string;
  isFiltered?: boolean;
  onChange: (value: string) => void;
  onReset?: () => void;
  placeholder?: string;
  value: string;
};

export function DataTableFilterInput({
  className = "h-8 max-w-sm",
  isFiltered = false,
  onChange,
  onReset,
  placeholder = "Filter…",
  value,
}: DataTableFilterInputProps) {
  return (
    <>
      <Input
        className={className}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {isFiltered && onReset && (
        <Button onClick={onReset} size="sm" type="button" variant="ghost">
          <XIcon />
          Reset
        </Button>
      )}
    </>
  );
}
