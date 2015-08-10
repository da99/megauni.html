"use strict";
/* jshint esnext: true, undef: true, unused: true */
/* global Applet  */

var MegaUni;
$(function () {
  MegaUni = new Applet(
    _.values(Applet.funcs)
  );
  MegaUni.run(
    'data',
    {
      "page_loaded?" : true,
      "logged_in?" : false
    }
  );
});
