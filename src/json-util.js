'use strict';

const path = require('path');
const fse = require('fs-extra');

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

module.exports = {
  readJson,
  readPackmanObj,
  writePackmanObj
};
