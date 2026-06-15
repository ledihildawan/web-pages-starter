import path from 'node:path';
import { IS_PROD } from '@constants/env';
import { PATHS } from '@constants/paths';
import { config } from 'dotenv';

config({
  path: path.resolve(
    PATHS.ROOT,
    IS_PROD ? '.env.production' : '.env.development',
  ),
});
