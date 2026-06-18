import { createJiti } from 'jiti';
import { alias } from './utils/alias';

const jiti = createJiti(import.meta.url, { alias });

const envServer = await jiti.import<typeof import('./generated/env')>('./generated/env.ts');

await envServer.loadServerEnvFiles();

const mod = await jiti.import<typeof import('./configs/rsbuild')>('./configs/rsbuild.ts');

export default mod.default;
