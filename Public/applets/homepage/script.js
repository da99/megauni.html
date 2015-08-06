"use strict";
/* jshint esnext: true, undef: true, unused: true */
/* global Applet  */

var MegaUni;
$(function () {
  MegaUni = new Applet(
    function (o) {
      if (o.name === 'data' && _.has(o.data,'logged_in?')) {
        $('#loading').hide();
      }
    },
    _.values(Applet.funcs)
  );
  MegaUni.run('data', {"logged_in?" : false});
});
