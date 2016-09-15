'use strict';

function toRepoInfo(shortUri) {
  const regex = /^([^\/\s]+)\/([^?\s]+)\??(commit=[A-Za-z0-9]+)?(branch=\S+)?(tag=\S+)?/;
  const parsed = regex.exec(shortUri);
  if (parsed === null)
    throw new Error(`Uri has wrong format: ${shortUri}`);

  const user = parsed[1];
  const repo = parsed[2];
  const commit = parsed[3];
  const branch = parsed[4];
  const tag = parsed[5];

  const result = {
    uri: shortUri,
    name: repo,
    git: `https://github.com/${user}/${repo}.git`,
    tag: null,
    branch: null,
    commit: null,
    ref: 'HEAD',
    checkoutTarget: null
  };

  if (commit) {
    const _commit = commit.substring(7);
    result.commit = _commit;
    result.checkoutTarget = _commit;
  } else if (branch) {
    const _branch = branch.substring(7);
    result.branch = _branch;
    result.ref = `refs/heads/${_branch}`;
    result.checkoutTarget = _branch;
  } else if (tag) {
    const _tag = tag.substring(4);
    result.tag = _tag;
    result.ref = `refs/tags/${_tag}`;
    result.checkoutTarget = _tag;
  }

  return result;
}

module.exports = {
  toRepoInfo
};
