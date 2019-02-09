var toUrl = require('../util').toUrl

module.exports = function (sbot) {
  return function (opts, apply, req) {
    var tr = require('../translations')(req.cookies.lang)

    return function (cb) {
      var max = 1.5
      sbot.friends.hops({start: opts.id, reverse: false, max: max}, function (err, follows) {
        if(err) return cb(err)
        sbot.friends.hops({start: opts.id, reverse: true, max: max}, function (err, followers) {
          if(err) return cb(err)
          var friends = {}
          for(var k in followers)
            if(followers[k] <= 0 || followers[k] > max) delete followers[k]
          for(var k in follows) {
            if(followers[k] <= 0 || follows[k] > max) delete follows[k]
            else if(follows[k] > 0 && followers[k] > 0) {
              friends[k] = follows[k]
              delete follows[k]
              delete followers[k]
            }
          }
          var limit = 25
          function group (label, list) {
            return [
              'div.'+label,
              ['h2', tr(label)],
            ].concat(list.slice(0, limit).map(function (e) {
              return apply('avatar', {id: e, image: true, name: false, href: toUrl('friends', {id: e})})
            })).concat(
              //TODO make this a link to a page showing friends.
              list.length > limit ? '...' + tr('AndMore', list.length-limit) : ''
            )
          }

          cb(null, [
            ['h1', tr('FriendsOf'), ' ', apply('avatar', {id: opts.id, image: false, name: true})],
            group('Friends', Object.keys(friends)),
            group('Follows', Object.keys(follows)),
            group('Followers', Object.keys(followers))
          ])
        })
      })
    }
  }
}
