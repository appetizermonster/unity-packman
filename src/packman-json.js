'use strict';

const path = require('path');
const env = require('./env');
const fse = require('fs-extra');

const uriParser = require('./uri-parser');

function readJson(_path) {
  return new Promise((resolve, reject) => {
    fse.readJson(_path, function(err, obj) {
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
  fse.writeJsonSync(jsonPath, packmanObj, {
    spaces: 2
  });
}

function makeDependenciesUnique(dependencies) {
  if (dependencies.length <= 0)
    return [];

  const usedNames = [];
  const result = [];

  // reverse traverse
  for (let i = dependencies.length - 1; i >= 0; --i) {
    const pkgUri = dependencies[i];
    const pkgInfo = uriParser.toPkgInfo(pkgUri);
    const name = pkgInfo.name;
    // if duplicated
    if (usedNames.indexOf(name) >= 0)
      continue;

    usedNames.push(name);
    result.unshift(pkgUri);
  }
  return result;
}

function convertDependenciesToNames(dependencies) {
  const result = [];
  for (const pkgUri of dependencies) {
    result.push(uriParser.toPkgInfo(pkgUri).name);
  }
  return result;
}

function removeDependencies(srcDependencies, removalDependencies) {
  const result = [];
  const removalPkgNames = convertDependenciesToNames(removalDependencies);
  for (const pkgUri of srcDependencies) {
    const pkgInfo = uriParser.toPkgInfo(pkgUri);
    if (removalPkgNames.indexOf(pkgInfo.name) >= 0)
      continue;
    result.push(pkgUri);
  }
  return result;
}

function resolveStaging(pkgInfo, pkgJson) {
  if(pkgJson.stageTo) {
    return path.resolve(env.ASSETS_ROOT, pkgJson.stageTo).normalize();
  } else {
    return path.resolve(env.PKG_STAGE, pkgInfo.name);
  }
}

module.exports = {
  readJson,
  readPackmanObj,
  writePackmanObj,
  makeDependenciesUnique,
  convertDependenciesToNames,
  removeDependencies,
  resolveStaging
};
