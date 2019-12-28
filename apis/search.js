var pull = require('pull-stream')
var ref = require('ssb-ref')

function isChannel (c) {
  return /^#\w+/.test(c)
}

function isName (c) {
  return /^@\w+/.test(c)
}

module.exports = function (sbot) {
  return function (opts, apply, req) {
    console.log("SEARCH", opts)
    var tr = require('../translations')(req.cookies.lang)
    var query = (opts.query || '').trim()
    delete opts.query
    opts.limit = opts.limit ? +opts.limit : 10
    if(ref.isMsgLink(query))
      return apply('message', {id: query})
    if(ref.isFeed(query))
      return apply('patch/public', Object.assign(opts, {id: query}))
    if(isChannel(query))
      return apply('patch/public', Object.assign(opts, {channel: query.substring(1)}))

    if(isName(query)) //is name
      return function (cb) {
        sbot.names.getSignifies(query.substring(1), function (err, ids) {
          if(err) return cb(err)
          if(ids.length == 0)
            cb(null, ['h1', tr('NoFeedNamed'), query])
          else if(ids.length == 1)
            cb(null, apply('patch/public', {author: ids[0].id}))
          else
            cb(null, ['div',
              ['div', query, ' ', tr('MayAlsoBe')].concat(ids.slice(1).map(function (e) {
                return apply('avatar', {id: e.id, name: false})
              })),
              apply('patch/public', {author: ids[0].id})
            ])
        })
      }

    return pull(
      sbot.search.query(Object.assign({query: query}, opts)),
      pull.map(function (data) {
        console.log('result', data)
        return apply('message', data)
      })
    )
  }
}
