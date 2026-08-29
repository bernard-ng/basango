import { formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";

export function formatRelativeTime(value: Date): string {
  return formatDistanceToNowStrict(value, { addSuffix: true, locale: fr });
}
