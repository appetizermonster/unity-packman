'use strict';

const assert = require('chai').assert;
const packmanJson = require('../src/packman-json');

describe('packman-json.js', () => {
  describe('makeDependenciesUnique', () => {
    it('should remove same basename duplication (last one will be preserved)', () => {
      const deps = [
        'abcd/test',
        'hahaha/test',
        'abcd/test?branch=test'
      ];
      const expected = [
        'hahaha/test',
        'abcd/test?branch=test'
      ];
      const result = packmanJson.makeDependenciesUnique(deps);
      assert.deepEqual(result, expected);
    });
  });

  describe('removeDependencies', () => {
    it('should remove target dependencies which have same name', () => {
      const src = [
        'abcd/test',
        'haha/test?commit=test',
        'a/b'
      ];

      const result1 = packmanJson.removeDependencies(src, ['abcd/test']);
      assert.deepEqual(result1, [
        'haha/test?commit=test',
        'a/b'
      ]);

      const result2 = packmanJson.removeDependencies(src, ['haha/test']);
      assert.deepEqual(result2, [
        'abcd/test',
        'a/b'
      ]);
    });
  });
});
