#!/usr/bin/env node

'use strict';

const colors = require('colors'); // DO NOT REMOVE
const pkg = require('./package.json');
const packman = require('./src');
const program = require('commander').command('unity-packman');

console.log(`- unity-packman ${pkg.version}`.bold);

program
  .command('init')
  .description('create packman.json')
  .action(function() {
    packman.init().catch(console.error);
  });

program
  .command('gitignore')
  .description('update .gitignore')
  .action(function() {
    packman.gitIgnore().catch(console.error);
  });

program
  .command('install [repo...]')
  .description('install dependencies')
  .action(function(repos) {
    packman.install(repos).catch(console.error);
  });

program
  .command('remove [repo...]')
  .description('remove dependencies')
  .action(function(repos) {
    packman.remove(repos).catch(console.error);
  });

program
  .command('shrinkwrap')
  .description('lock down dependencies commit')
  .action(function(repos) {
    packman.shrinkwrap().catch(console.error);
  });

program.parse(process.argv);

if (process.argv.slice(2).length === 0)
  program.help();
