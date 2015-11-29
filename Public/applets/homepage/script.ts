/// <reference path="../../scripts/types/lodash/lodash.d.ts"/>
/// <reference path="../../scripts/types/jquery/jquery.d.ts"/>
declare var MegaUni: any, Applet: any;
/* jshint undef: true, unused: true */
/* global MegaUni, Applet */
"use strict";


var APP: any;

$(function () {

  var form_success = function (o: any): void {
    if (o.name !== 'ajax response')
      return;

    if (o.response.error)
      return;

    var form = $('#' + o.request.form_id);
    form.trigger('reset');

    switch (o.request.form_id) {

      case 'create_account':
        form.find('div.success_msg').text('Account created. Please wait as page reloads...');
        form.find('div.buttons').hide();
        window.location.reload(true);
        break;

    } // === switch o.request.form_id
  }; // === func

  APP = new Applet(
    _.values(Applet.funcs),
    MegaUni.funcs.ui_ajax,
    form_success
  );

  APP.run(
    'data',
    {
      "page_loaded?" : true,
      "logged_in?" : false
    }
  );

}); // === MegaUni

