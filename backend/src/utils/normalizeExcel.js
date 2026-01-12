export function normalizeKey(key = "") {
  return String(key)
    .trim()
    .replace(/\s+/g, " ") // multiple spaces to one
    .toLowerCase();
}

export function normalizeValue(value) {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  if (!v || v.toUpperCase() === "NA") return null;
  return v;
}
