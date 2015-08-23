"use strict";
/* jshint esnext: true, undef: true, unused: true */
/* global MegaUni, Applet */

var APP;

$(function () {

  APP = new Applet(
    _.values(Applet.funcs),
    MegaUni.funcs.ui_ajax
  );

  APP.run(
    'data',
    {
      "page_loaded?" : true,
      "logged_in?" : false
    }
  );

}); // === MegaUni

