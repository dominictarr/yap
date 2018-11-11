var u = require('../util')

var render = require('./message').render
module.exports = function (data) {
  var sbot = this.sbot, context = this.context, api = this.api
  console.log("PREVIEW", data)
  return ['div.MessagePreview',
    ['form',
      {name: 'publish', method: 'POST'},
      //TODO: enable changing the identity to publish as here
      ['input', {type: 'hidden', name: 'id', value: data.value.author}],
      render(sbot, api, data),
      u.createHiddenInputs(data.value.content, 'content'),
      ['button', {name: 'type', value: 'publish'}, 'Publish']
  ]]
  //TODO: add form to set recipients, and change author.
  //press back to edit body of the message again...
  //submit takes you to back to the thread page.
}


