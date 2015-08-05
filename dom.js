'use strict';

var he = require('he');
var fs = require('fs');
var _ = require('lodash');
var jsdom = require('jsdom')
  , html = fs.readFileSync('Public/applets/homepage/markup.mustache').toString()
;

var co = require('co')

function show_err(err) {
  console.error(err);
  console.log('done w/errors');
}

function get_comments(html) {
  return new Promise(
    function (res, rej) {
      jsdom.env({
        html: html,
        src: [require('fs').readFileSync("./node_modules/jquery/dist/jquery.min.js")],
        done: function (errors, window) {
          if (errors) {
            rej(errors);
            return;
          }

          var comments = _.compact(window.$(window.document).contents().map(function (i, node) {
            if (node.nodeType === 8)
              return(node);
          }));

          res(comments);
        } // done
      });
    }
  ); // return
} // function get_comments

function *get_attrs(html) {
  var comments = yield(get_comments(html));

  var attrs = {};
  _.each(comments, function (node) {
    var lines = node.nodeValue.split("\n");
    var key = _.trim(lines.shift());
    attrs[key] = _.trim(lines.join("\n"));
  });

  return(attrs);
}

co(function *() {
  console.log(yield get_attrs(html))
}).catch(show_err);

// first argument can be html string, filename, or url
