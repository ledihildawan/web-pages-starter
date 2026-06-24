import { ImportLiteral } from './ImportLiteral';
import { ImportSymbol } from './ImportSymbol';
import { ImportWrapper } from './ImportWrapper';

describe('constructor', () => {
  it('should accept literals and symbols', () => {
    expect(() => new ImportWrapper([new ImportLiteral('a'), new ImportSymbol('b')])).not.toThrowError();
  });

  it('should throw for wrong args', () => {
    expect(() => new ImportWrapper([new ImportLiteral('a'), new ImportSymbol('b'), 'c'])).toThrowError(
      'ImportWrapper: all parts should be a symbol or literal instances',
    );
  });
});

describe('push', () => {
  it('should insert new part', () => {
    const importPath = new ImportWrapper();
    importPath.addSymbol('a').addLiteral('b');

    importPath.push(new ImportSymbol('c'));

    expect(importPath.toString()).toBe('a + "b" + c');
  });
});

describe('shift', () => {
  it('should return first item', () => {
    const importPath = new ImportWrapper();
    importPath.addSymbol('a').addLiteral('b');

    expect(importPath.shift().toString()).toBe('a');
  });
});

describe('unshift', () => {
  it('should prepend items', () => {
    const importPath = new ImportWrapper();
    importPath.addLiteral('b');
    importPath.unshift(new ImportSymbol('a'));

    expect(importPath.toString()).toBe('a + "b"');
  });
});

describe('concat', () => {
  it('should return new instance', () => {
    const importPath = new ImportWrapper();
    const clone = importPath.concat();

    expect(importPath).not.toBe(clone);
  });
});

describe('startsWith', () => {
  it('should return bool with literals', () => {
    const templateImport = new ImportWrapper();
    templateImport.addLiteral('a').addLiteral('b').addSymbol('c');

    expect(templateImport.startsWith('abc')).toBe(false);
    expect(templateImport.startsWith('ab')).toBe(true);
    expect(templateImport.startsWith('a')).toBe(true);
  });

  it('should return bool with symbol', () => {
    const templateImport = new ImportWrapper();
    templateImport.addSymbol('a').addLiteral('b').addSymbol('c');

    expect(templateImport.startsWith('a')).toBe(false);
  });
});

describe('isDynamic', () => {
  it('should detect paths with symbols', () => {
    const templateImport = new ImportWrapper();
    templateImport.addLiteral('a');

    expect(templateImport.isDynamic()).toBe(false);

    templateImport.addSymbol('b');
    expect(templateImport.isDynamic()).toBe(true);
  });
});

describe('toString', () => {
  let templateImport;
  beforeEach(() => {
    templateImport = new ImportWrapper();
    templateImport.addSymbol('a').addLiteral('b');
  });

  it('should return import string', () => {
    expect(templateImport.toString()).toBe('a + "b"');
  });

  it('should return raw string', () => {
    expect(templateImport.toGlob()).toBe('*b');
  });

  it('should return unquoted string for static paths', () => {
    templateImport.shift();
    expect(templateImport.toString()).toBe('b');
  });

  it('should return quoted string for multiple literals', () => {
    templateImport.shift();
    templateImport.addLiteral('c');
    expect(templateImport.toString()).toBe('"b" + "c"');
  });
});

describe('toArgs', () => {
  it('should return all symbol names', () => {
    const templateImport = new ImportWrapper();
    templateImport.addLiteral('a').addLiteral('b');
    expect(templateImport.toArgs()).toEqual([]);

    templateImport.addSymbol('c');
    expect(templateImport.toArgs()).toEqual(['c']);
  });
});

describe('toRegExp', () => {
  it('should generate RegExp for path', () => {
    const templateImport = new ImportWrapper();
    templateImport.addLiteral('a/').addSymbol('b').addLiteral('/c/');

    expect(templateImport.toRegExp().test('a/foobar/c/')).toBe(true);
  });
});
