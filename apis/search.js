var pull = require('pull-stream')
var ref = require('ssb-ref')

module.exports = function (opts) {
  var self = this
  var api = this.api
  opts.limit = opts.limit || 10
  if(ref.isMsgLink(opts.query))
    return api('message', {id: opts.query})
  if(ref.isFeed(opts.query))
    return api('public', {id: opts.query})

  return pull(
    self.sbot.search.query(opts),
    pull.map(function (data) {
      return api('message', data)
    })
  )
}



