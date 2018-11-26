/**
 * @jest-environment node
 */

/* eslint-disable import/no-dynamic-require */

'use strict';

const fs = require('fs-extra');
const path = require('path');
const { BUILD_CJS_DIR } = require('../src/paths');

describe('CommonJS', () => {
  it('should build an entrypoint that is require-able', async () => {
    const indexJsPath = path.join(BUILD_CJS_DIR, 'index.js');
    expect(await fs.pathExists(indexJsPath)).toBe(true);
    expect(() => {
      require(indexJsPath);
    }).not.toThrow();
  });
});
