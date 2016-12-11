'use strict';

const colors = require('colors');
const fse = require('fs-extra');
const path = require('path');

const env = require('../env');
const packmanJson = require('../packman-json');
const uriParser = require('../uri-parser');

module.exports = function* (pkgs) {
  if (!pkgs || pkgs.length === 0) {
    console.log('please specify target packages to remove'.red);
    return;
  }

  const packmanObj = yield packmanJson.readPackmanObj('.');
  if (packmanObj === null) {
    console.log('no packman file'.red);
    return;
  }

  console.log('updating packman.json...'.yellow);

  const oldDependencies = [].concat(packmanObj.dependencies);
  const newDependencies = packmanJson.removeDependencies(oldDependencies, pkgs);
  newDependencies.sort();

  packmanObj.dependencies = newDependencies;
  packmanJson.writePackmanObj('.', packmanObj);

  console.log('removing dependencies...'.yellow);

  for (const pkgUri of pkgs) {
    const pkgInfo = uriParser.toPkgInfo(pkgUri);
    const repoPath = path.join(env.PKG_REPO, pkgInfo.name);
    const stagePath = packmanJson.resolveStaging(pkgInfo, packmanObj);

    console.log(`removing ${pkgInfo.name}...`.yellow);
    fse.removeSync(repoPath);
    fse.removeSync(stagePath);
  }

  console.log('done'.green);
};
