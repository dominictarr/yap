var ref = require('ssb-ref')
var niceAgo = require('nice-ago')
var htmlEscape = require('html-escape')

var u = require('../util')
var h = u.h
toUrl = u.toUrl

var messageTypes = require('./messages')

module.exports = u.createRenderer(function render (data) {
  return this.api(['messages', data.value.content.type], data)
})

