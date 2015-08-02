"use strict";
/* jshint undef: true, unused: true */
/* global Applet  */

var MegaUni = function () {
  this.applet = new Applet(_.toArray(arguments));
};

$(function () {

  // =================== PROTOTYPE ================================

  MegaUni.prototype.run = function () {
    var mu = this;
    mu.applet.run.apply(arguments, mu.applet);
  }; // === func

}); // === scope ==================================



