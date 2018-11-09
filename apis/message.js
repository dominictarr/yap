var h = require('hyperscript')
var ref = require('ssb-ref')
var niceAgo = require('nice-ago')
var Markdown = require('ssb-markdown')

var u = require('../util')
toUrl = u.toUrl

var render = module.exports.render = function (api, data) {
  console.error(
    data.value.timestamp, data.timestamp,
    new Date(data.value.timestamp || data.timestamp)
  )
  var time = data.value.timestamp || data.timestamp

  return h('div.Message',
    h('div.MessageMeta',
      //api.avatar({id: data.value.author})
      h('a', {
        href: toUrl('message', {id: data.key}),
        title: new Date(time)+'\n'+data.key
      },
        ''+niceAgo(Date.now(), time)
      ),
      h('label', data.value.content.type)
    ),
    h('div.MessageContent', 
      {innerHTML: Markdown.block(data.value.content.text, {
        toUrl: function (url, image) {
          return (
            ref.isFeed(url) ? toUrl('profile', {id: url})
          : ref.isMsg(url) ? toUrl('profile', {id: url})
          : ref.isBlob(url) ? //toUrl('profile', {id: url})
              'http://localhost:8989/blobs/get/'+url
          : image ? null : image //no external image links allowed!
          )
        },
        emoji: function (emoji) {
          return '<img class="emoji" src="http://localhost:8989/img/emoji/'+htmlEscape(emoji)+'.png">'
        }
      })}
    )
  )

}

module.exports = function (opts) {
  var sbot = this.sbot
  return function (cb) {
    if(!ref.isMsg(opts.id))
      return cb(new Error('expected valid msg id as id'))
    sbot.get(opts.id, function (err, msg) {
      if(err) return cb(err)
      var data = {key: opts.id, value: msg, timestamp: msg.timestamp || Date.now() }
      cb(null, render(null, data))
    })
  }
}


