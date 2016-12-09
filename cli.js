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
  .command('install [pkgs...]')
  .description('install dependencies')
  .action(function(pkgs) {
    packman.install(pkgs).catch(console.error);
  });

program
  .command('open [pkg]')
  .description('opens the package root in Unity as a project.')
  .action(function(pkg) {
    packman.open(pkg).catch(console.error);
  });

program
  .command('config [key] [value]')
  .description('see and set global configuration options.')
  .action(function(key, value) {
    packman.config(key, value).catch(console.error);
  });

program
  .command('remove [pkgs...]')
  .description('remove dependencies')
  .action(function(pkgs) {
    packman.remove(pkgs).catch(console.error);
  });

program
  .command('copyback [pkg]')
  .description('copy modified assets back into repository')
  .action(function(pkg) {
    packman.copyback(pkg).catch(console.error);
  });

program.parse(process.argv);

if (process.argv.slice(2).length === 0)
  program.help();
