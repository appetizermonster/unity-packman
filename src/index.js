'use strict';

const assert = require('assert');
const co = require('co');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const Git = require('simple-git');
const colors = require('colors');

function fetchHeadCommit(uri) {
  return new Promise((resolve, reject) => {
    const git = Git();
    git.listRemote([uri, 'HEAD'], function (err, data) {
      if (err)
        return reject(err);
      const result = data.split('\t');
      const hash = result[0];
      assert(hash.length === 40);
      return resolve(hash);
    });
  });
}

function fetchLocalHeadCommit(repo) {
  return new Promise((resolve, reject) => {
    const git = Git(repo);
    git.revparse(['HEAD'], function (err, data) {
      if (err)
        return reject(err);
      return resolve(data.replace(/\r?\n/, ''));
    });
  });
}

function cloneRepo(uri, dest) {
  return new Promise((resolve, reject) => {
    fse.emptyDirSync(dest);
    
    const git = Git();
    git.clone(uri, dest, function (err, data) {
      if (err)
        return reject(err);
      return resolve();
    });
  });
}

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

function toGitUri(simpleUri) {
  return `https://github.com/${simpleUri}.git`; 
}

function toUniqueName(simpleUri) {
  return simpleUri.split('/')[1];
}

const PKG_STORAGE = path.resolve('.packman');
const TEMP_STORAGE = path.resolve('.tmp_packman');
const PKG_STAGE = path.resolve('Assets/Plugins/packman-pkgs');

function* checkShouldUpdate(simpleUri) {
  const uniqueName = toUniqueName(simpleUri);
  const gitUri = toGitUri(simpleUri);
  
  const storagePath = path.join(PKG_STORAGE, uniqueName);
  const packmanObj = yield readPackmanObj(storagePath);
  if (packmanObj === null)
    return true;
  
  const localCommit = yield fetchLocalHeadCommit(storagePath);
  console.log(`${simpleUri}: local: ${localCommit}`.yellow);
  if (localCommit === undefined)
    return true;
    
  const remoteCommit = yield fetchHeadCommit(gitUri);
  console.log(`${simpleUri}: remote: ${remoteCommit}`.yellow);
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
  const ignorePaths = ['node_modules/', 'packman-pkgs/', '.packman/'];
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

function* install() {
  const basePackmanObj = yield readPackmanObj('.');
  if (basePackmanObj === null)
    throw new Error('no base packman file');
    
  fse.ensureDirSync(PKG_STORAGE);
  fse.ensureDirSync(PKG_STAGE);  
  
  console.log('inspecting dependencies...\n');
  
  fse.emptyDirSync(TEMP_STORAGE);
  
  const dependencies = basePackmanObj.dependencies;
  const doneDeps = [];
  const waitingDeps = [].concat(dependencies);
  while (waitingDeps.length > 0) {
    const simpleUri = waitingDeps.pop();
    doneDeps.push(simpleUri);
    
    const uniqueName = toUniqueName(simpleUri);
    const gitUri = toGitUri(simpleUri);
    const tempRepoPath = path.join(TEMP_STORAGE, uniqueName);
    
    const isUpdatable = yield checkShouldUpdate(simpleUri);
    if (!isUpdatable) {
      console.log(`no need to update: ${simpleUri}`.green);
      continue;
    }
      
    console.log(`cloning ${gitUri}`);
    yield cloneRepo(gitUri, tempRepoPath);
    
    const packmanObj = yield readPackmanObj(tempRepoPath);
    if (packmanObj === null) {
      console.log(`${simpleUri} has no packman file`.red);
      continue;
    }
  
    // inspecting another dependencies    
    const deps = packmanObj.dependencies;
    if (deps) {
      console.log(`inspecting dependencies from ${simpleUri}`);
      for (const dep of deps) {
        if (doneDeps.indexOf(dep) >= 0 || waitingDeps.indexOf(dep) >= 0)
          continue;
        if (dep === simpleUri)
          continue;
        console.log(`found dependency: ${dep}`.yellow);
        waitingDeps.push(dep);
      }
    }
    
    const exportDir = packmanObj.export;
    if (!exportDir) {
      console.log(`${simpleUri} has no export directory`.red);
      continue;
    }
       
    const storagePath = path.join(PKG_STORAGE, uniqueName);
    fse.emptyDirSync(storagePath);
    fse.copySync(tempRepoPath, storagePath);
    
    console.log(`copying to stage: ${simpleUri}`);
    const stagePath = path.join(PKG_STAGE, uniqueName);
    const exportPath = path.join(storagePath, exportDir);
    fse.emptyDirSync(stagePath);
    fse.copySync(exportPath, stagePath);
    console.log('complete'.green);
  }
  
  fse.removeSync(TEMP_STORAGE);
  console.log('done'.cyan);
}

module.exports = {
  init: co.wrap(init),
  gitIgnore: co.wrap(gitIgnore),
  install: co.wrap(install) 
};
