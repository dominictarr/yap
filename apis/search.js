var pull = require('pull-stream')
var ref = require('ssb-ref')

module.exports = function (sbot) {
  return function (opts, apply, req) {
    var tr = require('../translations')(req.cookies.lang)
    opts.limit = opts.limit || 10
    if(ref.isMsgLink(opts.query))
      return apply('message', {id: opts.query})
    if(ref.isFeed(opts.query))
      return apply('public', {id: opts.query})

    if(/^@\w+$/.test(opts.query)) //is name
      return function (cb) {
        sbot.names.getSignifies(opts.query.substring(1), function (err, ids) {
          if(err) return cb(err)
          if(ids.length == 0)
            cb(null, ['h1', tr('NoFeedNamed'), opts.query])
          else if(ids.length == 1)
            cb(null, apply('public', {author: ids[0].id}))
          else
            cb(null, ['div',
              ['div', opts.query, ' ', tr('MayAlsoBe')].concat(ids.slice(1).map(function (e) {
                return apply('avatar', {id: e.id, name: false})
              })),
              apply('public', {author: ids[0].id})
            ])
        })
      }

    return pull(
      sbot.search.query(opts),
      pull.map(function (data) {
        return apply('message', data)
      })
    )
  }
}


