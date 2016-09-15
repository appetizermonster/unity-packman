'use strict';

const assert = require('chai').assert;
const uriParser = require('../src/uri-parser');

describe('uri-parser.js', () => {
  describe('toPkgInfo', () => {
    it('should add raw uri to result', () => {
      const pkgUri = 'appetizermonster/Unity3D-Co';
      const pkgInfo = uriParser.toPkgInfo(pkgUri);
      assert.equal(pkgInfo.uri, pkgUri);
    });

    it('should basename to result', () => {
      const pkgUri = 'appetizermonster/Unity3D-Co?commit=test';
      const pkgInfo = uriParser.toPkgInfo(pkgUri);
      assert.equal(pkgInfo.basename, 'appetizermonster/Unity3D-Co');
    });

    it('should name to result which have the format like "user.repo"', () => {
      const pkgUri = 'appetizermonster/Unity3D-Co?commit=test';
      const pkgInfo = uriParser.toPkgInfo(pkgUri);
      assert.equal(pkgInfo.name, 'appetizermonster.Unity3D-Co');
    });

    it('should parse "user/repository"', () => {
      const pkgInfo = uriParser.toPkgInfo('appetizermonster/Unity3D-Co');
      assert.equal(pkgInfo.git, 'https://github.com/appetizermonster/Unity3D-Co.git');
    });

    it('should parse "user/repository?commit=sha1hash"', () => {
      const commitHash = '6236ae6ed9e57de626b31e8d1c0957e074cf9331';
      const pkgInfo = uriParser.toPkgInfo(`appetizermonster/Unity3D-Co?commit=${commitHash}`);
      assert.equal(pkgInfo.git, 'https://github.com/appetizermonster/Unity3D-Co.git');
      assert.equal(pkgInfo.commit, commitHash);
    });

    it('should parse "user/repository?branch=something"', () => {
      const branch = 'develop';
      const pkgInfo = uriParser.toPkgInfo(`appetizermonster/Unity3D-Co?branch=${branch}`);
      assert.equal(pkgInfo.git, 'https://github.com/appetizermonster/Unity3D-Co.git');
      assert.equal(pkgInfo.branch, branch);
      assert.equal(pkgInfo.ref, `refs/heads/${branch}`);
    });

    it('should parse "user/repository?tag=v0.0.1"', () => {
      const tag = 'v0.0.1';
      const pkgInfo = uriParser.toPkgInfo(`appetizermonster/Unity3D-Co?tag=${tag}`);
      assert.equal(pkgInfo.git, 'https://github.com/appetizermonster/Unity3D-Co.git');
      assert.equal(pkgInfo.tag, tag);
      assert.equal(pkgInfo.ref, `refs/tags/${tag}`);
    });
  });
});
