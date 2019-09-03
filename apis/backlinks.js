
function backlinks (sbot, id, cb) {
  var likes = [], backlinks = []
  pull(
    sbot.links({dest: id, values: true}),
    pull.drain(function (e) {
      var content = e.value.content
      var vote = content.vote
      if(isObject(vote) &&
        vote.value == 1 && vote.link == id)
        likes.push(e)
      else if(content.type == 'post' && isArray(content.mentions)) {
        for(var i in content.mentions) {
          var m = content.mentions[i]
          if(m && m.link == id) {
            backlinks.push(e)
            return //if something links twice, don't back link it twice
          }
        }
      }
    }, function () {
      cb(null, likes, backlinks)
    })
  )
}

//XXX should backlinks be built into the layout?
//i.e. assumed to always be a part of the thing?
module.exports = function (sbot) {
  return function (opts) {
    return function (cb) {
      backlinks(sbot, opts.id, function (err, votes, backlinks) {

      })
    }
  }
}
