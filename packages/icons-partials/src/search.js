'use strict';

const fs = require('fs-extra');
const path = require('path');
const globby = require('globby');

async function search(directory) {
  if (!(await fs.pathExists(directory))) {
    throw new Error(`Unable to find directory at: \`${directory}\``);
  }

  const paths = await globby(path.resolve(directory, '**/*.js'));

  return paths.map(filepath => {
    const relative = path.relative(directory, filepath);
    const basename = path.basename(filepath, '.js');
    const dirnameParts = path
      .dirname(relative)
      .split(path.sep)
      .filter(Boolean);
    const size = isNaN(basename) ? undefined : Number(basename);
    const sizeParts = size ? [String(size)] : [];
    const prefix = [...sizeParts, ...dirnameParts];
    const name = prefix.pop();
    const file = {
      filepath,
      filename: `${name}.js`,
      basename: name,
      prefix,
    };
    if (size) {
      file.size = size;
    }
    return file;
  });
}

module.exports = search;
