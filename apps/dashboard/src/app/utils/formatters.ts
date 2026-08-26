import { format, isSameYear } from "date-fns";

export function formatDate(date: string, dateFormat?: string | null, checkYear = true) {
  if (checkYear && isSameYear(new Date(), new Date(date))) {
    return format(new Date(date), "MMM d");
  }

  return format(new Date(date), dateFormat ?? "P");
}

export function formatNumber(value: number | undefined): string {
  return Intl.NumberFormat("en-US").format(value ?? 0);
}

export function getInitials(value: string) {
  const formatted = value.toUpperCase().replace(/[\s.-]/g, "");

  if (formatted.split(" ").length > 1) {
    return `${formatted.charAt(0)}${formatted.charAt(1)}`;
  }

  if (value.length > 1) {
    return formatted.charAt(0) + formatted.charAt(1);
  }

  return formatted.charAt(0);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const intervals = [
    { label: "y", seconds: 31536000 },
    { label: "mo", seconds: 2592000 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
  ] as const;

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count > 0) {
      return `${count}${interval.label} ago`;
    }
  }

  return "just now";
}
