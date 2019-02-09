var pull = require('pull-stream')
var ref = require('ssb-ref')
var msum = require('markdown-summary')
var sort = require('ssb-sort')

var u = require('../util')

var h = u.h
toUrl = u.toUrl

function uniqueRecps (recps) {
  if(!recps || !recps.length) return
  recps = recps.map(function (e) {
    return 'string' === typeof e ? e : e.link
  })
  .filter(Boolean)
  return recps.filter(function (id, i) {
    return !~recps.indexOf(id, i+1)
  })
}

function getThread(sbot, id, cb) {
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
      cb(null, ary)
    })
  )
}

function isObject(o) {
  return o && 'object' === typeof o
}
var isArray = Array.isArray

function backlinks (sbot, id, cb) {
  var likes = [], backlinks = []
  pull(
    sbot.links({dest: id, values: true}),
    pull.drain(function (e) {
      var content = e.value.content
      var vote = content.vote
      if(isObject(vote) &&
        vote.value == 1 && vote.link == id)
        likes.push(e)
      else if(content.type == 'post' && isArray(content.mentions)) {
        for(var i in content.mentions) {
          var m = content.mentions[i]
          if(m && m.link == id) {
            backlinks.push(e)
            return //if something links twice, don't back link it twice
          }
        }
      }
    }, function () {
      cb(null, likes, backlinks)
    })
  )
}


module.exports = function (sbot) {
  return function (opts, apply, req) {
    var context = req.cookies
    var since = apply.since
    var tr = require('../translations')(context.lang)
    return function (cb) {
      var cacheTime = 0
      if(!ref.isMsg(opts.id))
        return cb(new Error('expected valid msg id as id'))
      sbot.get({id:opts.id, private: true}, function (err, msg) {
        if(err) return cb(err)
        var data = {key: opts.id, value: msg, timestamp: msg.timestamp || Date.now() }
        if(data.value.content.root)
          cb(null, apply('message', data)) //just show one message
        else if(data.value.content.type != 'post')
          cb(null, apply('message', data)) //just show one message
        else
          getThread(sbot, opts.id, function (err, ary) {
            ary.unshift(data)
            var o = {}, cacheTime
            ary = ary.filter(function (e) {
              if(o[e.key]) return false
              return o[e.key] = true
            })
            sort(ary)
            var recipients = ' '
            if(ary[0].value.content.recps)
                recipients = ['div.Recipients', tr('ThreadRecipients'),
                  ary[0].value.content.recps.map(function (e) {
                    return apply('avatar', e)
                  })]
            cb(null,
              h('div.thread',
                u.cacheTag(apply.toUrl('thread', opts), data.key, since),
                ary[0].value.content.text && h('title', msum.title(ary[0].value.content.text)),
                recipients,
                h('form', {name: 'publish', method: 'POST'},
                  ary.map(function (data) {
                    return h('div',
                      apply('message', data),
                      function (cb) {
                        backlinks(sbot, data.key, function (err, likes, backlinks) {
                          if(err) return cb(err)

                          var expression = tr('Like')
                          cb(null, ['div.MessageExtra',
                            apply('publish', {
                              id: context.id,
                              suggestedRecps: data.value.author,
                              content: {
                                type: 'vote',
                                vote: {
                                  link:data.key, value: 1,
                                  expression: expression
                                },
                                channel: data.value.content.channel
                              },
                              name: expression + ' ' + (likes.length ? '('+likes.length+')' : '')
                            }),
                            (backlinks.length ?
                            ['ul.MessageBacklinks',
                              backlinks.map(function (e) {
                                return ['li',
                                  apply('avatar', {id:e.value.author}),
                                  ' ',
                                  apply('messageLink', e),
                                  ' ',
                                  e.value.content.channel && apply('channelLink', e.value.content.channel)
                                ]
                              })
                            ] : '')
                          ])
                        })
                      }
                    )
                  })
                ),
                apply('compose', {
                  content: {
                    type: 'post',
                    root: opts.id,
                    recps: uniqueRecps(ary[0].value.content.recps),
                    branch: sort.heads(ary)
                  }
                })
              )
            )
          })
      })
    }
  }
}

