'use strict';

const assert = require('assert');
const co = require('co');
const fse = require('fs-extra');
const path = require('path');
const Git = require('simple-git');

function fetchHeadCommit(uri) {
  return new Promise((resolve, reject) => {
    const git = Git();
    git.listRemote([uri, 'HEAD'], function (err, data) {
      if (err)
        return reject(err);
      const result = data.split('\t');
      const hash = result[0];
      assert(hash.length === 40);
      resolve(hash);
    });
  });
}

function fetchLocalHeadCommit(repo) {
  return new Promise((resolve, reject) => {
    const git = Git(repo);
    git.revparse(function (err, data) {
      console.log(data);
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
const PKG_STAGE = path.resolve('Assets/Plugins/packman');

function* checkShouldUpdate(simpleUri) {
  const uniqueName = toUniqueName(simpleUri);
  const gitUri = toGitUri(simpleUri);
  
  const storagePath = path.join(PKG_STORAGE, uniqueName);
  const packmanObj = yield readPackmanObj(storagePath);
  if (packmanObj === null)
    return true;
  
  const localCommit = yield fetchLocalHeadCommit(storagePath);
  if (localCommit === undefined)
    return true;
    
  const headCommit = yield fetchHeadCommit(gitUri);
  if (localCommit !== headCommit)
    return true;
  return false;
}

function* install() {
  const basePackmanObj = yield readPackmanObj('.');
  if (basePackmanObj === null)
    throw new Error('no base packman file');
    
  fse.ensureDirSync(PKG_STORAGE);
  fse.ensureDirSync(PKG_STAGE);  
  
  // find and update dependencies
  const dependencies = basePackmanObj.dependencies;
  const updateableDependencies = [];
  for (const simpleUri of dependencies) {
    const uniqueName = toUniqueName(simpleUri);
    const gitUri = toGitUri(simpleUri);
    
    const isUpdatable = yield checkShouldUpdate(simpleUri);
    if (!isUpdatable)
      continue;
    updateableDependencies.push(simpleUri);
  }

  if (updateableDependencies.length <= 0) {
    console.log('no updatable packages');
    return;
  }

  fse.emptyDirSync(TEMP_STORAGE);
  for (const simpleUri of updateableDependencies) {
    const uniqueName = toUniqueName(simpleUri);
    const gitUri = toGitUri(simpleUri);
    const tempRepoPath = path.join(TEMP_STORAGE, uniqueName);
    
    console.log(`Cloning ${gitUri}`);
    yield cloneRepo(gitUri, tempRepoPath);
    console.log(`Completed`);
    
    const packmanObj = yield readPackmanObj(tempRepoPath);
    if (packmanObj === null) {
      console.log(`${simpleUri} has no packman file`);
      continue;
    }
    
    const storagePath = path.join(PKG_STORAGE, uniqueName);
    fse.emptyDirSync(storagePath);
    fse.copySync(tempRepoPath, storagePath);
  }
  
  fse.removeSync(TEMP_STORAGE);
}

const program = require('commander');

program
  .command('install')
  .description('install dependencies')
  .action(function () {
    co(install()).catch(console.error);
  });
  
program.parse(process.argv);

if (process.argv.slice(2).length === 0)
  program.help();
