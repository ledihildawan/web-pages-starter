import { ImportWrapper } from '../import-wrapper/ImportWrapper';

import { getFirstExistedPath } from './get-first-existed-path';

test('should throw for non-existed path', async () => {
  await expect(
    getFirstExistedPath([new ImportWrapper().addLiteral('foo.js'), new ImportWrapper().addLiteral('bar.js')]),
  ).rejects.toThrow('Path not found');
});
