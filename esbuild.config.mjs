import * as esbuild from 'esbuild';

await esbuild.build({
  bundle: true,
  entryPoints: ['src/index.ts'],
  platform: 'node',
  outfile: 'dist/index.js',
  target: 'ESNext',
  format: 'cjs',
});
