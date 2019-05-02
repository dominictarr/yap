var ref = require('ssb-ref')
var h = require('../util').h
var toUrl = require('../util').toUrl

module.exports = function (sbot) {
  return function (opts, apply) {
    //accept feed directly, so you can do map(api.avatar)
    if(ref.isFeed(opts))
      opts = {id: opts}
    if(ref.isFeed(opts.link))
      opts = {id: opts.link}
    var _image = opts.image !== false //defaults to true
    var _name = opts.name === true //defaults to false

    if(!opts.id) throw new Error('missing id, had:'+JSON.stringify(opts))

    return function (cb) {
      if(!ref.isFeed(opts.id))
        return cb(new Error('expected valid feed id as id'))

      sbot.names.getImageFor(opts.id, function (err, blobId) {
        sbot.names.getSignifier(opts.id, function (err, name) {
          cb(null,
            h('a.Avatar',
              Object.assign(
                {href: opts.href || toUrl('public', {author:opts.id})},
                apply.cacheAttrs(toUrl('avatar', opts), opts.id)
              ),
              _image ? h('img', {
                className:'avatar',
                src: '/blobs/get/'+blobId,
                //getSignifier returns id as name if there isn't a name available.
                title: name !== opts.id ? name+'\n'+opts.id : opts.id
              }) : '',
              _image  && _name ? h('br') : '',
              _name ? name : ''
            )
          )
        })
      })
    }
  }
}


