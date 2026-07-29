export function initials(value = ""): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function normalized(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function displayValue(value: unknown, fallback = "—"): string {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

export function starText(count: number | null | undefined, max = 5): string {
  if (!count) return "—";
  return `${"★".repeat(Math.min(max, count))}${"☆".repeat(Math.max(0, max - count))}`;
}

export function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]?/g)?.map((part) => part.trim()).filter(Boolean) ?? [];
}
