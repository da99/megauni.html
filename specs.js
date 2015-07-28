"use strict";
/* jshint undef: true, unused: true */
/* global MegaUni, describe, it, expect, beforeEach */

describe('megauni.js:', function () {

  beforeEach(function () {
    $('#THE_STAGE').empty();
  });

  describe('run:', function () {

    it('inserts contents before SCRIPT tag', function () {
      $('#THE_STAGE')
      .html('<script type="text/applet"><div id="target" show_if="logged_in?">logged</div></script>');
      MegaUni.run();
      expect(
        $($('#THE_STAGE').children().first()).attr('id')
      ).toEqual('target');
    }); // === it inserts contents before SCRIPT tag

  }); // === describe run =================

  describe('show_if:', function () {

    it('sets node to display=none by default', function () {
      $('#THE_STAGE')
      .html('<script type="text/applet"><div id="target" show_if="logged_in?">logged</div></script>');
      MegaUni.run();
      expect(
        $('#target').css('display')
      ).toEqual('none');
    }); // === it sets node to display=none by default

    it('makes node visible if data has a truthy kv', function () {
      $('#THE_STAGE')
      .html('<script type="text/applet"><div id="target" show_if="logged_in?">logged</div></script>');

      MegaUni.run();
      MegaUni.run('data', {'logged_in?': true});

      expect(
        $('#target').css('display')
      ).toEqual('block');
    }); // === it makes node visible if data has a truthy kv

  }); // === describe show_if =================

}); // === describe megauni.js =================
