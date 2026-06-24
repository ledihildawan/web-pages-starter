import { WebpackPrecompiledLoader } from './WebpackPrecompiledLoader';

const precompiledTemplateMock = {
  root() {},
};

describe('WebpackPrecompiledLoader', () => {
  describe('getSource', () => {
    describe('template not found', () => {
      test('not precompiled', () => {
        const loader = new WebpackPrecompiledLoader();

        expect(loader.getSource('foo.njk')).toBeNull();
      });
    });

    describe('template return', () => {
      test('returns precompiled template', () => {
        const loader = new WebpackPrecompiledLoader({
          'foo.njk': precompiledTemplateMock,
        });

        expect(loader.getSource('foo.njk')).toEqual({
          src: {
            type: 'code',
            obj: precompiledTemplateMock,
          },
          path: 'foo.njk',
        });
      });
    });
  });
});
