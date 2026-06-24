import { ImportLiteral } from './ImportLiteral';

describe('toString', () => {
  it('should return quoted string', () => {
    expect(new ImportLiteral('a').toString()).toBe('"a"');
  });
});

describe('toGlob', () => {
  it('should return raw string', () => {
    expect(new ImportLiteral('a').toGlob()).toBe('a');
  });
});
