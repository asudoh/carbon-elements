/**
 * @jest-environment node
 */

'use strict';

const {
  ChevronDownGlyph,
  ChevronDown16,
  ChevronDown32,
} = require('@carbon/icons-partials');

const { registerPartials } = require('../');

class MockHandlebars extends Map {
  registerPartial = this.set;
}

describe('registerPartials', () => {
  it('should register sizeless variant with base name', () => {
    const mockHandlebars = new MockHandlebars();
    registerPartials(mockHandlebars, { ChevronDownGlyph });
    expect(mockHandlebars.get('carbon-icon-chevron-down')).toBe(
      ChevronDownGlyph.partial
    );
  });

  it('should register sized variant with base name and size', () => {
    const mockHandlebars = new MockHandlebars();
    registerPartials(mockHandlebars, { ChevronDown32 });
    expect(mockHandlebars.get('carbon-icon-chevron-down-32')).toBe(
      ChevronDown32.partial
    );
  });

  it('should register sized variant with base name if there is no sizeless one', () => {
    const mockHandlebars = new MockHandlebars();
    registerPartials(mockHandlebars, { ChevronDown32 });
    expect(mockHandlebars.get('carbon-icon-chevron-down')).toBe(
      ChevronDown32.partial
    );
  });

  it('should take sizeless one the precedence for choosing the one with the base name', () => {
    const mockHandlebars = new MockHandlebars();
    registerPartials(mockHandlebars, { ChevronDownGlyph, ChevronDown32 });
    expect(mockHandlebars.get('carbon-icon-chevron-down')).toBe(
      ChevronDownGlyph.partial
    );
    expect(mockHandlebars.get('carbon-icon-chevron-down-32')).toBe(
      ChevronDown32.partial
    );
  });

  it('should take bigger sized one the precedence for choosing the one with the base name', () => {
    const mockHandlebars = new MockHandlebars();
    registerPartials(mockHandlebars, { ChevronDown16, ChevronDown32 });
    expect(mockHandlebars.get('carbon-icon-chevron-down')).toBe(
      ChevronDown32.partial
    );
    expect(mockHandlebars.get('carbon-icon-chevron-down-16')).toBe(
      ChevronDown16.partial
    );
    expect(mockHandlebars.get('carbon-icon-chevron-down-32')).toBe(
      ChevronDown32.partial
    );
  });
});
