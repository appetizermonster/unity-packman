'use strict';

const jsonfile = require('jsonfile');
const osenv = require('osenv');
const path = require('path');
const file = path.join(osenv.home(), '.packman-config');

var config = {
  unity: null,
  localRepo: null
};

try {
  config = jsonfile.readFileSync(file);
}
catch (e) {
}

module.exports = config;
