export function safeJSONParse<T>(input: any, fallback: T): T {
  if (input === null || input === undefined) return fallback;

  // If it's already an object, just return it
  if (typeof input === "object") return input as T;

  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed === "object") {
      return parsed as T;
    }
  } catch (err) {
    console.warn("Invalid JSON received:", err);
  }
  return fallback;
}
