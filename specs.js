"use strict";
/* jshint undef: true, unused: true */
/* global MegaUni, describe, it, expect, beforeEach */

// function tag_names(dom) {
  // return _.map($(dom), function (node) {
    // return node.tagName;
  // });
// }

describe('megauni.js:', function () {

  beforeEach(function () {
    $('#THE_STAGE').empty();
    MegaUni.run('reset');
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

  describe('template:', function () {

    it('does not render by default', function () {
      $('#THE_STAGE').html(
        '<script type="text/applet"><div template="num">{{word}} {{num}}</div></script>'
      );
      MegaUni.run();
      expect(
        _.map($('#THE_STAGE').children(), function (n) {
          return $(n).attr('type');
        })
      ).toEqual(['text/applet_placeholder', 'text/applet']);
    }); // === it does not render by default

    it('renders elements on top of where it is found', function () {
      $('#THE_STAGE').html(
        '<script type="text/applet"><div template="num">{{word}} {{num}}</div></script>'
      );
      MegaUni.run('compile scripts').run('data', {num: {word: 'one', num: 1}});
      expect(
        $('#THE_STAGE').children().first().prop('outerHTML')
      ).toEqual('<div>one 1</div>');
    }); // === it renders elements on top of where it is found

  }); // === describe template =================

}); // === describe megauni.js =================
