import { TZDate } from "@date-fns/tz";
import { eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";

export function useCalendarDates(currentDate: Date, weekStartsOnMonday: boolean) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, {
    weekStartsOn: weekStartsOnMonday ? 1 : 0,
  });
  const calendarEnd = endOfWeek(monthEnd, {
    weekStartsOn: weekStartsOnMonday ? 1 : 0,
  });
  const calendarDays = eachDayOfInterval({
    end: calendarEnd,
    start: calendarStart,
  }).map((date) => new TZDate(date, "UTC"));
  const firstWeek = eachDayOfInterval({
    end: endOfWeek(calendarStart, { weekStartsOn: weekStartsOnMonday ? 1 : 0 }),
    start: calendarStart,
  }).map((date) => new TZDate(date, "UTC"));

  return {
    calendarDays,
    calendarEnd,
    calendarStart,
    firstWeek,
    monthEnd,
    monthStart,
  };
}
