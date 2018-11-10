var ref = require('ssb-ref')
var h = require('../util').h

module.exports = function (opts) {
  var sbot = this.sbot
  return function (cb) {
    if(!ref.isFeed(opts.id))
      return cb(new Error('expected valid feed id as id'))
    sbot.names.getImageFor(opts.id, function (err, blobId) {
      sbot.names.getSignifier(opts.id, function (err, name) {
        cb(null,
          h('a', {href: '/profile?id='+opts.id},
            h('img', {className:'avatar', 
              src: 'http://localhost:8989/blobs/get/'+blobId,
              title: name+'\n'+opts.id
            })
          )
        )
      })
    })
  }
}




