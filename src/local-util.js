'use strict';

const fse = require('fs-extra');
const fs = require('fs');
const jspath = require('path');
const globalConfig = require('./global-config');

function* checkShouldUpdate(pkgInfo) {
  // TODO: This should compare directories to determine if out of sync
  return true;
}

function clone(uri, dest) {
  return new Promise((resolve, reject) => {
    try {
      fse.emptyDirSync(dest);
      fse.copySync(uri, dest);
      return resolve(true);
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
}

function path(pkgInfo) {
  if (globalConfig.localRepo && fs.existsSync(jspath.join(globalConfig.localRepo, pkgInfo.repo))) {
    return jspath.join(globalConfig.localRepo, pkgInfo.repo)
  }

  if (fs.existsSync(jspath.join(process.cwd(), pkgInfo.repo))) {
    return jspath.join(process.cwd(), pkgInfo.repo);
  }

  if (fs.existsSync(pkgInfo.repo)) {
    return pkgInfo.repo;
  }

  console.error(`Could not find path for ${pkgInfo.name}`);
  throw new Error("Could not find path for " + JSON.stringify(pkgInfo));
}

module.exports = {
  checkShouldUpdate,
  clone,
  path
};
