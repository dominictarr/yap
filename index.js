var _apis = require('./apis')
var nested = require('libnested')
var Stack = require('stack')
var URL = require('url')
var QS = require('querystring')

require('ssb-client')(function (err, sbot) {
  if(err) throw err

  var apis = nested.map(_apis, function (fn, path) {
    return fn
  })

  require('http').createServer(Stack(
    function (req, res, next) {
      var url = URL.parse(req.url)
      var path = url.pathname.split('/').slice(1)
      var opts = QS.parse(url.query)
      var fn = nested.get(apis, path)
      if(!fn) return next()
      var A = fn.call({sbot:sbot, api: apis}, opts)
      if(A.length === 1) //interpret as continuable
        A(function (err, result) {
          if(err) next(err)
          else res.end(result.outerHTML)
        })
      else
        pull(A,
          pull.map(function (e) { return e.outerHTML+'\n' }),
          toPull.sink(res)
        )
    }
  )).listen(8000)

})













