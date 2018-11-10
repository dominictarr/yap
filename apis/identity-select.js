var cont = require('cont')

module.exports = function (opts) {
  var sbot = this.sbot
  var context = this.context
  var main = context.id || sbot.id
  console.log('CONTEXT', context)
  return ['form', {method: 'POST'},
    ['input', {type: 'hidden', name: 'type', value: 'identity-select'}],
    ['pre', JSON.stringify(context)],
    ['div.Menu',
      ['button', context.id],
      ['ul',
        function (cb) {
          sbot.identities.list(function (err, ls) {
            cont.para(ls.filter(function (e) {
              return e != context.id
            }).map(function (id) {
              return function (cb) {
                sbot.names.getSignifier(id, function (err, name) {
                  cb(null, ['li', ['button', {type: 'submit', name: 'id', value: id}, name]])
                })
              }
            }))(cb)
          })
        }
      ]
    ]
  ]
}




