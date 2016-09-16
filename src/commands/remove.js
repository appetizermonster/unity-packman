'use strict';

const colors = require('colors');
const fse = require('fs-extra');
const path = require('path');

const env = require('../env');
const packmanJson = require('../packman-json');
const uriParser = require('../uri-parser');

module.exports = function* (targetDependencies) {
  if (!targetDependencies || targetDependencies.length === 0) {
    console.log('please specify target dependencies to remove'.red);
    return;
  }

  const packmanObj = yield packmanJson.readPackmanObj('.');
  if (packmanObj === null) {
    console.log('no packman file'.red);
    return;
  }

  console.log('updating packman.json...'.yellow);

  const oldDependencies = [].concat(packmanObj.dependencies);
  const newDependencies = packmanJson.removeDependencies(oldDependencies, targetDependencies);
  newDependencies.sort();

  packmanObj.dependencies = newDependencies;
  packmanJson.writePackmanObj('.', packmanObj);

  console.log('removing dependencies...'.yellow);

  for (const pkgUri of targetDependencies) {
    const pkgInfo = uriParser.toPkgInfo(pkgUri);
    const storagePath = path.join(env.PKG_STORAGE, pkgInfo.name);
    const stagePath = path.join(env.PKG_STAGE, pkgInfo.name);

    console.log(`removing ${pkgInfo.name}...`.yellow);
    fse.removeSync(storagePath);
    fse.removeSync(stagePath);
  }

  console.log('done'.green);
};
