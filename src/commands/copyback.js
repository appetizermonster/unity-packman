'use strict';

const colors = require('colors');
const fse = require('fs-extra');
const path = require('path');
const globalConfig = require('../global-config');
const localUtil = require('../local-util');

const env = require('../env');
const packmanJson = require('../packman-json');
const uriParser = require('../uri-parser');

function* copybackProject(pkg, remaining = null, addDependencies = null) {
  const pkgInfo = uriParser.toPkgInfo(pkg);
  const repoPath = path.join(env.PKG_REPO, pkgInfo.name);

  const packmanObj = yield packmanJson.readPackmanObj(repoPath);
  if (packmanObj === null || !packmanObj.export) {
    console.log(`no repository or no exported directory: ${pkgInfo.name}`.red);
    return;
  }

  const exportPath = path.join(repoPath, packmanObj.export).normalize();
  const stagePath = path.join(env.PKG_STAGE, pkgInfo.name).normalize();

  console.log(`copying ${pkgInfo.name} back from ${stagePath} to ${exportPath}...`.green);

  fse.removeSync(exportPath);
  fse.copySync(stagePath, exportPath);

  if (pkgInfo.user === 'local') {
    const localExportPath = path.join(localUtil.path(pkgInfo), packmanObj.export).normalize();
    console.log(`copying ${pkgInfo.name} from ${stagePath} to ${localExportPath}...`.yellow);
    fse.removeSync(localExportPath);
    fse.copySync(stagePath, localExportPath);
  }

  if (addDependencies && packmanObj.dependencies) {
    for (let dep of packmanObj.dependencies) {
      remaining.add(dep);
      console.log(`\tadded ${dep} to remaining`.white);
    }
  }
}

module.exports = function*(pkg, options) {
  if (!pkg && !(options.all || options.direct)) {
    console.log('please specify target package to copy back'.red);
    return;
  }

  if (options.all || options.direct) {
    const packmanObj = yield packmanJson.readPackmanObj('.');
    if (packmanObj === null) {
      console.log('no packman file'.red);
      return;
    }

    console.log('inspecting dependencies...\n');
    const remaining = new Set(packmanObj.dependencies);
    for (let pkg of remaining) {
      yield copybackProject(pkg, remaining, options.all);
      console.log(`completed copying ${pkg} export folder back`.green);
    }

    console.log('done'.cyan);
  } else {
    yield copybackProject(pkg);
  }

  console.log('done'.green);
};
