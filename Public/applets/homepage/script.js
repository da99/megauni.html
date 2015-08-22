"use strict";
/* jshint esnext: true, undef: true, unused: true */
/* global Applet  */

var MegaUni;
$(function () {
  MegaUni = new Applet(

    function (o) {
      if (o.name === 'ajax' && o.form_id) {
        $('#' + o.form_id).closest('div.form').addClass('loading');
        $('#' + o.form_id + ' div.buttons').after('<div class="loading_msg">Processing...</div>');
      }

      if (o.name === 'ajax response' && o.request.form_id) {
        $('#' + o.request.form_id).closest('div.form').removeClass('loading');
        $('#' + o.request.form_id + ' div.loading_msg').remove();
      Applet.log(o);
      }

      if (o.name === 'ajax response' && !o.json) {
        try {
          o.json = JSON.parse(o.text);
        } catch(e) {
          o.json = {error: {unknown:o.text}};
        }
      }
    },

    _.values(Applet.funcs)

  ); // === new Applet

  MegaUni.run(
    'data',
    {
      "page_loaded?" : true,
      "logged_in?" : false
    }
  );

}); // === MegaUni
