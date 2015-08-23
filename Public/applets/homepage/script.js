"use strict";
/* jshint esnext: true, undef: true, unused: true */
/* global MegaUni  */

var MU;

$(function () {

  MU = new MegaUni();

  MU.applet.run(
    'data',
    {
      "page_loaded?" : true,
      "logged_in?" : false
    }
  );

}); // === MegaUni
