import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function formatPublicationDate(value: Date): string {
  return format(value, "d MMMM yyyy 'à' HH:mm", { locale: fr });
}
