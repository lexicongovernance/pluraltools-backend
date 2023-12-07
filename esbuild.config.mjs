import * as esbuild from 'esbuild';
import { polyfillNode } from 'esbuild-plugin-polyfill-node';

await esbuild.build({
  bundle: true,
  entryPoints: ['src/index.ts'],
  platform: 'node',
  outfile: 'dist/index.js',
  target: 'es6',
  format: 'cjs',
});
