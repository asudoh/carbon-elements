/**
 * @jest-environment node
 */

'use strict';

const { createFsFromVolume, Volume } = require('memfs');

const mockContent = `
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.ChevronDownGlyph = factory());
}(this, (function () {
  'use strict';
  var index = {
    elem: 'svg',
    attrs: {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 12 7',
      width: '12',
      height: '7',
    },
    content: [
      {
        elem: 'path',
        attrs: { d: 'M6.002 5.55L11.27 0l.726.685L6.002 7 0 .685.726 0z' },
      },
    ],
    name: 'chevron--down',
  };
  return index;
})));
`;

describe('search', () => {
  let search;
  let mockVol;
  let mockFs;

  beforeEach(() => {
    jest.resetModules();

    mockVol = Volume.fromJSON({
      '/flat/icon1/index.js': mockContent,
      '/flat/icon2/index.js': mockContent,
      '/flat/icon3/index.js': mockContent,

      '/flat+nested/icon1/index.js': mockContent,
      '/flat+nested/prefix1/icon2/index.js': mockContent,
      '/flat+nested/prefix2/icon3/index.js': mockContent,
      '/flat+nested/prefix3/prefix4/icon4/index.js': mockContent,

      '/flat+nested+sizes/icon1/index.js': mockContent,
      '/flat+nested+sizes/icon2/16.js': mockContent,
      '/flat+nested+sizes/icon3/32.js': mockContent,
      '/flat+nested+sizes/nested1/icon4/32.js': mockContent,

      // NOTE: `@carbon/icons` yields same umd/subdir/name/size.js
      // for both src/size/subdir/name.svg and src/subdir/size/name.svg,
      // and thus no separate case for those scenarios
    });
    mockFs = createFsFromVolume(mockVol);

    jest.mock('fs', () => mockFs);

    search = require('../search');
  });

  it('should throw if the directory does not exist', async () => {
    expect.assertions(1);
    await expect(search('/does-not-exist')).rejects.toThrow();
  });

  it('should treat flat-level icons as glyphs', async () => {
    const results = await search('/flat');
    expect(results.length).toBe(3);
  });

  it('should treat first-level directories that are not named as numbers as prefixes', async () => {
    const results = await search('/flat+nested');
    expect(results.length).toBe(4);
    expect(results[0].prefix).toEqual([]);
    expect(results[1].prefix).toEqual(['prefix1']);
    expect(results[2].prefix).toEqual(['prefix2']);
    expect(results[3].prefix).toEqual(['prefix3', 'prefix4']);
  });

  it('should treat first-level directories named as numbers as sizes', async () => {
    const results = await search('/flat+nested+sizes');
    expect(results.length).toBe(4);

    expect(results.find(result => result.basename === 'icon1').prefix).toEqual(
      []
    );
    expect(results.find(result => result.basename === 'icon2').prefix).toEqual([
      '16',
    ]);
    expect(results.find(result => result.basename === 'icon2').size).toEqual(
      16
    );
    expect(results.find(result => result.basename === 'icon3').prefix).toEqual([
      '32',
    ]);
    expect(results.find(result => result.basename === 'icon3').size).toEqual(
      32
    );
    expect(results.find(result => result.basename === 'icon4').prefix).toEqual([
      '32',
      'nested1',
    ]);
    expect(results.find(result => result.basename === 'icon4').size).toEqual(
      32
    );
  });
});
