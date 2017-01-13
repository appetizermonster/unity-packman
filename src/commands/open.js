'use strict';

const colors = require('colors');
const path = require('path');
const spawn = require('child_process').spawn;

const env = require('../env');
const packmanJson = require('../packman-json');
const globalConfig = require('../global-config');
const uriParser = require('../uri-parser');

module.exports = function*(pkg) {
  if (!pkg) {
    console.log('please specify target package to open'.red);
    return;
  }

  if (!globalConfig.unity) {
    console.log('please define your unity executable location with unity-packman config unity:/Applications/Unity'.red);
    return;
  }

  const pkgInfo = uriParser.toPkgInfo(pkg);
  const repoPath = path.join(env.PKG_REPO, pkgInfo.name);

  const packmanObj = yield packmanJson.readPackmanObj(repoPath);
  if (packmanObj === null || !packmanObj.export) {
    console.log(`no repository or no exported directory: ${pkgInfo.name}`.red);
    return;
  }

  console.log(`opening ${pkgInfo.name} at ${repoPath} via ${globalConfig.unity} -projectPath ${repoPath}`.yellow);
  spawn(globalConfig.unity, ['-projectPath', repoPath]).unref();
  console.log('done'.green);
};
