// Simple UUID v4 generator (kept for potential future use)
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate a compact app ID (3-32 chars, lowercase alphanumeric) to satisfy validation
export function generateAppId(length: number = 20): string {
  const min = 3;
  const max = 32;
  const finalLength = Math.min(Math.max(length, min), max);
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < finalLength; i++) {
    const idx = Math.floor(Math.random() * alphabet.length);
    result += alphabet[idx];
  }
  return result;
}
