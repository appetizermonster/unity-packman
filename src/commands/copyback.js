'use strict';

const colors = require('colors');
const fse = require('fs-extra');
const path = require('path');
const globalConfig = require('../global-config');
const localUtil = require('../local-util');

const env = require('../env');
const packmanJson = require('../packman-json');
const uriParser = require('../uri-parser');

module.exports = function* (pkg) {
  if (!pkg) {
    console.log('please specify target package to copy back'.red);
    return;
  }

  const pkgInfo = uriParser.toPkgInfo(pkg);
  const repoPath = path.join(env.PKG_REPO, pkgInfo.name);

  const packmanObj = yield packmanJson.readPackmanObj(repoPath);
  if (packmanObj === null || !packmanObj.export) {
    console.log(`no repository or no exported directory: ${pkgInfo.name}`.red);
    return;
  }

  const exportPath = path.join(repoPath, packmanObj.export);
  const stagePath = path.join(env.PKG_STAGE, pkgInfo.user === 'local' ? pkgInfo.repo : pkgInfo.name);

  console.log(`copying ${pkgInfo.name} back...`.yellow);

  fse.removeSync(exportPath);
  fse.copySync(stagePath, exportPath);

  if(pkgInfo.user === 'local') {
    const localExportPath = path.join(localUtil.path(pkgInfo), packmanObj.export);
    fse.removeSync(localExportPath);
    fse.copySync(exportPath, localExportPath)
  }

  console.log('done'.green);
};
