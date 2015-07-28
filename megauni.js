"use strict";
/* jshint undef: true, unused: true */
/* global Applet  */

var MegaUni = {
  stack : []
};

$(function () {

  MegaUni.run = function (msg) {

    // === Compile everything before proceding:
    Applet.run(MegaUni.compile_script);

    if (!msg)
      return MegaUni;

    if (!_.has(msg, 'name'))
      msg = {name: 'data', data: msg};

    _.each(
      [
        'before before ' + msg.name,
        'before ' + msg.name,
        msg.name,
        'after ' + msg.name,
        'after after ' + msg.name
      ],
      function (name) {
        msg.name = Applet.standard_name(name);
        var i = 0, f;
        while (MegaUni.stack[i]) {
          f = MegaUni.stack[i];
          msg.this_func = f;
          f(msg);
          ++i;
        }
      }
    ); // === _.each name

    return MegaUni;
  }; // === func

  MegaUni.compile_script = function (script, all) {

    MegaUni.run({
      name      : 'compile script',
      script    : script,
      all       : all
    });

    ($(script).contents()).insertBefore($(script));
  }; // === process_node

  MegaUni.unshift = function (func) {
    MegaUni.stack.unshift(func);
    return MegaUni;
  };

  MegaUni.push = function (func) {
    MegaUni.stack.push(func);
    return MegaUni;
  };

  MegaUni.push( // === show_if =================================
    function (o) {
      if (o.name !== 'compile script' && o.name !== 'compile dom')
        return;

      var selector = '*[show_if]';
      _.each(
        $(o.script || o.dom).find(selector).addBack(selector),
        function (raw) {
          var node = $(raw);
          var id   = Applet.id(node);
          var val  = Applet.remove_attr(node, 'show_if');

          node.hide();

          MegaUni.push(
            function (data) {
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

}); // === scope



