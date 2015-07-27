"use strict";
/* jshint undef: true, unused: true */
/* global Applet  */

var MegaUni = {
  stack : []
};

$(function () {

  var process_node = MegaUni.run_node = function (script) {

    _.each(MegaUni.stack, function (o) {
      if (o.name !== 'attr')
        return;
      _.each($(script).find('*[' + o.attr + ']'), o.func);
    });


    ($(script).contents()).insertBefore($(script));
  }; // === process_node

  MegaUni.run = function (func) {

    // === Compile all scripts:
    Applet.run(process_node);

    if (_.isPlainObject(func))
      _.each(MegaUni.stack, function (f) {
        if (!f.name)
          f(func);
      });

    return MegaUni;

  }; // === func

  var insert = function (pos, name, func) {
    if (_.isFunction(name))
      MegaUni.stack[pos](name);
    else {
      MegaUni.stack[pos]({name: 'attr', attr: name, func: func});
    }

    return MegaUni;
  };

   MegaUni.unshift = function (name, func) {
    return insert('unshift', name, func);
  };

  var push = MegaUni.push = function (name, func) {
    return insert('push', name, func);
  };

  push(
    'show_if',
    function (raw) {
      var node = $(raw);
      var val  = node.attr('show_if');
      node.removeAttr('show_if');
      node.hide();

      var id = Applet.id(node);
      MegaUni.push(function (data) {
        var ans = Applet.is_true(data, val);
        if (ans === undefined)
          return;

        if ( ans )
          $('#' + id).show();
        else
          $('#' + id).hide();
      });
    } // === func
  ); // === show_if

}); // === scope



