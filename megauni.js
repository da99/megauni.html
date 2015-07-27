"use strict";
/* jshint undef: true, unused: true */
/* global Applet  */

var MegaUni = {
  stack : []
};

$(function () {

  var show_if = function (raw) {
    var node = $(raw);
    var val  = node.attr('show_if');
    node.removeAttr('show_if');
    node.hide();

    var id = Applet.id(node);
    MegaUni.run(function (data) {
      var ans = Applet.is_true(data, val);
      if (ans === undefined)
        return;

      if ( ans )
        $('#' + id).show();
      else
        $('#' + id).hide();
    });
  }; // === show_if

  var process_node = MegaUni.run_node = function (script) {

    _.each($(script).find('*[show_if]'), show_if);

    ($(script).contents()).insertBefore($(script));
  }; // === process_node

  MegaUni.run = function (func) {
    // === Compile all scripts
    //     before proceding.
    Applet.run(process_node);

    if (_.isFunction(func))
      MegaUni.stack.push(func);
    else if (_.isPlainObject(func)) {
      _.each(MegaUni.stack, function (f) {
        f(func);
      });
    }
  }; // === func

}); // === scope
