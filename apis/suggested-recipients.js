var ref = require('ssb-ref')
var each = require('libnested').each

module.exports = function (sbot) {
  return function (opts, apply, req) {
    var content = opts.content
    var suggested = opts.suggestedRecps
    var tr = require('../translations')(req.cookies.lang)
  //  var mentioned
  //  each(content, function (_value) {
  //    if(ref.isFeed(_value) || ref.isMsg(_value)) {
  //      mentioned = _value
  //      return false
  //    }
  //  })
    return ['select', {name: '[content][recps]'},
      //default option is the same recipients.
      ['option', {selected: true, value: ''}, content.recps ? tr('ThreadRecipients') : tr('PublicRecpients')],
      ['option', {name: '[content][recps]', value: opts.id}, tr('SelfRecipents')],
      ref.isFeed(suggested) && [
        'option', {
          name: '[content][recps]',
          value: [opts.id, suggested].join(',')
        },
        function (cb) {
          sbot.names.getSignifier(suggested, function (err, name) {
            cb(null, tr('SelfAndRecipients'), ' ', name)
          })
        }
      ] || ''
    ]
  }
}
