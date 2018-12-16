var pull = require('pull-stream')
var ref = require('ssb-ref')
var Append = require('pull-append')

var sort = require('ssb-sort')

var u = require('../util')

var h = u.h
toUrl = u.toUrl

var render = require('./message').render
var niceAgo = require('nice-ago')

module.exports = function (opts) {
  var self = this
  var sbot = this.sbot, api = this.api
  opts.reverse = opts.reverse !== false
  var min = !isNaN(+opts.lt) ? +opts.lt : Date.now()
  var max = !isNaN(+opts.gt) ? +opts.gt : 0

  var type = (opts.private ? 'private' : 'public')
  var Type = (opts.private ? 'Private' : 'Public')

  return h('div.' + Type,
    h('title', Type),
    function (cb) {
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
              timestamp: max ? {$gt: max} : min ? {$lt: min} : undefined
            },
          }}/*, {
            $sort: [['value', 'timestamp']]
          }*/],
          limit: 20, reverse: max ? false : true
        }),
        pull.collect(function (err, ary) {
          if(err) return cb(err)
          ary = ary.sort(function (a, b) {
            return b.value.timestamp - a.value.timestamp
          }).map(function (data) {
            min = Math.min(data.value.timestamp, min)
            max = Math.max(data.value.timestamp, max)
            return api('message', data)

          })
          var nav_opts = {}
          if(opts.author)
            nav_opts.author = opts.author

          var nav = ['span',
            '<< ',
            opts.author ?
              api(['avatar'], {
                id: opts.author,
                name: true,
                image: false,
                href: toUrl('friends', {id: opts.author})
              }): '',
            ' ',
            ['a', {
                href: toUrl(type, Object.assign({}, nav_opts, {
                  gt: max
                })),
                title: new Date(max).toString()
              },
            niceAgo(Date.now(), max)
            ], ' + ',
            ['a', {
                href: toUrl(type, Object.assign({}, nav_opts, {
                  lt: min
                })),
                title: new Date(max).toString()
              },
              niceAgo(Date.now(), min)],
            ' >>'
          ]
          ary.unshift(nav)
          ary.push(nav)
          cb(null, ary)
        })
      )
    }
  )
}



