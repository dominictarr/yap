

module.exports = function (sbot) {
  return function (opts, apply, req) {
    console.log(req.cookies)
    var context = req.cookies || {}
    var id = context.id
    return function (cb) {
      sbot.notifications.get({id: id}, function (err, keys) {
        cb(null, Object.keys(keys).map(function (key) {
          return ['div',['div', ['code', key]], ' ', ['label', new Date(keys[key]).toString()]]
        }))
      })
    }
  }
}


