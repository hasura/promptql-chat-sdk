/**
 * Test for the findOverlap utility function
 */

// Copy the findOverlap function for testing
function findOverlap(str1: string, str2: string): number {
  const maxOverlap = Math.min(str1.length, str2.length);
  
  for (let i = maxOverlap; i > 0; i--) {
    if (str1.slice(-i) === str2.slice(0, i)) {
      return i;
    }
  }
  
  return 0;
}

describe('findOverlap', () => {
  test('should find overlap between strings', () => {
    expect(findOverlap('hello world', 'world test')).toBe(5);
    expect(findOverlap('1. Search for CLI', 'CLI documentation')).toBe(3);
    expect(findOverlap('documentation about model', 'model creation')).toBe(5);
  });

  test('should return 0 when no overlap', () => {
    expect(findOverlap('hello', 'world')).toBe(0);
    expect(findOverlap('abc', 'def')).toBe(0);
  });

  test('should handle empty strings', () => {
    expect(findOverlap('', 'hello')).toBe(0);
    expect(findOverlap('hello', '')).toBe(0);
    expect(findOverlap('', '')).toBe(0);
  });

  test('should handle identical strings', () => {
    expect(findOverlap('hello', 'hello')).toBe(5);
    expect(findOverlap('test', 'test')).toBe(4);
  });

  test('should handle partial overlaps', () => {
    expect(findOverlap('abcde', 'defgh')).toBe(2);
    expect(findOverlap('testing', 'ingtest')).toBe(3);
  });
});
