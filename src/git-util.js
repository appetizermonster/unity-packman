'use strict';

const Git = require('simple-git');
const fse = require('fs-extra');

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

module.exports = { fetchHeadCommit, fetchLocalHeadCommit, cloneRepo };
