"use strict";
/* jshint esnext: true, undef: true, unused: true */
/* global  _ : true, require, process  */

var _    = require('lodash');
var $     = require('cheerio');
var Hogan = require('hogan.js');
var co    = require('co');
var co_fs = require('co-fs');
var path  = require('path');

var templates = {};
var files = _.uniq(
  _.compact(
    _.map(
      process.argv.concat(['Public/applets/MUE/layout.mustache']),
      function (f) {
        if (f.indexOf('.mustache') > 0)
          return path.resolve(f);
      }
    )
  )
);

co(function *() {
  var contents = _.compact(
    _.map(
      files,
      function (v) {
        if (v.indexOf('.mustache') < 1)
          return;
        return co_fs.readFile(v);
      }
    ) // map
  );

  return(yield contents);
})
.then(
  function (r) {
    _.each(r, function (v, i) { return templates[files[i]] = v.toString();} );
    return templates;
  },
  function (err) { console.error(err.stack); }
).then(function (t) {
  var partials = {};

  _.each(t, function (string, file) {
    var raw = file.split('/').pop().split('.');
    raw.pop();
    partials[raw.join('.')] = string;
  });

  _.each(partials, function (string, name) {
    if (name !== 'layout')
      return;
    var html = Hogan.compile(string).render(partials, partials);
    console.log(
      $(html).find('title').text()
    );
  });
});


