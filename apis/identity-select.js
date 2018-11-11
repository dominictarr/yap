var cont = require('cont')

module.exports = function (opts) {
  var sbot = this.sbot
  var api = this.api
  var context = this.context
  var main = context.id || sbot.id
  return ['form', {method: 'POST'},
    ['div.IdentitySelector._menu',
      ['input', {type: 'hidden', name: 'type', value: 'identitySelect'}],
      ['div.Menu',
        ['a', {href: toUrl('profile', {id:context.id})},
          api.avatar({id: context.id, name: true, image: true})
        ],
        ['ul',
          function (cb) {
            sbot.identities.list(function (err, ls) {
              if(err) return cb(err)
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
  ]
}








