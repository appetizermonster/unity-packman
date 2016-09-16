'use strict';

const colors = require('colors');
const fs = require('fs');

module.exports = function* () {
  const ignorePath = '.gitignore';

  console.log('creating .gitignore...'.yellow);
  let contents = '';

  try {
    contents = fs.readFileSync(ignorePath, {
      encoding: 'utf8'
    });
  } catch (e) {}

  const lines = contents.split(/\r?\n/);
  const ignorePaths = ['node_modules/', '.packman/'];
  let shouldInsert = false;

  // pre-pass
  for (const ignorePath of ignorePaths) {
    if (lines.indexOf(ignorePath) < 0) {
      shouldInsert = true;
      break;
    }
  }

  if (shouldInsert)
    contents += '\n\n# unity-packman';

  // insert ignore paths
  for (const ignorePath of ignorePaths) {
    if (lines.indexOf(ignorePath) < 0) {
      console.log(`inserting ${ignorePath}`.yellow);
      contents += '\n' + ignorePath;
    }
  }
  fs.writeFileSync(ignorePath, contents, 'utf8');

  console.log('done'.green);
};
