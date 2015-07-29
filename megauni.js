"use strict";
/* jshint undef: true, unused: true */
/* global Applet, Hogan  */

var MegaUni = {
  stack : []
};

$(function () {

  // === Examples:
  //
  // .run()                    => {name: 'compile scripts'}
  // .run('str')               => {name: 'str'}
  // .run('str', {...})        => {name: 'str', data: {...}}
  // .run({name: 'str', ... }) => {name: 'str', ... }
  //
  MegaUni.run = function (msg, data) {

    var o = {};

    if (!msg) {
      msg = 'compile scripts';
    }

    if (_.isPlainObject(msg)) {
      o = msg;
    } else {
      if (_.isString(msg)) {
        o.name = Applet.standard_name(msg);
        o.data = data;
      }
    }

    _.each(
      [
        'before before ' + o.name,
        'before ' + o.name,
        o.name,
        'after ' + o.name,
        'after after ' + o.name
      ],
      function (name) {
        o.name = Applet.standard_name(name);
        var i = 0, f;
        while (MegaUni.stack[i]) {
          f = MegaUni.stack[i];
          o.this_func = f;
          f(o);
          ++i;
        }
      }
    ); // === _.each name

    return MegaUni;
  }; // === func

  MegaUni.unshift = function (func) {
    MegaUni.stack.unshift(func);
    return MegaUni;
  };

  MegaUni.push = function (func) {
    MegaUni.stack.push(func);
    return MegaUni;
  };

  MegaUni.push(
    function (o) {
      if (o.name === 'before compile scripts') {
        Applet.each_raw_script(
          function (script, all) {
            o.script = script;
            o.all    = all;
          }
        );
      }

      if (o.name === 'after compile scripts') {
        ($(o.script).contents()).insertBefore($(o.script));
      }
    }
  );

  MegaUni.templates = [];
  MegaUni.push(
    function (o) {
      if (o.name === 'reset') {
        MegaUni.templates = [];
        return;
      }

      if (o.name !== 'compile scripts')
        return;

      var selector  = '*[template]';
      MegaUni.templates = MegaUni.templates.concat(
        _.map(
          Applet.top_descendents(o.script, selector),
          function (t) {
            var placeholder = $('<script type="text/applet_placeholder"></script>');
            var placeholder_id = Applet.id(placeholder);
            var attr = _.trim(Applet.remove_attr(t, 'template')).split(/\ +/);
            var name = attr.shift();
            var pos  = (attr.length > 0) ? attr.pop() : 'replace';

            var meta = {
              name      : name,
              html      : t.prop('outerHTML'),
              mustache  : Hogan.compile(t.prop('outerHTML')),
              placeholder_id : placeholder_id,
              elements  : null,
              pos       : pos
            };

            MegaUni.push(function (o) {
              if (o.name !== 'data' || !_.isPlainObject(o.data[meta.name]))
                return;

              // === Remove old nodes:
              if (meta.elements && meta.pos === 'replace') {
                meta.elements.remove();
              }

              var html = $(meta.mustache.render(o.data));
              if (meta.pos === 'replace' || meta.pos === 'bottom')
                  html.insertBefore($('#' + meta.placeholder_id));
              else
                  html.insertAfter($('#' + meta.placeholder_id));

              meta.elements = html;
              MegaUni.run({
                name: 'compile dom',
                dom:  html
              });
            });

            t.replaceWith(placeholder);
            return meta;
          }
        ) // === each
      );
    }
  ); // === template ==============================

  MegaUni.show_if_data_cache = {};

  MegaUni.push( // === show_if =================================
    function (o) {
      if (o.name === 'reset') {
        MegaUni.show_if_data_cache = {};
        return;
      }

      if (o.name === 'data') {
        _.extend(MegaUni.show_if_data_cache, o.data);
        return;
      }

      if (o.name !== 'compile scripts' && o.name !== 'compile dom')
        return;

      var selector = '*[show_if]';
      _.each(
        $(o.script || o.dom).find(selector).addBack(selector),
        function (raw) {
          var node = $(raw);
          var id   = Applet.id(node);
          var val  = Applet.remove_attr(node, 'show_if');

          if (!Applet.is_true(MegaUni.show_if_data_cache, val))
            node.hide();

          MegaUni.push(
            function (o) {
              if (o.name !== 'data')
                return;

              var data = o.data;
              var ans = Applet.is_true(data, val);
              if (ans === undefined)
                return;

              if ( ans )
                $('#' + id).show();
              else
                $('#' + id).hide();
            }
          ); // === push
        } // === function raw
      ); // === _.each
    } // === func
  ); // === show_if ===================================

  MegaUni.core = _.clone(MegaUni.stack);
  MegaUni.push(
    function (o) {
      if (o.name !== 'reset')
        return;
      MegaUni.stack = MegaUni.core;
    }
  );
}); // === scope



