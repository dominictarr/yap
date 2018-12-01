var pull = require('pull-stream')
var ref = require('ssb-ref')
var Append = require('pull-append')

var sort = require('ssb-sort')

var u = require('../util')

var h = u.h
toUrl = u.toUrl

var render = require('./message').render

module.exports = function (opts) {
  var self = this
  var sbot = this.sbot, api = this.api
  opts.reverse = opts.reverse !== false
  var min = !isNaN(+opts.lt) ? +opts.lt : Date.now()

  var type = (opts.private ? 'private' : 'public')
  var Type = (opts.private ? 'Private' : 'Public')

  return h('div.' + Type,
    h('title', Type),
    pull(
      sbot.query.read({
        query: [{$filter: {
          value: {
            content: {
              type: 'post',
              channel: opts.channel,
            },
            author: opts.author,
            private: opts.private ? true : {$is: 'undefined'},
            timestamp: min ? {$lt: min} : undefined
          },
        }}],
        limit: 20, reverse: true
      }),
      pull.map(function (data) {
        min = Math.min(data.value.timestamp, min)
        return api('message', data)
      }),
      Append(function last () {
        return [
          'a', {
            href: toUrl(type, Object.assign({}, opts, {lt: min}))
          },
          'Load More'
        ]
      })
    )
  )
}

