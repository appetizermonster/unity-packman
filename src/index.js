'use strict';

const co = require('co');
const fs = require('fs');
const path = require('path');

const commands = {};

// find commands
const baseDir = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(baseDir);

for (const file of commandFiles) {
  const isCommand = file.endsWith('.js');
  if (!isCommand)
    continue;

  const commandName = path.basename(file, '.js');
  const commandFunc = require(path.join(baseDir, file));

  commands[commandName] = co.wrap(commandFunc);
}

module.exports = commands;
