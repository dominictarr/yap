var u = require('../util')
var getMentions = require('../mentions')

var render = require('./message').render
module.exports = function (data) {
  var sbot = this.sbot, context = this.context, api = this.api
  return function (cb) {
    getMentions(sbot, data.value.content.text, function (err, mentions, ambigious) {

      if(
        !data.value.content.mentions &&
        (mentions.length || ambigious.length)
      ) {
          data.value.content.mentions = mentions
          if(ambigious.length)
            ambigious.forEach(function (e) {
              data.value.content.mentions
                .push({name: e[0].name, link: e[0].id})
            })
        }
      function toPath () {
        return '['+[].join.call(arguments, '][')+']'
      }

      cb(null, ['div.MessagePreview',
        ['form',
          {name: 'publish', method: 'POST'},
          //TODO: enable changing the identity to publish as here
          ['input', {type: 'hidden', name: 'id', value: data.value.author}],
          //render(sbot, api, data),
          api(['message'], data),
          u.createHiddenInputs(data.value.content, 'content'),
          mentions.map(function (opts) { return api(['avatar'], opts) }),
          ambigious.map(function (e, i) {
            return [
              ['input', {
                type: 'text',
                name: toPath('content', 'mentions', mentions.length + i),
                value: e[0].name
              }],
              ['select', {
                name: toPath('content', 'mentions', mentions.length + i),
              },
                e.map(function (e, i) {
                  return ['option', !i ? {selected: true, value: e.id} : {value: e.id}, e.id.substring(0, 12)+'...']
                })
              ]
            ]
          }),
          ['button', {name: 'type', value: 'publish'}, 'Publish']
      ]])

      //TODO: add form to set recipients, and change author.
      //press back to edit body of the message again...
      //submit takes you to back to the thread page.
    })
  }
}

