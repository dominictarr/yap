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

  if(/^@\w+$/.test(opts.query)) //is name
    return function (cb) {
      self.sbot.names.getSignifies(opts.query.substring(1), function (err, ids) {
        if(err) return cb(err)
        if(ids.length == 0)
          cb(null, ['h1', 'no feed named:'+opts.query])
        else if(ids.length == 1)
          cb(null, api('public', {author: ids[0].id}))
        else
          cb(null, ['div',
            ['div', opts.query + ' may also refer to:'].concat(ids.slice(1).map(function (e) {
              return api('avatar', {id: e.id, name: false})
            })),
            api('public', {author: ids[0].id})
          ])
      })
    }

  return pull(
    self.sbot.search.query(opts),
    pull.map(function (data) {
      return api('message', data)
    })
  )
}







