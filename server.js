"use strict";
/* jshint esnext: true, undef: true, unused: true */
/* global require */

var logger = require('koa-logger');
var router = require('koa-router')();
var app    = require('koa')();

app.use(logger());

router.get('/', function *(next) {

  this.body = 'Hello World';
  yield next;
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(4567);
