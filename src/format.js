'use strict';

function toGitUri(simpleUri) {
  return `https://github.com/${simpleUri}.git`; 
}

function toUniqueName(simpleUri) {
  return simpleUri.split('/')[1];
}

module.exports = {
  toGitUri, toUniqueName
};
