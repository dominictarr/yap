var pull = require('pull-stream')
var paramap = require('pull-paramap')
var msum = require('markdown-summary')
var sort = require('ssb-sort')
var u = require('../util')
var Append = require('../../pull-append')

function getThread(sbot, id, cb) {
  sbot.get({id:id, private: true}, function (err, msg) {
    if(err) return cb(err)
    var data = {key:id, value: msg}
      console.log(data)
    pull(
      sbot.query.read({
        //hack so that ssb-query filters on post but uses
        //indexes for root.
        query: [{$filter: {
          value: { content: {root: id} }
        }},{$filter: {
          value: { content: {type: 'post'} }
        }}]
      }),
      pull.collect(function (err, ary) {
        if(err) return cb(err)
        cb(null, sort([data].concat(ary)))
      })
    )
  })
}

module.exports = function (opts) {
  var self = this
  var sbot = this.sbot
  var api = this.api
  var seen = {}
  var max
  var min = max = !isNaN(+opts.lt) ? +opts.lt : Date.now()
  opts.reverse = opts.reverse !== false
  return ['div.Inbox',
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
        limit: 100, reverse: true
      }),
      pull.map(function (data) {
        min = Math.min(data.value.timestamp, min)
        var root = data.value.content.root || data.key
        if(seen[root]) return false
        seen[root] = true
        return root
      }),
      pull.filter(Boolean),
      paramap(function (root, cb) {
        console.log('get', root)
        getThread(sbot, root, function (err, thread) {
          if(err) return cb(err)
          var authors = thread.map(function (e) {
            return e.value.author
          }).reduce(function (seen, author) {
            if(!~seen.indexOf(author)) seen.push(author)
            return seen
          }, [])
          if(!thread.every(function (e) {
            return e.value.timestamp < max
          }))
            return cb()

          var content = thread[0].value.content
          cb(null, ['div.Thread',
            ['div.Authors', authors.map(function (e) {
              return api('avatar', {id:e})
            })],
            ['a',
              {href: u.toUrl('thread', {id: root})},
              ['h3', content.title || msum.title(content.text)]
            ],
            ['label', thread.length]
          ])
        })
      }, 16),
      pull.filter(Boolean),
      pull.take(20),
      Append(function last () {
        return [
          'a', {
            href: toUrl('inbox', Object.assign({}, opts, {lt: min}))
          },
          'Load More'
        ]
      })
    )
  ]
}


