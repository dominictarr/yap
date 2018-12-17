var u = require('../util')

module.exports = function (opts) {
  var api = this.api
  var sbot = this.sbot
  var context = this.context
  var id = opts.id
  var content = opts.content || opts.meta || {}
  return ['form', {name: 'publish', method: 'POST'},
    //selected id to post from. this should
    //be a dropdown, that only defaults to context.id
    (
      id ?
      ['input', { name: 'id', value: id, type: 'hidden'}] :
      api('identitySelect', {restrict: content.recps, main: false})
    ),
//    opts.suggestedRecps ? api('suggestedRecipients', {suggestedRecps: opts.suggestedRecps, content: content}) : '',
    //root + branch. not shown in interface.
    u.createHiddenInputs(content, 'content'),
    opts.inputs,
    ['button', {type: 'submit', name: 'type', value:'preview'}, opts.name || 'Publish'],
    // TODO: lookup mentions before publishing. (disable for now)
  ]
}





