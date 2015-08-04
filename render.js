"use strict";
/* jshint esnext: true, undef: true, unused: true */
/* global  _ : true, require, process  */

// var $      = require('cheerio');
var _         = require('lodash');
var Hogan     = require('hogan.js');
var co        = require('co');
var co_fs     = require('co-fs');
var path      = require('path');
var templates = require('./templates.js');

if (_.last(process.argv) === 'clear!') {
  templates = {};
}

var files = _.uniq(
  _.compact(
    _.map(
      process.argv,
      function (f) {
        if (f.indexOf('.mustache') > 0)
          return path.resolve(f);
      }
    )
  )
);


function show_err(err) {
  console.error(err.stack);
  console.log('done');
}


co(function *() {

  var contents = yield _.compact(
    _.map(
      files,
      function (v) {
        if (v.indexOf('.mustache') < 1)
          return;
        return co_fs.readFile(v);
      }
    ) // map
  );


  _.each(contents, function (v, i) {
    var string = v.toString();
    var pieces  = files[i].split('/');
    var dir    = pieces[pieces.length-2];
    var raw    = pieces[pieces.length-1].split('.');
    raw.pop();
    var name   = raw.join('.');

    var mustache = Hogan.compile(string, {asString: 1});
    if (!templates[dir])
      templates[dir] = {};
    if (!templates[dir][name])
      templates[dir][name] = {};
    templates[dir][name].code      = mustache;
    templates[dir][name].file_name = files[i];
  });

  var templates_mustache = (yield co_fs.readFile('templates.js.mustache')).toString();

  var compiled = Hogan
  .compile(templates_mustache)
  .render({code: JSON.stringify(templates)});

  yield co_fs.writeFile('templates.js', compiled);

  if (_.isEmpty(templates)) {
    console.log("=== Templates cleared.");
  } else {
    console.log("=== Template rendered: " + _.map(files, function (f) {
      return f.match(/[^\/]+\/[^\/]+\.mustache$/)[0];
    }).join(', '));
  }


}).catch(show_err);

