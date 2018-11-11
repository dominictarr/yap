var msum = require('markdown-summary')

function link (data) {
  return ['a',
    {href: toUrl('thread', {id: data.key})},
    msum.title(data.value.content.text)
  ]
}
module.exports = function (data) {
  var sbot = this.sbot
  if(data.key && data.value && data.value.content && data.value.content.type)
    return link(data)
  else if(data.id)
    return function (cb) {
      sbot.get(data, function (err, msg) {
        var _data = {key: data.id, value: msg}
        cb(null, link(data))
      })
    }
}


