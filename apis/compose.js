var ref = require('ssb-ref')
var Translations = require('../translations')

var u = require('../util')

module.exports = function (sbot) {
  return function (opts, apply, req) {
    var context = req.cookies
    var id = opts.id
    var content = opts.meta || opts.content || {}
    content.type = content.type || 'post'
    var tr = Translations(context.lang)
    return apply('publish', {
      id: opts.id,
      content: content,
      inputs:
        ['textarea', {name: 'content[text]'}],
      name: tr('Preview')
    })
  }
}



