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
  dbDate: string | Date,
  timezone: string,
  granularity: "minute" | "day" = "minute"
): string => {
  if (!dbDate) return "Invalid Date";

  let dt: DateTime;

  if (dbDate instanceof Date) {
    dt = DateTime.fromJSDate(dbDate, { zone: "UTC" }); // treat Date as UTC
  } else if (typeof dbDate === "string") {
    // MySQL DATETIME: "YYYY-MM-DD HH:mm:ss" or with microseconds
    const format = dbDate.includes(".")
      ? "yyyy-MM-dd HH:mm:ss.SSSSSS"
      : "yyyy-MM-dd HH:mm:ss";
    dt = DateTime.fromFormat(dbDate, format, { zone: "UTC" }); // parse as UTC
  } else {
    return "Invalid Date";
  }

  if (!dt.isValid) {
    console.warn("⚠️ Invalid DateTime:", dbDate);
    return "Invalid Date";
  }

  // Convert to target timezone (properly)
  const local = dt.setZone(timezone); // keepLocalTime defaults to false

  return granularity === "day"
    ? local.toFormat("yyyy-MM-dd")
    : local.toFormat("yyyy-MM-dd hh:mm a"); // e.g. 2025-10-19 02:15 PM
};
