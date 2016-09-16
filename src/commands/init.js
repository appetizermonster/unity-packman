'use strict';

const colors = require('colors');
const fs = require('fs');
const path = require('path');

module.exports = function* () {
  const packmanPath = 'packman.json';
  let shouldCreate = true;
  try {
    fs.lstatSync(packmanPath);
    shouldCreate = false;
  } catch (e) {}

  if (!shouldCreate) {
    console.log('no need to create packman.json'.cyan);
    return;
  }

  const initialPackmanObj = {
    name: path.basename(path.resolve('.'))
  };
  const contents = JSON.stringify(initialPackmanObj, null, 2);
  console.log('creating packman.json...'.yellow);
  fs.writeFileSync('packman.json', contents);
  console.log('done'.green);
};
