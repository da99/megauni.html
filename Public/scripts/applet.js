/* jshint undef: true, unused: true */
/* global _ */
"use strict";

var Applet;

Applet = (function () {

  var _$;

  _$ = {
    log : function () {
      if (window.console)
        return console.log.apply(console, arguments);
      return this;
    },

    to_type : function (raw) {
      if (!_.isString(raw))
        return new Error("Only one String allowed.");

      return raw
      .split(':')
      .map(_.trim)
      .map(function (pair) {
        return {
          name: pair[0],
          type: _$.standardize_type(pair[1])
        };
      });
    },

    comma_split: function(str) {
      return str.split(",").map(_.trim);
    },

    is_blank_string : function (str) {
      return _.trim(str) === '';
    },

    args : function (raw_args, ...raw_names) {
      let names = raw_names.map( x => _$.to_type(x));
      return names.reduce(function (o, curr, i, arr) {
        return raw_args && o && arr;
      }, {});
    },

    space_split : function (s) {
      return s.split(/\s+/g);
    },

    funcs : function (mod, ...raw_names) {
      return _(raw_names)
      .map(_$.space_split)
      .flattenDeep()
      .map(_$.comma_split)
      .flattenDeep()
      .reject(_$.is_blank_string)
      .map(function (name) {
        if (mod.hasOwnProperty(name) && _.isFunction(mod[name]))
          return mod[name];
        throw new Error(`Function "${name.toString}" not found on: ${mod.toString()}`);
      })
      .value();
    },

    applet : {
      new: function () {
        return {
          funcs: [],
          data_cache: {},
        };
      }
    } // === applet { ... }

  }; // === _$

  return _$;

})(); // === module Applet

