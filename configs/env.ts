import path from 'node:path';
import { PATHS } from '@constants/paths';
import { config } from 'dotenv';

config({
  path: path.resolve(
    PATHS.ROOT,
    process.env.NODE_ENV === 'production'
      ? '.env.production'
      : '.env.development',
  ),
});
