var pull = require('pull-stream')
var ref = require('ssb-ref')
var Append = require('pull-append')

var sort = require('ssb-sort')

var u = require('../util')

var h = u.h
toUrl = u.toUrl

var render = require('./message').render
var niceAgo = require('nice-ago')

function merge() {
  return Object.assign.apply(null, [{}].concat([].slice.call(arguments)))
}

function hasRange(o, key) {
  return Object.hasOwnProperty.call(o, key) && !isNaN(o[key])
}

function cleanRange (_o) {
  var o = {}

  if     (hasRange(_o, 'gt'))  o.$gt  = +_o.gt
  else if(hasRange(_o, 'gte')) o.$gte = +_o.gte

  if     (hasRange(_o, 'lt'))  o.$lt  = +_o.lt
  else if(hasRange(_o, 'lte')) o.$lte = +_o.lte

  return o
}

module.exports = function (sbot) {
  return function (opts, apply, req) {
    var tr = require('../translations')(req.cookies.lang)
    var self = this
    opts.reverse = opts.reverse !== false
  //  var min = !isNaN(+opts.lt) ? +opts.lt : Date.now()
  //  var max = !isNaN(+opts.gt) ? +opts.gt : 0

    var min = Date.now()
    var max = 0

    var type = (opts.private ? 'private' : 'public')
    var Type = (opts.private ? 'Private' : 'Public')

    return function (cb) {
        //grab a handle on the since value _before_ we make the
        //query, because then we avoid the race condition
        //where something isn't included in the query but
        //is in the since.
        var since = self.since
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
                timestamp: cleanRange(opts),

   //max ? {$gt: max} : min ? {$lt: min} : undefined
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
              return apply('message', data)
            })
            var nav_opts = {}
            if(opts.author) nav_opts.author = opts.author
            if(opts.channel) nav_opts.channel = opts.channel
            if(opts.private) nav_opts.private = opts.private

            var nav = ['span',
              opts.author ?
                apply('avatar', {
                  id: opts.author,
                  name: true,
                  image: false,
                  href: toUrl('friends', {id: opts.author})
                }): '',
              ' ',
              ['a', {
                  href: toUrl(type, Object.assign({}, nav_opts, { gt: max })),
                  title: new Date(max).toString()
                },
                '<< ',
                niceAgo(Date.now(), max)
              ], ' + ',
              ['a', {
                  href: toUrl(type, merge(nav_opts, { lt: min })),
                  title: new Date(max).toString()
                },
                niceAgo(Date.now(), min),
                ' >>'
              ],
              ' ',
              ['a',
                {
                  href: toUrl('compose', {private: opts.private, content: {channel: opts.channel}}),
                  title: new Date(max).toString()
                },
                tr('Compose')
              ]
            ]
            ary.unshift(nav)
            ary.push(nav)
            cb(null, h('div.' + Type,
              u.cacheTag(
                toUrl(type, merge(nav_opts, {lte: max, gte: min})),
                {lte:max, gte:min},
                since //an offset
              ),
              h('title', Type),
              ary
            ))
          })
        )
      }
  }
}

