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
    packman.gitignore().catch(console.error);
  });

program
  .command('install [pkgs...]')
  .option('-d, --dev', 'Mark dependency as a dev dependency which will not be in a release build')
  .option('-r, --release', 'Install only the non-dev dependencies')
  .description('install dependencies')
  .action(function(pkgs, options) {
    packman.install(pkgs, options).catch(console.error);
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
  .option('-d, --dev', 'Mark dependency as a dev dependency which will not be in a release build')
  .description('remove dependencies')
  .action(function(pkgs, options) {
    packman.remove(pkgs, options).catch(console.error);
  });

program
  .command('copyback [pkg]')
  .option('-a. --all', 'Call copyback logic on the dependency graph')
  .option('-d, --direct', 'Call copyback on all packages directly dependended upon')
  .description('copy modified assets back into repository')
  .action(function(pkg, options) {
    packman.copyback(pkg, options).catch(console.error);
  });

program.parse(process.argv);

if (process.argv.slice(2).length === 0)
  program.help();
