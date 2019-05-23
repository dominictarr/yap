var pull = require('pull-stream')
var ref = require('ssb-ref')
var Append = require('pull-append')

var sort = require('ssb-sort')

var u = require('yap-util')

toUrl = u.toUrl

var render = require('./message').render
var niceAgo = require('nice-ago')

function merge() {
  return Object.assign.apply(null, [{}].concat([].slice.call(arguments)))
}

module.exports = function (sbot) {
  return function (opts, apply, req) {
    var tr = require('../translations')(req.cookies.lang)
    var self = this
    opts.reverse = opts.reverse != 'false'
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
        var _opts = u.createQuery(opts, {limit: 20, reverse: opts.reverse})
        console.log(JSON.stringify(_opts.query, null, 2))

        pull(
          sbot.query.read(_opts),
          pull.filter(function (v) {
            return v.value.content.type === 'post'
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

              //load previous from a url, so that it can be updated by coherence
              apply('more', Object.assign({
                href: toUrl(type, Object.assign({}, nav_opts, { gt: max })),
                label: '<< '+ niceAgo(Date.now(), max),
                title: 'after '+ new Date(max).toString()
              }, nav_opts, {gt: max })),
              ' + ',
              apply('more', Object.assign({
                href: toUrl(type, Object.assign({}, nav_opts, { lt: min })),
                label: niceAgo(Date.now(), min) + ' >>',
                title: 'before '+ new Date(min).toString()
              }, nav_opts, {lt: min })),              ' ',
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
            cb(null, ['div.' + Type, ['title', Type], ary])
          })
        )
      }
  }
}




