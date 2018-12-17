var ref = require('ssb-ref')
var u = require('../util')
function IdentitySelect(sbot, main, restrict) {
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

module.exports = function (opts) {
  var api = this.api
  var sbot = this.sbot
  var context = this.context
  var id = opts.id
  var meta = opts.meta || opts.content
  return api('publish', {
    id: opts.id,
    content: opts.meta || opts.content,
    inputs:
      ['textarea', {name: 'content[text]'}],
    name: 'Preview'
  })
/*
  return ['form', {name: 'publish', method: 'POST'},
    //selected id to post from. this should
    //be a dropdown, that only defaults to context.id
    (
      id ?
      ['input', { name: 'id', value: id, type: 'hidden'}] :
      api('identitySelect', {})
 //     IdentitySelect(sbot, context.id || sbot.id)
    ),
    //root + branch. not shown in interface.
    u.createHiddenInputs(meta, 'content'),

    ['input', {type: 'submit', name: 'type', value:'preview'}, 'Preview'],
    // TODO: lookup mentions before publishing. (disable for now)
    ['input', {type: 'submit', name: 'type', value:'publish', disabled: true}, 'Publish'],
  ]
*/
}




