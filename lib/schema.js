'use strict';

const DIR_SCOPE = ['global', 'system', 'local', 'memory'];

const DIR_TABLE = ['dictionary', 'registry', 'entity', 'details', 'relation'];
const DIR_DATA = ['form', 'view', 'projection'];
const DIR_SYSTEM = [...DIR_TABLE, ...DIR_DATA];
const DIR_AUX = ['log', 'struct'];
const DIR_KIND = [...DIR_SYSTEM, ...DIR_AUX];

const isUpperCamel = (s) => !!s && s[0] === s[0].toUpperCase();

const parseDirective = (value) => {
  const short = typeof value === 'string';
  if (short) {
    const [kind, scope] = value.split(' ').reverse();
    value = { scope, kind };
  }
  if (!DIR_KIND.includes(value.kind)) {
    throw new Error(`Unknown kind directive: ${value.kind}`);
  }
  if (!value.scope) {
    if (value.kind === 'struct') value.scope = 'memory';
    else if (value.kind === 'log') value.scope = 'local';
    else value.scope = 'system';
  }
  if (!DIR_SCOPE.includes(value.scope)) {
    throw new Error(`Unknown scope directive: ${value.scope}`);
  }
  return value;
};

class Schema {
  constructor(name, raw) {
    this.name = name;
    this.scope = 'system';
    this.kind = 'entity';
    this.fields = {};
    this.indexes = {};
    this.validate = raw.validate || null;
    this.format = raw.format || null;
    this.parse = raw.parse || null;
    this.serialize = raw.serialize || null;
    this.preprocess(raw);
  }

  preprocess(raw) {
    const keys = Object.keys(raw);
    let first = true;
    for (const key of keys) {
      const value = raw[key];
      if (first && isUpperCamel(key)) {
        const { scope, kind } = parseDirective(value);
        this.scope = scope;
        this.kind = kind;
        continue;
      }
      first = false;
      const short = typeof value === 'string';
      const def = short ? { type: value } : value;
      if (!def.type) {
        this.indexes[key] = def;
        continue;
      }
      if (!Reflect.has(def, 'required')) def.required = true;
      if (def.length) {
        if (typeof def.length === 'number') {
          def.length = { max: def.length };
        } else if (Array.isArray(def.length)) {
          const [min, max] = def.length;
          def.length = { min, max };
        }
      }
      this.fields[key] = def;
    }
  }
}

module.exports = { Schema };