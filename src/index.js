'use strict';

const co = require('co');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const colors = require('colors');

const gitUtil = require('./git-util');
const format = require('./format');
const env = require('./env');

function readJson(_path) {
  return new Promise((resolve, reject) => {
    fse.readJson(_path, function (err, obj) {
      if (err)
        return resolve(null);
      return resolve(obj);
    });
  });
}

function readPackmanObj(_path) {
  const jsonPath = path.join(path.resolve(_path), 'packman.json');
  return readJson(jsonPath);
}

function writePackmanObj(_path, packmanObj) {
  const jsonPath = path.join(path.resolve(_path), 'packman.json');
  fse.writeJsonSync(jsonPath, packmanObj, { spaces: 2 });
}

function* checkShouldUpdate(shortUri) {
  const uniqueName = format.toUniqueName(shortUri);
  const gitUri = format.toGitUri(shortUri);
  
  const storagePath = path.join(env.PKG_STORAGE, uniqueName);
  const packmanObj = yield readPackmanObj(storagePath);
  if (packmanObj === null)
    return true;
  
  const localCommit = yield gitUtil.fetchLocalHeadCommit(storagePath);
  console.log(`${shortUri}: local: ${localCommit}`.yellow);
  if (localCommit === undefined)
    return true;
    
  const remoteCommit = yield gitUtil.fetchHeadCommit(gitUri);
  console.log(`${shortUri}: remote: ${remoteCommit}`.yellow);
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
    contents = fs.readFileSync(ignorePath, { encoding: 'utf8' });
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

function* installDependencies(installedDependencies, dependencies) {
  fse.ensureDirSync(env.PKG_STORAGE);
  fse.ensureDirSync(env.PKG_STAGE);  
  fse.emptyDirSync(env.TEMP_STORAGE);
  
  const doneDeps = [];
  const waitingDeps = [].concat(dependencies);
  while (waitingDeps.length > 0) {
    const shortUri = waitingDeps.pop();
    doneDeps.push(shortUri);
    
    const uniqueName = format.toUniqueName(shortUri);
    const gitUri = format.toGitUri(shortUri);
    const tempRepoPath = path.join(env.TEMP_STORAGE, uniqueName);
    
    const isUpdatable = yield checkShouldUpdate(shortUri);
    if (!isUpdatable) {
      console.log(`no need to update: ${shortUri}`.green);
      continue;
    }
    
    console.log(`cloning ${gitUri}`);
    yield gitUtil.cloneRepo(gitUri, tempRepoPath);
    
    const packmanObj = yield readPackmanObj(tempRepoPath);
    if (packmanObj === null) {
      console.log(`${shortUri} has no packman file`.red);
      continue;
    }
  
    // inspecting another dependencies    
    const deps = packmanObj.dependencies;
    if (deps) {
      console.log(`inspecting dependencies from ${shortUri}`);
      for (const dep of deps) {
        if (installedDependencies.indexOf(dep) >= 0)
          continue;
        if (doneDeps.indexOf(dep) >= 0 || waitingDeps.indexOf(dep) >= 0)
          continue;
        if (dep === shortUri)
          continue;
        console.log(`found dependency: ${dep}`.yellow);
        waitingDeps.push(dep);
      }
    }
    
    const exportDir = packmanObj.export;
    if (!exportDir) {
      console.log(`${shortUri} has no export directory`.red);
      continue;
    }
       
    const storagePath = path.join(env.PKG_STORAGE, uniqueName);
    fse.emptyDirSync(storagePath);
    fse.copySync(tempRepoPath, storagePath);
    
    console.log(`copying to stage: ${shortUri}`);
    const stagePath = path.join(env.PKG_STAGE, uniqueName);
    const exportPath = path.join(storagePath, exportDir);
    fse.emptyDirSync(stagePath);
    fse.copySync(exportPath, stagePath);
    console.log('complete'.green);
  }
  
  fse.removeSync(env.TEMP_STORAGE);
}

function* install(dependencies) {
  const packmanObj = yield readPackmanObj('.');
  if (packmanObj === null) {
    console.log('no packman file'.red);
    return;
  }
  
  console.log('installing dependencies...\n');
  const installedDependencies = packmanObj.dependencies || [];
  yield installDependencies(installedDependencies, dependencies);
  
  console.log('updating packman.json...'.yellow);
  const storedDependencies = packmanObj.dependencies || [];
  for (const dependency of dependencies) {
    const contains = storedDependencies.indexOf(dependency) >= 0;
    if (contains)
      continue;
    storedDependencies.push(dependency);
  }
  storedDependencies.sort();
  
  // replace stored dependencies
  packmanObj.dependencies = storedDependencies;
  writePackmanObj('.', packmanObj);
  
  console.log('done'.cyan);
}

function* installAll() {
  const packmanObj = yield readPackmanObj('.');
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
  
  const packmanObj = yield readPackmanObj('.');
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
  writePackmanObj('.', packmanObj);
  
  console.log('removing dependencies...'.yellow);
  
  for (const shortUri of dependencies) {
    const uniqueName = format.toUniqueName(shortUri);
    const storagePath = path.join(env.PKG_STORAGE, uniqueName);
    const stagePath = path.join(env.PKG_STAGE, uniqueName);
    
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
