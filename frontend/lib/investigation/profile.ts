export function initialsFromDisplayName(name: string) {
  return name
    .replace(/^Dr\.\s+/, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "D";
}
