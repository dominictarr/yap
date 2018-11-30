var u = require('../util')
var explain = require('explain-error')
var getMentions = require('../mentions')

module.exports = function (opts) {
  var self = this
  var api = this.api
  return function (cb) {
    getMentions(self.sbot, opts.text, function (err, mentions, ambigious) {
      if(err) return cb(explain(err, 'could not load mentions'))
      function toPath () {
        return '['+[].join.call(arguments, '][')+']'
      }
      mentions
      if(ambigious.length)
        ambigious.forEach(function (e) {
          mentions.push({name: e[0].name, link: e[0].id})
        })

      function toPath () {
        return '['+[].join.call(arguments, '][')+']'
      }


      cb(null, [
        mentions.map(function (opts) { return api(['avatar'], opts) }),
        u.createHiddenInputs({mentions: mentions}, 'content'),
        ambigious.map(function (e, i) {
          return [
            'div.AmbigiousMentions',
            e[0].name,
            ['input', {
              type: 'hidden',
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
        })
      ])
    })
  }
}
