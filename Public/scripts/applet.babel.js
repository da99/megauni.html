/* jshint undef: true, unused: true */
/* global _ */
"use strict";

var Applet;

Applet = (function () {

  var _$;

  _$ = {
    log: function log() {
      if (window.console) return console.log.apply(console, arguments);
      return this;
    },

    to_type: function to_type(raw) {
      if (!_.isString(raw)) return new Error("Only one String allowed.");

      return raw.split(':').map(_.trim).map(function (pair) {
        return {
          name: pair[0],
          type: _$.standardize_type(pair[1])
        };
      });
    },

    comma_split: function comma_split(str) {
      return str.split(",").map(_.trim);
    },

    is_blank_string: function is_blank_string(str) {
      return _.trim(str) === '';
    },

    args: function args(raw_args) {
      for (var _len = arguments.length, raw_names = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        raw_names[_key - 1] = arguments[_key];
      }

      var names = raw_names.map(function (x) {
        return _$.to_type(x);
      });
      return names.reduce(function (o, curr, i, arr) {
        return raw_args && o && arr;
      }, {});
    },

    space_split: function space_split(s) {
      return s.split(/\s+/g);
    },

    funcs: function funcs(mod) {
      for (var _len2 = arguments.length, raw_names = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        raw_names[_key2 - 1] = arguments[_key2];
      }

      return _(raw_names).map(_$.space_split).flattenDeep().map(_$.comma_split).flattenDeep().reject(_$.is_blank_string).map(function (name) {
        if (mod.hasOwnProperty(name) && _.isFunction(mod[name])) return mod[name];
        throw new Error("Function \"" + name.toString + "\" not found on: " + mod.toString());
      }).value();
    },

    applet: {
      new: function _new() {
        return {
          funcs: [],
          data_cache: {}
        };
      }
    } // === applet { ... }

  }; // === _$

  return _$;
})(); // === module Applet

//# sourceMappingURL=applet.babel.js.map