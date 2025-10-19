import { DateTime } from "luxon";

export const toUTCDateRange = (
  timezone: string,
  start: string,
  end: string
): { startUTC: string; endUTC: string } => {
  const startDate = DateTime.fromISO(start, { zone: timezone });
  const endDate = DateTime.fromISO(end, { zone: timezone });

  if (!startDate.isValid || !endDate.isValid) {
    throw new Error(`Invalid date input: start=${start}, end=${end}`);
  }

  const startUTC = startDate.toUTC().toSQL({ includeOffset: false })!;
  const endUTC = endDate.toUTC().toSQL({ includeOffset: false })!;

  return { startUTC, endUTC };
};

export const fromUTCToLocal = (
  dbDate: string | Date,                  // MySQL DATETIME
  timezone: string,
  granularity: "minute" | "day" = "minute"
): string => {
  if (!dbDate) return "Invalid Date";

  // Normalize input
  let dt: DateTime;
  if (dbDate instanceof Date) {
    dt = DateTime.fromJSDate(dbDate);
  } else if (typeof dbDate === "string") {
    // MySQL DATETIME: "YYYY-MM-DD HH:mm:ss"
    dt = DateTime.fromFormat(dbDate, "yyyy-MM-dd HH:mm:ss");
  } else {
    return "Invalid Date";
  }

  if (!dt.isValid) {
    console.warn("⚠️ Invalid DateTime:", dbDate);
    return "Invalid Date";
  }

  // Convert to store timezone for display
  const local = dt.setZone(timezone, { keepLocalTime: true });

  // Return formatted string
  return granularity === "day"
    ? local.toFormat("yyyy-MM-dd")
    : local.toFormat("yyyy-MM-dd hh:mm a"); // e.g. 2025-10-19 02:15 PM
};

