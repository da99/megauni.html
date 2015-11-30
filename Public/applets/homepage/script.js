/* jshint undef: true, unused: true */
/* global Megauni, Applet */
"use strict";

var APP;

$(function () {

  APP = new Applet(
      Applet.funcs('show_if hide_if ajax'),
      Megauni.applet_funcs('on_respond_ok')
  );

  APP.run('dom');
  APP.run(
    'data',
    {
      "page_loaded?" : true,
      "logged_in?" : false
    }
  );

}); // === $(func) scope

