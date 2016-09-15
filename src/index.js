'use strict';

const co = require('co');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const colors = require('colors'); // DO NOT REMOVE

const gitUtil = require('./git-util');
const jsonUtil = require('./json-util');
const uriParser = require('./uri-parser');
const env = require('./env');

function* checkShouldUpdate(repoInfo) {
  const storagePath = path.join(env.PKG_STORAGE, repoInfo.name);
  const packmanObj = yield jsonUtil.readPackmanObj(storagePath);
  if (packmanObj === null)
    return true;

  const localCommit = yield gitUtil.fetchLocalHeadCommit(storagePath, repoInfo.ref);
  console.log(`${repoInfo.name}: local: ${localCommit}`.yellow);
  if (localCommit === undefined)
    return true;

  // if targeting specific commit
  if (repoInfo.commit)
    return (localCommit !== repoInfo.commit);

  const remoteCommit = yield gitUtil.fetchRemoteHeadCommit(repoInfo.git, repoInfo.ref);
  console.log(`${repoInfo.name}: remote: ${remoteCommit}`.yellow);
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

function toGitUrlArray(deps) {
  const urlArray = [];
  for (const dep of deps) {
    urlArray.push(uriParser.toRepoInfo(dep).git);
  }
  return urlArray;
}

function* installDependencies(installedDependencies, targetDependencies) {
  fse.ensureDirSync(env.PKG_STORAGE);
  fse.ensureDirSync(env.PKG_STAGE);
  fse.emptyDirSync(env.TEMP_STORAGE);

  const installedDepsGitUrls = toGitUrlArray(installedDependencies);
  const depsGitUrls = toGitUrlArray(targetDependencies);
  const waitingDeps = [].concat(targetDependencies);
  while (waitingDeps.length > 0) {
    const shortUri = waitingDeps.pop();
    const repoInfo = uriParser.toRepoInfo(shortUri);
    const tempRepoPath = path.join(env.TEMP_STORAGE, repoInfo.name);

    const isUpdatable = yield checkShouldUpdate(repoInfo);
    if (!isUpdatable) {
      console.log(`no need to update: ${repoInfo.name}`.green);
      continue;
    }

    console.log(`cloning ${repoInfo.git}`);
    yield gitUtil.clone(repoInfo.git, tempRepoPath);

    // checkout to specific commit
    if (repoInfo.checkoutTarget)
      yield gitUtil.checkout(tempRepoPath, repoInfo.checkoutTarget);

    const packmanObj = yield jsonUtil.readPackmanObj(tempRepoPath);
    if (packmanObj === null) {
      console.log(`${shortUri} has no packman file`.red);
      continue;
    }

    // inspecting another dependencies
    const deps = packmanObj.dependencies;
    if (deps) {
      console.log(`inspecting dependencies from ${shortUri}`);
      for (const dep of deps) {
        const depRepoInfo = uriParser.toRepoInfo(dep);
        const depGit = depRepoInfo.git;
        if (installedDepsGitUrls.indexOf(depGit) >= 0)
          continue;
        if (depsGitUrls.indexOf(dep) >= 0)
          continue;

        console.log(`found dependency: ${dep}`.yellow);
        waitingDeps.push(dep);
        depsGitUrls.push(depGit);
      }
    }

    const exportDir = packmanObj.export;
    if (!exportDir) {
      console.log(`${repoInfo.name} has no export directory`.red);
      continue;
    }

    const storagePath = path.join(env.PKG_STORAGE, repoInfo.name);
    fse.emptyDirSync(storagePath);
    fse.copySync(tempRepoPath, storagePath);

    console.log(`copying to stage: ${repoInfo.name}`);
    const stagePath = path.join(env.PKG_STAGE, repoInfo.name);
    const exportPath = path.join(storagePath, exportDir);
    fse.emptyDirSync(stagePath);
    fse.copySync(exportPath, stagePath);
    console.log('complete'.green);
  }

  fse.removeSync(env.TEMP_STORAGE);
}

function* install(dependencies) {
  const packmanObj = yield jsonUtil.readPackmanObj('.');
  if (packmanObj === null) {
    console.log('no packman file'.red);
    return;
  }

  console.log('installing dependencies...\n');
  const installedDependencies = packmanObj.dependencies || [];
  yield installDependencies(installedDependencies, dependencies);

  console.log('updating packman.json...'.yellow);
  const newDependencies = [].concat(packmanObj.dependencies);
  for (const dependency of newDependencies) {
    const duplicated = newDependencies.indexOf(dependency) >= 0;
    if (duplicated)
      continue;
    newDependencies.push(dependency);
  }
  newDependencies.sort();

  // replace stored dependencies
  packmanObj.dependencies = newDependencies;
  jsonUtil.writePackmanObj('.', packmanObj);

  console.log('done'.cyan);
}

function* installAll() {
  const packmanObj = yield jsonUtil.readPackmanObj('.');
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

function* remove(dependencies) {
  if (!dependencies || dependencies.length === 0) {
    console.log('please specify dependencies to remove'.red);
    return;
  }

  const packmanObj = yield jsonUtil.readPackmanObj('.');
  if (packmanObj === null) {
    console.log('no packman file'.red);
    return;
  }

  const storedDependencies = packmanObj.dependencies;
  const newDependencies = [];
  for (const dependency of storedDependencies) {
    const shouldRemove = dependencies.indexOf(dependency) >= 0;
    if (shouldRemove)
      continue;
    newDependencies.push(dependency);
  }

  console.log('updating packman.json...'.yellow);
  packmanObj.dependencies = newDependencies;
  jsonUtil.writePackmanObj('.', packmanObj);

  console.log('removing dependencies...'.yellow);

  for (const shortUri of dependencies) {
    const repoInfo = uriParser.toRepoInfo(shortUri);
    const storagePath = path.join(env.PKG_STORAGE, repoInfo.name);
    const stagePath = path.join(env.PKG_STAGE, repoInfo.name);

    console.log(`removing ${shortUri}...`.yellow);
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
