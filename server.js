"use strict";
/* jshint esnext: true, undef: true, unused: true */
/* global require */

var logger = require('koa-logger');
var app    = require('koa')();

app.use(logger());

app.use(function *(next) {

  this.body = 'Hello World';
  yield next;
});

app.listen(4567);
