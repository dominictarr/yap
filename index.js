var fs = require('fs')
var path = require('path')
var _apis = require('./apis')
var nested = require('libnested')
var Stack = require('stack')
var URL = require('url')
var QS = require('qs')
var u = require('./util')
var toHTML = u.toHTML
var h = u.h
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')

//actions may make writes to sbot, or can set things
var actions = {
  'identity-select': function (opts, cb) {
    var context = this.context
    context.id = opts.id
    cb(null, opts, context)
  }
}

function layout(content) {
  return h('html',
    h('head',
      h('link', {href: '/static/style.css', rel: 'stylesheet'})
    ),
    h('body',
      h('div#AppNeck', h('div#AppHeader', h('h2', 'welcome to patchya!'))),
      h('div.main', content)
    )
  )
}

require('ssb-client')(function (err, sbot) {
  if(err) throw err

  var apis = nested.map(_apis, function (fn, path) {
    return function (opts) {
      return fn.call({sbot:sbot,api:apis, context: this.context}, opts)
    }
  })

  require('http').createServer(Stack(
    /*
      some settings we want to store in a cookie:
        * current identity
        * current language

      stuff that shouldn't be in links.
      this makes it possible to share links without including
      state people might not want for them.
      also: light/dark theme etc
    */
    function (req, res, next) {
      req.context = QS.parse(req.headers.cookie||'')
      next()
     },
    function (req, res, next) {
      if(req.method == 'GET') return next()
      console.log(req.method, req.url)
      pull(
        toPull.source(req),
        pull.collect(function (err, ary) {
          var raw = Buffer.concat(ary).toString('utf8')
          var opts = QS.parse(raw)
          actions[opts.type].call({sbot: sbot, context: req.context}, opts, function (err, opts, context) {
            req.context = context
            res.setHeader('set-cookie', QS.stringify(context))
            req.method = 'GET'
            next()
          })
        })
      )
    },
    function (req, res, next) {
      if(/\/static\/[\w\d-_]+\.\w+/.test(req.url))
        fs.createReadStream(path.join(__dirname, req.url))
        .pipe(res)
      else
        next()
    },
    function (req, res, next) {
      var url = URL.parse(req.url)
      var path = url.pathname.split('/').slice(1)
      var opts = QS.parse(url.query)
      var context = req.context
      var fn = nested.get(apis, path)
      if(!fn) return next()
      var A = fn.call({context: context}, opts)
      toHTML(!opts.embed ? layout(A) : A) (function (err, result) {
        if(err) next(err)
        else res.end(result.outerHTML)
      })
    }
  )).listen(8000)
})

