'use strict';

const Handlebars = require('handlebars');
const helpers = require('handlebars-helpers');
const partials = require('@carbon/icons-partials');
const { registerPartials } = require('@carbon/icons-handlebars');

// Use `handlebars-helpers`
helpers(Handlebars);

// Register Handlebars partials from `@carbon/icons-partials`
registerPartials(Handlebars, partials);

// eslint-disable-next-line no-console
console.log(
  Handlebars.compile(
    `{{> carbon-icon-chevron-down attr-class="bx--foo" attr-data-foo="foo" }}`
  )()
);
