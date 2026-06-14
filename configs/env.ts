import path from 'node:path';
import { config } from 'dotenv';

const ROOT = path.resolve(__dirname, '../..');

const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

config({ path: path.resolve(ROOT, envFile) });
