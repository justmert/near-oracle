export function extractPriceFromPath(data: unknown, path: string): number | null {
  const parts = path.split('.').filter(Boolean);
  let current: any = data;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return null;
    }

    const trimmed = part.trim();
    const index = Number(trimmed);
    if (trimmed !== '' && !Number.isNaN(index)) {
      if (!Array.isArray(current)) {
        return null;
      }
      if (index < 0 || index >= current.length) {
        return null;
      }
      current = current[index];
      continue;
    }

    current = current[trimmed];
  }

  if (current === null || current === undefined) {
    return null;
  }

  if (typeof current === 'number') {
    return current;
  }

  if (typeof current === 'string') {
    const parsed = parseFloat(current);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = parseFloat(String(current));
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateMedian(prices: number[]): number {
  if (prices.length === 0) {
    return 0;
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}
