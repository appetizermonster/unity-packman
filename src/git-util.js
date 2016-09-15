'use strict';

const assert = require('assert');
const Git = require('simple-git');
const fse = require('fs-extra');

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
  fetchRemoteHeadCommit,
  fetchLocalHeadCommit,
  clone,
  checkout
};
