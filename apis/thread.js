var pull = require('pull-stream')
var ref = require('ssb-ref')
var msum = require('markdown-summary')

var sort = require('ssb-sort')

var u = require('../util')

var h = u.h
toUrl = u.toUrl

var render = require('./message').render

function getThread(sbot, id, cb) {
  sbot.get({id: id, private: true}, function (err, msg) {
    pull(
      sbot.query.read({
        query: [{$filter: {
          value: { content: {type: 'post', root: id} }
        }}]
      }),
      pull.collect(function (err, ary) {
        if(err) return cb(err)
        sort(ary)
        cb(null, ary)
      })
    )
  })
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
      console.log(e)
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


module.exports = function (opts) {
  var sbot = this.sbot, api = this.api
  return function (cb) {
    if(!ref.isMsg(opts.id))
      return cb(new Error('expected valid msg id as id'))
    sbot.get({id:opts.id, private: true}, function (err, msg) {
      if(err) return cb(err)
      var data = {key: opts.id, value: msg, timestamp: msg.timestamp || Date.now() }
      if(data.value.content.root)
        api.message(opts)(cb) //just show one message
      else
        getThread(sbot, opts.id, function (err, ary) {
          ary.unshift(data)
          cb(null,
            h('div.thread',
              h('form', {name: 'publish', method: 'POST'},
                ary.map(function (data) {
                  return h('div',
                    render(sbot, api, data),
                    function (cb) {
                      backlinks(sbot, data.key, function (err, likes, backlinks) {
                        if(err) return cb(err)
                        cb(null, ['div.MessageExtra',
                          ['button', 'yup', likes.length ? '('+likes.length+')' : ''],
                          (backlinks.length ?
                          ['ul.MessageBacklinks',
                            backlinks.map(function (e) {
                              return ['li', ['a',
                                {href: toUrl('thread', {id: e.key})},
                                msum.title(e.value.content.text)
                              ]]
                            })
                          ] : '')
                        ])
                      })
                    }
                  )
                })
              ),
              h('form', {name: 'publish', method: 'POST'},
                h('input', {name: 'id', value: sbot.id, type: 'hidden'}),
                h('input', {name: 'content[root]', value: JSON.stringify(opts.id), type: 'hidden'}),
                sort.heads(ary).map(function (head, i) {
                  return h('input', {name: 'content[branch]['+i+']', value: head, type: 'hidden'})
                }),
                h('input', {name: 'content[number]', type: 'number'}),
                h('input', {name: 'content[boolean]', type: 'checkbox', value:true}),
                h('input', {name: 'content[time]', type: 'time', value: new Date().toISOString()}),
                h('input', {name: 'content[channel]', value: ary[0].value.content.channel, type: 'hidden'}),
                h('input', {type: 'submit', value:'PUBLISH1', name: 'submit1'}),
                h('input', {type: 'submit', value:'PUBLISH2', name: 'submit2'}),
                h('input', {type: 'submit', value:'PUBLISH'})
              )
            )
          )
        })
    })
  }
}

























