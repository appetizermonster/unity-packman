'use strict';

const colors = require('colors');
const fse = require('fs-extra');
const fs = require('fs');
const path = require('path');

const env = require('../env');
const gitUtil = require('../git-util');
const localUtil = require('../local-util');
const packmanJson = require('../packman-json');
const uriParser = require('../uri-parser');
const globalConfig = require('../global-config');

function* installDependencies(installedDependencies, targetDependencies) {
  fse.ensureDirSync(env.PKG_REPO);
  fse.ensureDirSync(env.PKG_STAGE);
  fse.emptyDirSync(env.TEMP_STORAGE);

  const installedPkgNames = packmanJson.convertDependenciesToNames(installedDependencies);
  const targetPkgNames = packmanJson.convertDependenciesToNames(targetDependencies);
  const waitingDeps = [].concat(targetDependencies);
  while (waitingDeps.length > 0) {
    const pkgUri = waitingDeps.pop();
    const pkgInfo = uriParser.toPkgInfo(pkgUri);
    const tempRepoPath = path.join(env.TEMP_STORAGE, pkgInfo.name);

    // localRepo is defined and path exists
    if(pkgInfo.user === 'local') {
      const isUpdatable = yield localUtil.checkShouldUpdate(pkgInfo);
      if (!isUpdatable) {
        console.log(`no need to update: ${pkgInfo.name}`.green);
        continue;
      }
      const path = localUtil.path(pkgInfo);
      yield localUtil.clone(path, tempRepoPath);
    }
    // git repo
    else {
      const isUpdatable = yield gitUtil.checkShouldUpdate(pkgInfo);
      if (!isUpdatable) {
        console.log(`no need to update: ${pkgInfo.name}`.green);
        continue;
      }

      console.log(`cloning ${pkgInfo.git}`);
      yield gitUtil.clone(pkgInfo.git, tempRepoPath);

      // checkout to specific commit
      if (pkgInfo.checkoutTarget)
        yield gitUtil.checkout(tempRepoPath, pkgInfo.checkoutTarget);
    }

    const packmanObj = yield packmanJson.readPackmanObj(tempRepoPath);
    if (packmanObj === null) {
      console.log(`${pkgInfo.name} has no packman file`.red);
      continue;
    }

    // inspecting another dependencies
    const deps = packmanObj.dependencies;
    if (deps) {
      console.log(`inspecting dependencies from ${pkgInfo.name}`);
      for (const depPkgUri of deps) {
        const depPkgInfo = uriParser.toPkgInfo(depPkgUri);
        const depName = depPkgInfo.name;
        if (installedPkgNames.indexOf(depName) >= 0)
          continue;
        if (targetPkgNames.indexOf(depName) >= 0)
          continue;

        console.log(`found dependency: ${depName}`.yellow);
        waitingDeps.push(depPkgUri);
        targetPkgNames.push(depName);
      }
    }

    const exportDir = packmanObj.export;
    if (!exportDir) {
      console.log(`${pkgInfo.name} has no export directory`.red);
      continue;
    }

    const repoPath = path.join(env.PKG_REPO, pkgInfo.name);
    fse.emptyDirSync(repoPath);
    fse.copySync(tempRepoPath, repoPath);

    console.log(`copying to stage: ${pkgInfo.name}`);
    const stagePath = packmanJson.resolveStaging(pkgInfo, packmanObj);
    const exportPath = path.join(repoPath, exportDir);
    fse.emptyDirSync(stagePath);
    fse.copySync(exportPath, stagePath);
    console.log('complete'.green);
  }

  fse.removeSync(env.TEMP_STORAGE);
}

function* install(targetDependencies) {
  const packmanObj = yield packmanJson.readPackmanObj('.');
  if (packmanObj === null) {
    console.log('no packman file'.red);
    return;
  }

  console.log('installing dependencies...\n');
  const installedDependencies = packmanObj.dependencies || [];
  yield installDependencies(installedDependencies, targetDependencies);

  console.log('updating packman.json...'.yellow);

  let newDependencies = [].concat(packmanObj.dependencies).concat(targetDependencies).filter(function(e){return e});
  newDependencies = packmanJson.makeDependenciesUnique(newDependencies);
  newDependencies.sort();

  // replace stored dependencies
  packmanObj.dependencies = newDependencies;
  packmanJson.writePackmanObj('.', packmanObj);

  console.log('done'.cyan);
}

function* installAll() {
  const packmanObj = yield packmanJson.readPackmanObj('.');
  if (packmanObj === null) {
    console.log('no packman file'.red);
    return;
  }

  console.log('inspecting dependencies...\n');
  const dependencies = packmanObj.dependencies;
  if (!dependencies) {
    console.log('no dependencies to install'.green);
    return;
  }

  yield installDependencies(dependencies, dependencies);
  console.log('done'.cyan);
}

function* installLocal(from, to) {
  console.log(`copying ${from} to ${to}`);
  yield localUtil.clone(from, to);
}

module.exports = function* (pkgs) {
  if (pkgs && pkgs.length > 0) {
    yield install(pkgs);
    return;
  }
  yield installAll();
};
