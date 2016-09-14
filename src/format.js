'use strict';

function toGitUri(shortUri) {
  return `https://github.com/${shortUri}.git`; 
}

function toUniqueName(shortUri) {
  return shortUri.split('/')[1];
}

module.exports = {
  toGitUri, toUniqueName
};
