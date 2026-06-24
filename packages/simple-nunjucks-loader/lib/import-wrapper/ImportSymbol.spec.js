import { ImportSymbol } from './ImportSymbol';

describe('toString', () => {
  it('should return raw string', () => {
    expect(new ImportSymbol('a').toString()).toBe('a');
  });
});

describe('toGlob', () => {
  it('should return star', () => {
    expect(new ImportSymbol('a').toGlob()).toBe('*');
  });
});
