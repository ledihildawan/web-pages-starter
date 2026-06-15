import { IS_PROD } from '@constants';
import { resolveRoot } from '@utils/paths';
import { config } from 'dotenv';

config({ path: resolveRoot(`.env.${IS_PROD ? 'production' : 'development'}`) });
