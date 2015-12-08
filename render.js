/* jshint evil : true, esnext: true, undef: true, unused: true */
/* global $ : true, _ : true, require, process  */
"use strict";

var $         = require('cheerio');
var _         = require('lodash');
var Hogan     = require('hogan.js');
var co        = require('co');
var co_fs     = require('co-fs');
var path      = require('path');
var templates = {};
var layout    = null;
var he        = require('he');

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

function get_comments(original_html) {
  var html;
  var has_body = original_html.match(/<body/i);

  if (!has_body)
    html = "<html><body>" + original_html + "</body></html>";
  else
    html = original_html;


  return _.compact(_.map($('body', html).contents(), function (node) {
    if (node.type === 'comment')
      return node.data;
  }));
}

function get_attrs(html) {
  var attrs = {};
  _.each(get_comments(html), function (data) {
    var lines  = data.split("\n");
    var key    = _.trim(lines.shift());
    attrs[key] = _.trim(lines.join("\n"));
  });

  return(attrs);
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


    var attrs = get_attrs(string);

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
  _.each(templates, function (files) {
    _.each(files, function (meta, name) {
      if (name === 'layout')
        return;


      var final_html = compiled_to_compiler(layout.code).render(meta.attrs, {markup: compiled_to_compiler(meta.code)});

      var q = $.load(
        final_html, {
          decodeEntities: false // === Prevents &apos; to be used.
                                //     Cheerio sets it to true to fix some other bug.
        }
      );

      let mustaches = q('mustache');

      _.each(mustaches, function (raw) {
        raw.name = "script";
        $(raw).attr('type', "text/mustache");
        $(raw).text(he.encode($(raw).html() || ''));
      });


      if (meta.attrs['PUBLIC FILE']) {
        console.log('Public' + meta.attrs['PUBLIC FILE']);
      } else {
        console.log(meta.file_name);
      }

      console.log(q.html());
    });
  });



}).catch(show_err);

