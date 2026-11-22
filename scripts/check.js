// Syntax-check JS files with the Expo Babel preset: node scripts/check.js [files...]
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');
const files = process.argv.slice(2).length ? process.argv.slice(2)
  : ['App.js', ...fs.readdirSync('src').filter((f) => f.endsWith('.js')).map((f) => `src/${f}`),
    ...fs.readdirSync('src/screens').map((f) => `src/screens/${f}`)];
let failed = 0;
for (const f of files) {
  try {
    babel.transformFileSync(path.resolve(f), { presets: [require.resolve('babel-preset-expo', { paths: [require.resolve('expo/package.json')] })], babelrc: false, configFile: false });
  } catch (e) { failed++; console.error(`✗ ${f}\n${e.message}\n`); }
}
console.log(failed ? `${failed} file(s) failed` : `✓ ${files.length} files OK`);
process.exit(failed ? 1 : 0);
