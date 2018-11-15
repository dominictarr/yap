var pull = require('pull-stream')
var render = require('./message').render

module.exports = function (opts) {
  var self = this
  opts.limit = opts.limit || 10
  return pull(
    self.sbot.search.query(opts),
    pull.map(function (data) {
      return api('message', data)
    })
  )
}

