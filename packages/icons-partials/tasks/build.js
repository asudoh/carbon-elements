'use strict';

const build = require('../src/build');

build({ cwd: process.cwd() }).catch(error => {
  // eslint-disable-next-line no-console
  console.error(error);
});
