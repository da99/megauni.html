/* jshint undef: true, unused: true */
/* global Megauni, Applet */
"use strict";

var A, APP;

A = Applet;
APP = A.applet.new().push_for('dom', A.funcs('show_if hide_if')).push(A.funcs(Megauni, 'on_respond_ok')).run('dom').run('data', {
  "page_loaded?": true,
  "logged_in?": false
});

//# sourceMappingURL=script.babel.js.map