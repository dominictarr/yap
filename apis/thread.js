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

/*
  I want a generic way of submitting forms.
  different apps should be able to post messages
  with any sort of content...

  one problem is that url encoding does not map
  to JSON types - boolean or numbers are just strings.
  you could automatically convert types, but then
  if the user types "true" in the textarea, you get
  an invalid message. applications should handle this
  but here the user intended to share the word "true"

  I think the solution is to put the type in the key.

  one awkward case is that there is date input and time input
  and a datetime input, but it isn't widely supported.
  so that kinda needs to be split between two fields.
*/

function Compose (id, meta) {
  return h('form', {name: 'publish', method: 'POST'},
    //selected id to post from. this should
    //be a dropdown, that only defaults to context.id
    h('input', {
      name: 'id', value: id, type: 'hidden'
    }),
    //root + branch. not shown in interface.
    u.createHiddenInputs(meta, 'content'),

    h('textarea', {name: 'content[text]'}),
    h('input', {type: 'submit', name: 'type', value:'preview'}, 'Preview'),
// TODO: lookup mentions before publishing.
    h('input', {type: 'submit', name: 'type', value:'publish', disabled: true}, 'Publish'),
  )
}

function Publish (opts, name) {
  name = name || 'Preview'
  return h('form', {name: 'publish', method: 'POST'},
    //selected id to post from. this should
    //be a dropdown, that defaults to context.id
    //private threads should only allow changing
    //id to a recipient, likes, follows etc should
    //allow changing to any id you have.
    u.createHiddenInputs(opts),
    h('button', {type: 'submit', name: 'type', value:'preview'}, name),
  )

}

module.exports = function (opts) {
  var sbot = this.sbot, api = this.api, context = this.context
  var since = this.since
  return function (cb) {
    var cacheTime = 0
    if(!ref.isMsg(opts.id))
      return cb(new Error('expected valid msg id as id'))
    sbot.get({id:opts.id, private: true}, function (err, msg) {
      if(err) return cb(err)
      var data = {key: opts.id, value: msg, timestamp: msg.timestamp || Date.now() }
      if(data.value.content.root)
        cb(null, api('message', data)) //just show one message
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
              recipients = ['div.Recipients', 'in this thread:',
                ary[0].value.content.recps.map(function (e) {
                  return api('avatar', e)
                })]
          cb(null,
            h('div.thread',
              u.cacheTag(toUrl('thread', opts), data.key, since),
              h('title', msum.title(ary[0].value.content.text)),
              recipients,
              h('form', {name: 'publish', method: 'POST'},
                ary.map(function (data) {
                  return h('div',
                    api('message', data),
                    function (cb) {
                      backlinks(sbot, data.key, function (err, likes, backlinks) {
                        if(err) return cb(err)
                        cb(null, ['div.MessageExtra',
                          Publish({
                              id: context.id,
                              suggestedRecps: data.value.author,
                              content: {
                                type: 'vote',
                                vote: {
                                  link:data.key, value: 1,
                                  expression: 'Yup'
                                },
                                channel: data.value.content.channel
                              }
                            },
                            'Yup' + (likes.length ? '('+likes.length+')' : '')
                          ),
                          //['button', 'yup', likes.length ? '('+likes.length+')' : ''],
                          (backlinks.length ?
                          ['ul.MessageBacklinks',
                            backlinks.map(function (e) {
                              return ['li',
                                api('avatar', {id:e.value.author}),
                                ' ',
                                api('messageLink', e),
                                ' ',
                                e.value.content.channel && api('channelLink', e.value.content.channel)
                              ]
                            })
                          ] : '')
                        ])
                      })
                    }
                  )
                })
              ),
              Compose(context.id, {
                type: 'post',
                root: opts.id,
                recps: uniqueRecps(ary[0].value.content.recps),
                branch: sort.heads(ary)
              })
            )
          )
        })
    })
  }
}

