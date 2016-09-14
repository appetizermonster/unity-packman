#!/usr/bin/env node
'use strict';

const pkg = require('./package.json');
const packman = require('./src');
const program = require('commander');

console.log('- unity-packman'.bold);

program
  .command('init')
  .description('create packman.json')
  .action(function () {
    packman.init().catch(console.error);
  });

program
  .command('gitignore')
  .description('ensure .gitignore')
  .action(function () {
    packman.gitIgnore().catch(console.error);
  });

program
  .version(pkg.version)
  .command('install')
  .description('install dependencies')
  .action(function () {
    packman.install().catch(console.error);
  });

program.parse(process.argv);

if (process.argv.slice(2).length === 0)
  program.help();
