/* jshint undef: true, unused: true */
/* global Applet */
"use strict";

var Megauni;
Megauni = {

  comma_split: function(str) {
    return str.split(',');
  },

  funcs: function(...names) {
    return _(names)
    .map(Megauni.comma_split)
    .map(_.trim)
    .flattenDeep()
    .map(function (key) {
      if (typeof Megauni[key] === "function")
        return Megauni[key];
      throw new Error("Function not found: " + key);
    })
    .value();
  },

  on_respond_ok: function() {
  },

  ui_ajax: function(o) {
        // === Clear errors:
        if (o.name === 'dom') {
            $('input[type="text"], textarea').on('keypress', function () {
                $(this).closest('div.field').removeClass('field_invalid');
                $(this).closest('div.form').find('div.error_msg, div.success_msg').remove();
            });
            $('form button.submit').on('click', function () {
                var form = $(this).closest('form');
                form.find('div.field_invalid').removeClass('field_invalid');
                form.find('div.error_msg, div.success_msg').remove();
            });
        }
        // === Show loading message: Processing...
        if (o.name === 'ajax' && o.form_id) {
            $('#' + o.form_id).closest('div.form').addClass('loading');
            $('#' + o.form_id + ' div.buttons').after('<div class="loading_msg">Processing...</div>');
        }
        if (o.name === 'ajax response' && o.request.form_id) {
            var div_form = $('#' + o.request.form_id).closest('div.form');
            div_form
                .removeClass('loading')
                .find('div.loading_msg')
                .remove();
            // === Display errors:
            if (o.response.error) {
                if (_.contains(o.response.error.tags, 'server')) {
                    Applet.log(o.response.error);
                    Applet.log(o.response.error.msg || '[No error msg specified.]');
                    div_form.find('div.buttons').before($('<div class="error_msg error_server"></div>')
                        .text('Unknown error. Close this browser window and try again in 30 mins.'));
                }
                if (o.response.error.fields) {
                    _.each(o.response.error.fields || [], function (msg, key) {
                        var field = div_form.find('div.field.' + key + ':first');
                        if (_.isEmpty(field) && key === 'all') {
                            field = div_form.find('div.buttons:last');
                        }
                        else {
                            field.addClass('field_invalid');
                        }
                        field.after($('<div class="error_msg error_' + key + '"></div>')
                            .text(msg));
                    });
                } // === if error fields
            } // === end: display errors
            // === Display success msg:
            if (o.response.success) {
                // === reset msg:
                div_form
                    .addClass('form_success')
                    .find('div.success_msg')
                    .remove();
                // === add msg:
                div_form
                    .find('div.buttons')
                    .after($('<div class="success_msg"></div>').text(o.response.success.msg));
            } // === end: display success msg
        } // === end: display response
    } // === func ui_ajax
}; // === Megauni

