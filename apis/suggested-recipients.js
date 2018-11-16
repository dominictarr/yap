var ref = require('ssb-ref')
var each = require('libnested').each

module.exports = function (opts, cb) {
  var content = opts.content
  var api = this.api
  var sbot = this.sbot
  var suggested = opts.suggestedRecps
//  var mentioned
//  each(content, function (_value) {
//    if(ref.isFeed(_value) || ref.isMsg(_value)) {
//      mentioned = _value
//      return false
//    }
//  })
  return ['select', {name: '[content][recps]'},
    //default option is the same recipients.
    ['option', {selected: true}, content.recps ? 'Thread Recipients' : 'Public'],
    ['option', {name: '[content][recps]', value: this.id}, 'note to self'],
    ref.isFeed(suggested) && [
      'option', {
        name: '[content][recps]',
        value: [opts.id, suggested].join(',')
      },
      function (cb) {
        sbot.names.getSignifier(suggested, function (err, name) {
          cb(null, 'self and '+name)
        })
      }
    ] || ''
  ]
}









