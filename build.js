import esbuild from 'esbuild';
import fs from 'node:fs';

const files = fs.readdirSync('./src').map(file => `./src/${file}`);

esbuild.build({
  platform    : 'node',
  format      : 'esm',
  entryPoints : files,
  outdir      : './test',
  packages    : 'external',
});