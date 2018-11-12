
module.exports = function (opts) {
  var sbot = this.sbot
  return function (cb) {
    sbot.get(opts, function (err, value) {
      if(err) cb(err)
      else cb(null, ['pre', JSON.stringify(value, null, 2)])
    })
  }
}
