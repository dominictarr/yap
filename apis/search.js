var pull = require('pull-stream')
var render = require('./message').render

module.exports = function (opts) {
  var self = this
  opts.limit = opts.limit || 10
  return pull(
    self.sbot.search.query(opts),
    pull.map(function (data) {
      console.log(data)
      return render(self.sbot, self.api, data)
    })
  )
}
