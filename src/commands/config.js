'use strict';

const jsonfile = require('jsonfile');
const osenv = require('osenv');
const path = require('path');
const file = path.join(osenv.home(), '.packman-config');

const globalConfig = require('../global-config');

module.exports = function*(key, value) {
  if (!key) {
    console.log('current config:'.green);
    for (let attr in globalConfig) {
      console.log(`\t${attr}: ${globalConfig[attr] == null ? 'Not set' : globalConfig[attr]}`.green);
    }
    console.log("");
    console.log('please specify config key/value pair with unity-package config $KEY $VALUE');
    return;
  }

  console.log(`Setting ${key} to ${value}`.green);
  globalConfig[key] = value;

  jsonfile.writeFileSync(file, globalConfig);

  console.log('done'.green);
};
