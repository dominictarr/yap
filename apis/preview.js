var u = require('yap-util')
var getMentions = require('../mentions')

function toRecps (ary) {
  return ary.map(function (e) {
    return 'string' === typeof e ? e : e.link
  }).filter(Boolean).join(',')
}

module.exports = function (sbot) {
  return function (opts, apply, req) {
    var id = opts.id
    var content = opts.content
    var tr = require('../translations')(req.cookies.lang)

    //fake message, with enough fields to give to message renderer
    var data = {
      key: '%................',
      value: {
        author: id,
        content: content
      }
    }
    return ['div.MessagePreview',
      apply('message', data),
      ['form',
        {name: 'publish', method: 'POST'},
        //TODO: enable changing the identity to publish as here

        // for a message already related to something, such as a yup
        // or a follow, it is easier to have just a couple of choices
        // post the message to your self, or to the poster and yourself.
        opts.suggestedRecps ?
        apply('suggestedRecipients', opts) : '',

        // for a private post, obviously you'd want to be able to
        // include anyone.... TODO that

        ['input', {type: 'hidden', name: 'id', value: data.value.author}],
        opts.private ?  ['input', {type: 'hidden', name: 'private', value: data.value.author}] : '',
        u.createHiddenInputs(data.value.content, 'content'),
        apply('mentions', data.value.content),
        ['button', {name: 'type', value: 'publish'}, tr('Publish')]
      ]
    ]

    //TODO: add form to set recipients, and change author.
    //press back to edit body of the message again...
    //submit takes you to back to the thread page.
  }
}


