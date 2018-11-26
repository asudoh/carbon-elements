'use strict';

const mapValues = require('lodash.mapvalues');

const SIZE_NONE = 'Glyph';

function registerPartials(Handlebars, partials) {
  const iconsByName = new Map();
  mapValues(partials, ({ name, size, partial }) => {
    const iconsBySize = mapGetOrCreate(iconsByName, name, () => new Map());
    iconsBySize.set(size || SIZE_NONE, partial);
  });

  iconsByName.forEach((iconsBySize, name) => {
    const partialName = `carbon-icon-${name.replace(/-+/g, '-')}`;
    // Register partials for each size
    iconsBySize.forEach((partial, size) => {
      const partialNameWithSize =
        size === SIZE_NONE ? partialName : `${partialName}-${size}`;
      Handlebars.registerPartial(partialNameWithSize, partial);
    });
    // If there is no item without its size, use the biggest one as default size
    if (!iconsBySize.has(SIZE_NONE)) {
      const sizes = Array.from(iconsBySize.keys()).sort(
        (lhs, rhs) => rhs - lhs
      );
      const biggestSize = sizes[0];
      if (biggestSize) {
        Handlebars.registerPartial(partialName, iconsBySize.get(biggestSize));
      }
    }
  });
}

function mapGetOrCreate(map, key, createFn) {
  const existingItem = map.get(key);
  if (existingItem) {
    return existingItem;
  }
  const newItem = createFn(key);
  map.set(key, newItem);
  return newItem;
}

module.exports = registerPartials;
