var cont = require('cont')

module.exports = function (opts) {
  var sbot = this.sbot
  var api = this.api
  var context = this.context
  var main = context.id || sbot.id
  var restrict = opts.restrict
  //form to switch the main identity
  if(false && opts.main === true)
    return ['form', {method: 'POST'},
      ['div.IdentitySelector._menu',
        ['input', {type: 'hidden', name: 'type', value: 'identitySelect'}],
        ['div.Menu',
          api('avatar', {id: context.id, image: true, name: false}),
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
  else {//an input to select id to publish a form from.

    if(restrict)
      restrict = [].concat(restrict).map(function (e) {
        return 'string' == typeof e ? e : e.link
      }).filter(ref.isFeed)

    return function (cb) {
      sbot.identities.list(function (err, ls) {
        //move main identity to the front
        console.log('main', main, ls.indexOf(main))
        console.log('list', ls)
        ls.splice(ls.indexOf(main), 1)
        ls.unshift(main)
        console.log('after', ls)

        cb(null, [
          'select', {name: 'id'},
        ].concat(ls.map(function (id) {
          return function (cb) {
            sbot.names.getSignifier(id, function (_, name) {
              cb(null, ['option', {value: id, selected:id == main ? true : undefined}, name || id.substring(0, 10)])
            })
          }
        })) )
      })
    }
  }
}

