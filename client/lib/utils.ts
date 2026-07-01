export function cn(...values: unknown[]): string {
  return values
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    )
    .join(" ");
}
