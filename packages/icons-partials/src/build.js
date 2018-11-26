'use strict';

const fs = require('fs-extra');
const path = require('path');
const { pascal } = require('change-case');
const prettier = require('prettier');
const { rollup } = require('rollup');
const { reporter } = require('@carbon/cli-reporter');
const { toString: iconHelpersToString } = require('@carbon/icon-helpers');
const search = require('./search');
const { flatMapAsync } = require('./tools');

const prettierOptions = {
  parser: 'babylon',
  printWidth: 80,
  singleQuote: true,
  trailingComma: 'es5',
};

async function build({ cwd } = {}) {
  const iconsModulePath = getIconsModulePath();
  if (!iconsModulePath) {
    return;
  }

  const packageJson = await findPackageJsonFor(cwd);
  const {
    main: commonjsEntrypoint = 'lib/index.js',
    module: esmEntrypoint = 'es/index.js',
    umd: umdEntrypoint = 'umd/index.js',
  } = packageJson;
  const esmFolder = path.dirname(esmEntrypoint);
  const umdFolder = path.dirname(umdEntrypoint);
  const BUNDLE_FORMATS = [
    {
      format: 'cjs',
      directory: path.join(cwd, path.dirname(commonjsEntrypoint)),
    },
    {
      format: 'umd',
      directory: path.join(cwd, path.dirname(umdEntrypoint)),
    },
  ];

  const files = await search(path.resolve(iconsModulePath, umdFolder));

  reporter.info(`Building the module source for ${files.length} icons...`);

  const partials = files.map(file => {
    const { filepath } = file;
    // eslint-disable-next-line import/no-dynamic-require
    const descriptor = require(filepath);
    const { partial, moduleName } = createPartial(file, descriptor);
    return {
      ...file,
      descriptor,
      partial,
      moduleName,
    };
  });

  reporter.info(
    `Building bundle types: [es, ${BUNDLE_FORMATS.map(b => b.format).join(
      ', '
    )}] under: [${BUNDLE_FORMATS.map(b => b.directory).join(', ')}]`
  );

  reporter.info('Building JavaScript modules...');

  await flatMapAsync(partials, async file => {
    const { basename, moduleName, prefix, size, partial } = file;
    const formattedPrefix = prefix.filter(step => isNaN(step));
    const moduleFolder = path.join(esmFolder, ...formattedPrefix, basename);
    const jsFilepath = path.join(
      moduleFolder,
      size ? `${size}.js` : 'index.js'
    );

    await fs.ensureDir(moduleFolder);
    await fs.writeFile(jsFilepath, partial);

    const esm = {
      ...file,
      outputOptions: {
        format: 'esm',
        file: jsFilepath,
      },
    };
    await Promise.all(
      BUNDLE_FORMATS.map(async ({ format, directory }) => {
        const bundle = await rollup({
          input: jsFilepath,
        });
        const outputOptions = {
          format,
          file: jsFilepath.replace(/es/, directory),
        };
        if (format === 'umd') {
          outputOptions.name = moduleName;
        }
        await bundle.write(outputOptions);
      })
    );
    return esm;
  });

  reporter.info('Building module entrypoints...');

  const entrypoint = prettier.format(
    partials.reduce((acc, file) => {
      const { basename, size, moduleName, descriptor } = file;
      const partialDescriptor = {
        name: basename,
        size,
        partial: `${js2partial(descriptor)}`,
      };
      return (
        acc +
        `\nexport const ${moduleName} = ${JSON.stringify(partialDescriptor)};`
      );
    }, ''),
    prettierOptions
  );
  await fs.writeFile(esmEntrypoint, entrypoint);

  const entrypointBundle = await rollup({
    input: esmEntrypoint,
  });
  await Promise.all(
    BUNDLE_FORMATS.map(({ format, directory }) => {
      const outputOptions = {
        format,
        file: esmEntrypoint.replace(/es/, directory),
      };
      if (format === 'umd') {
        outputOptions.name = 'CarbonIcons';
      }
      return entrypointBundle.write(outputOptions);
    })
  );

  reporter.success('Done! 🎉');
}

function getModuleName(name, size, prefixParts) {
  const prefix = prefixParts
    .filter(size => isNaN(size))
    .map(pascal)
    .join('');

  if (prefix !== '') {
    if (!size) {
      return prefix + pascal(name) + 'Glyph';
    }
    return prefix + pascal(name) + size;
  }

  if (!size) {
    return pascal(name) + 'Glyph';
  }

  if (isNaN(name[0])) {
    return pascal(name) + size;
  }

  return '_' + pascal(name) + size;
}

function createPartial(file, descriptor) {
  const { basename, prefix, size } = file;
  const partialDescriptor = {
    name: basename,
    size,
    partial: `${js2partial(descriptor)}`,
  };
  return {
    partial: prettier.format(
      `export default ${JSON.stringify(partialDescriptor)};`,
      prettierOptions
    ),
    moduleName: getModuleName(basename, size, prefix),
  };
}

function getIconsModulePath() {
  try {
    return path.dirname(require.resolve('@carbon/icons/package.json'));
  } catch (err) {
    reporter.error('Error obtaining @carbon/icons modules directory:');
    reporter.stack(err);
    return '';
  }
}

function js2partial(descriptor) {
  const formattedAttrs = [
    '{{#each this}}',
    '{{#startsWith "attr-" @key}}',
    ` {{removeFirst @key "attr-"}}="{{this}}"`,
    '{{/startsWith}}',
    '{{/each}}',
  ].join('');
  return iconHelpersToString(descriptor)
    .replace(/^\s*(<svg)/, `$1${formattedAttrs}`)
    .replace(
      /(<\/svg>)\s*$/,
      '{{#if attr-aria-label}}<title>{{attr-aria-label}}</title>{{/if}}$1'
    );
}

async function findPackageJsonFor(filepath) {
  let workingDirectory = path.dirname(filepath);
  while (workingDirectory !== path.dirname(workingDirectory)) {
    const files = await fs.readdir(workingDirectory);
    if (files.indexOf('package.json') !== -1) {
      return fs.readFile(path.join(workingDirectory, 'package.json'), 'utf8');
    }
    workingDirectory = path.dirname(workingDirectory);
  }
  throw new Error(
    `Unable to find a corresponding \`package.json\` for file: \`${filepath}\``
  );
}

module.exports = build;
