var URL = require('url')
var QS = require('querystring')
var hyperscript = require('hyperscript')
var cpara = require('cont').para
var pull = require('pull-stream')

function isFunction (f) {
  return 'function' === typeof f
}

var isArray = Array.isArray

function isEmpty (e) {
  for(var k in e) return false
  return true
}

exports.toUrl = function toUrl(path, opts) {
  return '/'+(
    Array.isArray(path) ? path.join('/') : ''+path
  ) + (
    !isEmpty(opts) ? '?'+QS.encode(opts) : ''
  )
}
exports.h = function () {
  return [].slice.call(arguments)
}

function toCont (f) {
  if(f.length === 1) return f
  else if(f.length === 2)
    return function (cb) {
      pull(
        f,
        pull.asyncMap(function (e, cb) {
          exports.toHTML(e)(cb)
        }),
        pull.collect(cb)
      )
    }
}

function flatten (a) {
  var _a = []
  for(var i = 0; i < a.length; i++)
    if(isArray(a[i]))
      _a = _a.concat(flatten(a[i]))
    else
      _a.push(a[i])
  return _a
}


//even better would be streaming html,
//not just into arrays.
var k = 0
exports.toHTML = function toHTML (hs) {
  return function (cb) {
    cpara(hs.map(function (e) {
      return (
        isFunction(e) ? toCont(e)
      : isArray(e) ? toHTML(e)
      : function (cb) {
        cb(null, e)
      })
    }))(function (err, ary) {
      console.log(k++, ary)
      console.log(ary)
      if(err) cb(err)
      else cb(null, hyperscript.apply(null, flatten(ary)))
    })
  }
}

