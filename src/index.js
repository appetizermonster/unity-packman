'use strict';

const co = require('co');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const colors = require('colors'); // DO NOT REMOVE

const gitUtil = require('./git-util');
const packmanJson = require('./packman-json');
const uriParser = require('./uri-parser');
const env = require('./env');

function* checkShouldUpdate(pkgInfo) {
  const storagePath = path.join(env.PKG_STORAGE, pkgInfo.name);
  const packmanObj = yield packmanJson.readPackmanObj(storagePath);
  if (packmanObj === null)
    return true;

  const localCommit = yield gitUtil.fetchLocalHeadCommit(storagePath, pkgInfo.ref);
  console.log(`${pkgInfo.name}: local: ${localCommit}`.yellow);
  if (localCommit === undefined)
    return true;

  // if targeting specific commit
  if (pkgInfo.commit)
    return (localCommit !== pkgInfo.commit);

  const remoteCommit = yield gitUtil.fetchRemoteHeadCommit(pkgInfo.git, pkgInfo.ref);
  console.log(`${pkgInfo.name}: remote: ${remoteCommit}`.yellow);
  if (localCommit !== remoteCommit)
    return true;
  return false;
}

function* init() {
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
}

function* gitIgnore() {
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
}

function* installDependencies(installedDependencies, targetDependencies) {
  fse.ensureDirSync(env.PKG_STORAGE);
  fse.ensureDirSync(env.PKG_STAGE);
  fse.emptyDirSync(env.TEMP_STORAGE);

  const installedPkgNames = packmanJson.convertDependenciesToNames(installedDependencies);
  const targetPkgNames = packmanJson.convertDependenciesToNames(targetDependencies);
  const waitingDeps = [].concat(targetDependencies);
  while (waitingDeps.length > 0) {
    const pkgUri = waitingDeps.pop();
    const pkgInfo = uriParser.toPkgInfo(pkgUri);
    const tempRepoPath = path.join(env.TEMP_STORAGE, pkgInfo.name);

    const isUpdatable = yield checkShouldUpdate(pkgInfo);
    if (!isUpdatable) {
      console.log(`no need to update: ${pkgInfo.name}`.green);
      continue;
    }

    console.log(`cloning ${pkgInfo.git}`);
    yield gitUtil.clone(pkgInfo.git, tempRepoPath);

    // checkout to specific commit
    if (pkgInfo.checkoutTarget)
      yield gitUtil.checkout(tempRepoPath, pkgInfo.checkoutTarget);

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

    const storagePath = path.join(env.PKG_STORAGE, pkgInfo.name);
    fse.emptyDirSync(storagePath);
    fse.copySync(tempRepoPath, storagePath);

    console.log(`copying to stage: ${pkgInfo.name}`);
    const stagePath = path.join(env.PKG_STAGE, pkgInfo.name);
    const exportPath = path.join(storagePath, exportDir);
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

  let newDependencies = [].concat(packmanObj.dependencies).concat(targetDependencies);
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

function* remove(targetDependencies) {
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
}

module.exports = {
  init: co.wrap(init),
  gitIgnore: co.wrap(gitIgnore),
  install: co.wrap(install),
  installAll: co.wrap(installAll),
  remove: co.wrap(remove)
};
