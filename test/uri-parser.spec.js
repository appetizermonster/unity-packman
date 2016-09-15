'use strict';

const assert = require('chai').assert;
const uriParser = require('../src/uri-parser');

describe('uri-parser.js', () => {
  describe('toRepoInfo', () => {
    it('should add raw uri to result', () => {
      const shortUri = 'appetizermonster/Unity3D-Co';
      const repoInfo = uriParser.toRepoInfo(shortUri);
      assert.equal(repoInfo.uri, shortUri);
    });

    it('should parse "user/repository"', () => {
      const repoInfo = uriParser.toRepoInfo('appetizermonster/Unity3D-Co');
      assert.equal(repoInfo.name, 'Unity3D-Co');
      assert.equal(repoInfo.git, 'https://github.com/appetizermonster/Unity3D-Co.git');
    });

    it('should parse "user/repository?commit=sha1hash"', () => {
      const commitHash = '6236ae6ed9e57de626b31e8d1c0957e074cf9331';
      const repoInfo = uriParser.toRepoInfo(`appetizermonster/Unity3D-Co?commit=${commitHash}`);
      assert.equal(repoInfo.name, 'Unity3D-Co');
      assert.equal(repoInfo.git, 'https://github.com/appetizermonster/Unity3D-Co.git');
      assert.equal(repoInfo.commit, commitHash);
    });

    it('should parse "user/repository?branch=something"', () => {
      const branch = 'develop';
      const repoInfo = uriParser.toRepoInfo(`appetizermonster/Unity3D-Co?branch=${branch}`);
      assert.equal(repoInfo.name, 'Unity3D-Co');
      assert.equal(repoInfo.git, 'https://github.com/appetizermonster/Unity3D-Co.git');
      assert.equal(repoInfo.branch, branch);
      assert.equal(repoInfo.ref, `refs/heads/${branch}`);
    });

    it('should parse "user/repository?tag=v0.0.1"', () => {
      const tag = 'v0.0.1';
      const repoInfo = uriParser.toRepoInfo(`appetizermonster/Unity3D-Co?tag=${tag}`);
      assert.equal(repoInfo.name, 'Unity3D-Co');
      assert.equal(repoInfo.git, 'https://github.com/appetizermonster/Unity3D-Co.git');
      assert.equal(repoInfo.tag, tag);
      assert.equal(repoInfo.ref, `refs/tags/${tag}`);
    });
  });
});
