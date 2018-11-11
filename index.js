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
  //note: opts is post body
  identitySelect: function (opts, cb) {
    var context = this.context
    context.id = opts.id
    cb(null, opts, context)
  },
  preview: function (opts, cb) {
    cb(null, opts)
  },
  publish: function (opts, cb) {
    if(opts.content.recps)
      opts.private = true
    this.sbot.identities.publishAs(opts, function (err, msg) {
      console.log('published:', err, msg)
      if(err) cb(err)
      else cb()
    })
  },
  bounce: function (opts, cb) {
    delete opts.type
    cb(null, opts)
  }
}

function layout(content) {
  return h('html',
    h('head',
      h('meta', {charset: 'UTF-8'}),
      h('link', {href: '/static/style.css', rel: 'stylesheet'})
    ),
    h('body',
        h('div#AppHeader',
          h('h2', 'yap'),
          ['a', {href: '/public'}, 'Public'],
          ['a', {href: '/private'}, 'Private'],
          ['a', {href: '/gatherings'}, 'Gatherings'],
          ['form', {method: 'GET', action: '/search'},
            ['input', {type: 'text', name: 'query', placeholder: 'Search'}],
            ['input', {type: 'hidden', name: 'limit', value: 20}],
            ['button', {}, 'go']
          ],
          this.api.identitySelect.call(this, this.context)
        ),
      h('div.main', content)
    )
  )
}

require('ssb-client')(function (err, sbot) {
  if(err) throw err

  var apis = {}
  nested.map(_apis, function (fn, path) {
    function method (opts) {
      return fn.call(Object.assign({}, this, {sbot: sbot, api: apis}), opts)
    }
    nested.set(apis, path, method)
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
      req.context = QS.parse(req.headers.cookie||'') || {id: sbot.id}
      req.context.id = req.context.id || sbot.id
      next()
     },
    function (req, res, next) {
      if(req.method == 'GET') return next()
      var id = req.context.id || sbot.id
      var self = {context: req.context, sbot: sbot, api: apis}
      pull(
        toPull.source(req),
        pull.collect(function (err, ary) {
          var raw = Buffer.concat(ary).toString('utf8')
          var opts = QS.parse(raw)
          if(opts.type === 'preview') {
            toHTML(layout.call(self, apis.preview({
              key: '%dummy',
              value: {
                author: opts.id,
                content: opts.content
              },
              timestamp: Date.now()
            }))) (function (err, result) {
              if(err) next(err)
              else res.end(result.outerHTML)
            })
            return
          }
          actions[opts.type].call({sbot: sbot, context: req.context}, opts, function (err, _opts, context) {
            if(context) {
              req.context = context
              res.setHeader('set-cookie', QS.stringify(context))
            }
            /*
              after handling the post,
              redirect to a normal page.
              this is a work around for if you hit refresh
              and the browser wants to resubmit the POST.

              I think we want to do this for most types,
              exception is for preview - in which we return
              the same data rendered differently and don't write
              to DB at all.
            */
            res.setHeader('location', req.url)
            res.writeHead(303)
            res.end()
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
      var self = {context: context, api: apis, sbot: sbot}
      var A = fn.call(self, opts)
      toHTML(!opts.embed ? layout.call(self, A) : A) (function (err, result) {
        if(err) next(err)
        else res.end(result.outerHTML)
      })
    }
  )).listen(8000)
})










