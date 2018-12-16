

module.exports = function (opts) {
  var sbot = this.sbot
  var api = this.api
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
        console.log('friends', friends)
        var limit = 25
        function group (label, list) {
          return [
            'div.'+label,
            ['h2', label],
          ].concat(list.slice(0, limit).map(function (e) {
            return api(['avatar'], {id: e, image: true, name: false})
          })).concat(
            //TODO make this a link to a page showing friends.
            list.length > limit ? '...and '+(list.length-limit)+' more' : ''
          )
        }

        cb(null, [
          ['h1', 'Friends of ', api(['avatar'], {id: opts.id, image: false, name: true})],
          group('Friends', Object.keys(friends)),
          group('Follows', Object.keys(follows)),
          group('Followers', Object.keys(followers))
        ])
      })
    })
  }
}





























