var ref = require('ssb-ref')
var niceAgo = require('nice-ago')
var htmlEscape = require('html-escape')

var u = require('../../util')
var h = u.h
toUrl = u.toUrl

module.exports = u.createRenderer(function render (data, apply) {
  var since = apply.since
  var time = data.value.timestamp || data.timestamp
  return h('div.Message',
    u.cacheTag(toUrl('message', {id: data.key}), data.key, since),
    h('div.MessageMeta',
      apply('avatar', {id: data.value.author, name: true, image: true}),
      h('a', {
        href: toUrl('message', {id: data.key}),
        title: new Date(time)+'\n'+data.key
      },
        ''+niceAgo(Date.now(), time)
      ),
      h('label.type', data.value.content.type),
      h('label.msgId', data.key),

      data.value.content.channel
        ? h('a', {href: toUrl('public', {channel: data.value.content.channel})}, '#'+data.value.content.channel)
        : '',

      h('a', {href: toUrl('thread', {id: data.value.content.root || data.key})}, 'Thread')

    ),
    h('div.MessageContent', u.markdown(data.value.content))
  )
})


