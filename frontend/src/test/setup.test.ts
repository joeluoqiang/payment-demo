import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should run tests correctly', () => {
    expect(true).toBe(true);
  });

  it('should support ES modules', () => {
    const sum = (a: number, b: number) => a + b;
    expect(sum(1, 2)).toBe(3);
  });
});