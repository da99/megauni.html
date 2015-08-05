"use strict";
/* jshint evil : true, esnext: true, undef: true, unused: true */
/* global $ : true, _ : true, require, process  */

var $         = require('cheerio');
var he        = require('he');
var _         = require('lodash');
var Hogan     = require('hogan.js');
var co        = require('co');
var co_fs     = require('co-fs');
var path      = require('path');
var templates = {};
var layout    = null;


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

var compiled_to_compiler = function (code) {
  var f = new Function('Hogan', 'return new Hogan.Template(' + code + ');' );
  return f(Hogan);
};

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
    var attrs;
    var dom = $.load(string, {xmlMode: true});
    var configs = dom('config');

    configs.each(function (i, node) {
      attrs     = $(node).attr();
      var html  = $(node).html();
      var first = _.keys(attrs)[0];
      if (_.size(attrs) === 1 && _.isEmpty(attrs[first]))
        attrs[first] = html;
    });

    if ( name !== 'layout' ) {
      _.each(dom('script[type="text/applet"]'), function (node) {
        $(node).text(he.encode($(node).html()));
      });

    }

    var mustache = Hogan.compile(string, {asString: 1, delimiters: '[[ ]]'});

    if (!templates[dir])
      templates[dir] = {};

    if (!templates[dir][name])
      templates[dir][name] = {};

    templates[dir][name] = _.extend(
      templates[dir][name],
      {
        attrs     : (attrs || {}),
        dir       : dir,
        source    : string,
        name      : name,
        code      : mustache,
        file_name : files[i]
      }
    );

    if (name === 'layout')
      layout = templates[dir][name];
  }); // === each contents

  // var new_files = [];
  // === Render templates to html files:
  _.each(templates, function (files, dir) {
    _.each(files, function (meta, name) {
      if (name === 'layout')
        return;

      var final_html = compiled_to_compiler(layout.code).render(meta.attrs, {markup: compiled_to_compiler(meta.code)});

      var dom = $.load(final_html, {xmlMode: true});
      dom('config').remove();
      _.each(dom('script[type="text/applet"]'), function (node) {
        $(node).text(he.encode($(node).html()));
      });

      switch (dir + '/' + name) {
        case 'homepage/markup':
          // new_files.push(['Public/index.html', dom.html()]);
          console.log('Public/index.html');
          console.log(dom.html());
        break;
      } // === switch dir + '/' + name
    });
  });


  // yield _.map(new_files, function (pair) {
    // return co_fs.writeFile(pair[0], pair[1]);
  // });

  // _.each(new_files, function (pair) {
    // console.log("=== Wrote: %s", pair[0]);
  // });

  // === Save the compiled templates to: templates.js
  // var templates_mustache = (yield co_fs.readFile('templates.js.mustache')).toString();

  // yield co_fs.writeFile(
    // 'templates.js',
    // Hogan
    // .compile(templates_mustache)
    // .render({code: JSON.stringify(templates)})
  // );

  // if (_.isEmpty(templates)) {
    // console.log("=== Templates cleared.");
  // } else {
    // console.log("=== Templates rendered: " + _.map(files, function (f) {
      // return f.match(/[^\/]+\/[^\/]+\.mustache$/)[0];
    // }).join(', '));
  // }


}).catch(show_err);

