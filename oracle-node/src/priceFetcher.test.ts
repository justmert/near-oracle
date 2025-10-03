import { calculateMedian, extractPriceFromPath } from './priceUtils.js';

describe('calculateMedian', () => {
  it('returns middle value for odd-length arrays', () => {
    expect(calculateMedian([1, 3, 2, 10, 5])).toBe(3);
  });

  it('averages middle values for even-length arrays', () => {
    expect(calculateMedian([4, 1, 3, 2])).toBe(2.5);
  });

  it('returns zero for empty arrays', () => {
    expect(calculateMedian([])).toBe(0);
  });
});

describe('extractPriceFromPath', () => {
  it('reads nested object paths', () => {
    const data = { a: { b: { c: '42.5' } } };
    expect(extractPriceFromPath(data, 'a.b.c')).toBeCloseTo(42.5);
  });

  it('reads array indices inside paths', () => {
    const data = { data: [{ last: '3.55' }] };
    expect(extractPriceFromPath(data, 'data.0.last')).toBeCloseTo(3.55);
  });

  it('returns null when value missing', () => {
    const data = { a: {} };
    expect(extractPriceFromPath(data, 'a.price')).toBeNull();
  });
});
