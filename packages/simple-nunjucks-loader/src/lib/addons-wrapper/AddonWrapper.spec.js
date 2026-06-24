import { AddonWrapper } from './AddonWrapper';

describe('constructor', () => {
  it('should throw with wrong name', () => {
    expect(() => new AddonWrapper({})).toThrowErrorMatchingSnapshot();
  });

  it('should throw w/out import path', () => {
    expect(
      () =>
        new AddonWrapper({
          name: 'foo',
        }),
    ).toThrowErrorMatchingSnapshot();
  });

  it('should throw w/out type', () => {
    expect(
      () =>
        new AddonWrapper({
          name: 'foo',
          importPath: 'bar',
        }),
    ).toThrowErrorMatchingSnapshot();
  });

  it('should throw with wrong es flag', () => {
    expect(
      () =>
        new AddonWrapper({
          name: 'foo',
          importPath: 'bar',
          type: 'x',
        }),
    ).toThrowErrorMatchingSnapshot();
  });
});
