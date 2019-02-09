var msum = require('markdown-summary')

module.exports = function (sbot) {
  return function (data, apply) {

    function link (data) {
      return ['a',
        {href: apply.toUrl('thread', {id: data.key})},
        msum.title(data.value.content.text)
      ]
    }

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
}




