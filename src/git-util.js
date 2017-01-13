'use strict';

const assert = require('assert');
const Git = require('simple-git');
const fse = require('fs-extra');
const path = require('path');
const env = require('./env');
const packmanJson = require('./packman-json');

function* checkShouldUpdate(pkgInfo) {
  const repoPath = path.join(env.PKG_REPO, pkgInfo.name);
  const packmanObj = yield packmanJson.readPackmanObj(repoPath);
  if (packmanObj === null)
    return true;

  const localCommit = yield fetchLocalHeadCommit(repoPath, pkgInfo.ref);
  console.log(`${pkgInfo.name}: local: ${localCommit}`.yellow);
  if (localCommit === undefined)
    return true;

  // if targeting specific commit
  if (pkgInfo.commit)
    return (localCommit !== pkgInfo.commit);

  const remoteCommit = yield fetchRemoteHeadCommit(pkgInfo.git, pkgInfo.ref);
  console.log(`${pkgInfo.name}: remote: ${remoteCommit}`.yellow);
  if (localCommit !== remoteCommit)
    return true;
  return false;
}

function fetchRemoteHeadCommit(uri, ref) {
  return new Promise((resolve, reject) => {
    const git = Git();
    git.listRemote([uri, ref], function(err, data) {
      if (err)
        return reject(err);
      const result = data.split('\t');
      const hash = result[0];
      assert(hash.length === 40);
      return resolve(hash);
    });
  });
}

function fetchLocalHeadCommit(repo, ref) {
  return new Promise((resolve, reject) => {
    const git = Git(repo);
    git.revparse(['--verify', '-q', ref], function(err, data) {
      if (err)
        return reject(err);
      return resolve(data.replace(/\r?\n/g, ''));
    });
  });
}

function clone(uri, dest) {
  return new Promise((resolve, reject) => {
    fse.emptyDirSync(dest);

    const git = Git();
    git.clone(uri, dest, function(err, data) {
      if (err)
        return reject(err);
      return resolve();
    });
  });
}

function checkout(repo, target) {
  return new Promise((resolve, reject) => {
    const git = Git(repo);
    git.checkout(target, function(err, data) {
      if (err)
        return reject(err);
      return resolve();
    });
  });
}

module.exports = {
  checkShouldUpdate,
  fetchRemoteHeadCommit,
  fetchLocalHeadCommit,
  clone,
  checkout
};
