/**
 * @jest-environment node
 */

'use strict';

const path = require('path');
const klaw = require('klaw-sync');
const { BUILD_ES_DIR } = require('../src/paths');

function filter(item) {
  return item[0] === '.';
}

const umdDir = path.resolve(
  path.dirname(require.resolve('@carbon/icons/package.json')),
  'umd'
);

const icons = klaw(umdDir, { filter, nodir: true });
const buildFiles = klaw(BUILD_ES_DIR, { filter, nodir: true });

describe('es', () => {
  it('should export all files as ES files', () => {
    expect(icons.length).toEqual(buildFiles.length);
  });
});
