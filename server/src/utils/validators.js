export function requireFields(object, fields) {
  for (const field of fields) {
    const value = object[field];
    if (value === undefined || value === null || value === '') {
      return field;
    }
  }

  return null;
}

export function normalizeNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
