var h = require('hyperscript')
var ref = require('ssb-ref')

module.exports = function (opts) {
  return function (cb) {
    var sbot = this.sbot
    if(!ref.isFeed(opts.id))
      return cb(new Error('expected valid feed id as id'))
    sbot.names.getImageFor(opts.id, function (err, blobId) {
      sbot.names.getSignifier(opts.id, function (err, name) {
        cb(null,
          h('a', {href: '/profile?id='+opts.id},
            h('img.avatar', {
              src: 'http://localhost:8989/blobs/get/'+blobId,
              title: name+'\n'+opts.id
            })
          )
        )
      })
    })
  }
}

