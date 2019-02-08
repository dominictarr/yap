var fs = require('fs')
var path = require('path')
var apis = require('./apis')
var nested = require('libnested')
var Stack = require('stack')
var URL = require('url')
var QS = require('qs')
var u = require('./util')
var toHTML = u.toHTML
var h = u.h
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var CacheWatcher = require('./cache-watcher')

var Coherence = require('coherence-framework')

var doctype = '<!DOCTYPE html \n  PUBLIC "-//W3C//DTD HTML 4.01//EN"\n  "http://www.w3.org/TR/html4/strict.dtd">'

//actions may make writes to sbot, or can set things
var actions = {
  //note: opts is post body
  identitySelect: function (opts, apply, req, cb) {
    var context = this.context
    context.id = opts.id
    cb(null, opts, context)
  },
  preview: function (opts, apply, req, cb) {
    cb(null, opts)
  },
  publish: function (opts, apply, req, cb) {
    if(opts.content.recps === '')
      delete opts.content.recps
    else if('string' === typeof opts.content.recps) {
      opts.content.recps = opts.content.recps.split(',')
    }

    if(Array.isArray(opts.content.recps))
      opts.private = true

    sbot.identities.publishAs(opts, function (err, msg) {
      if(err) cb(err)
      else cb()
    })
  },
  bounce: function (opts, cb) {
    delete opts.type
    cb(null, opts)
  }
}

var coherence = Coherence(function (opts, content, apply) {
  return ['html',
    ['head', {profile: "http://www.w3.org/2005/10/profile"},
      ['meta', {charset: 'UTF-8'}],
      ['link', {href: '/static/style.css', rel: 'stylesheet'}],
      ['script', {src: coherence.scriptUrl}],
      ['link', {rel: 'icon', type: 'image/png', href: '/favicon.ico'}],
    ],
    ['body',
      ['div#AppHeader',
        ['nav',
          ['div', {style: 'display:flex;flex-direction:row'},
            ['h2', 'yap'],
            ['img', {src: '/favicon.ico'}]
          ],
          ['a', {href: '/public'}, 'Public'],
          ['a', {href: '/private'}, 'Private'],
//          ['a', {href: '/gatherings'}, 'Gatherings'],
          ['form', {method: 'GET', action: '/search'},
            ['input', {type: 'text', name: 'query', placeholder: 'Search'}],
            ['input', {type: 'hidden', name: 'limit', value: 20}],
            ['button', {}, 'go']
          ],
          apply('identitySelect', {main: true})
        ],
        apply('progress', {})
      ],
      ['div.main', content]
    ]
  ]
})

var favicon = fs.readFileSync(path.join(__dirname, 'static', 'favicon.ico'))

//stack, but check if you called next twice!
function _Stack() {
  var args = [].slice.call(arguments)
  return Stack.apply(this, args.map(function (fn) {
    return function (req, res, next) {
      var err = new Error('already called')
      var called = false
      fn(req, res, function _next (err) {
        if(err) console.error(err)
        if(called) throw called
        called = new Error('called already')
        return next(err)
      })

    }
  }))
}

require('ssb-client')(function (err, sbot) {
  if(err) throw err

  coherence
    .use('avatar',         require('./apis/avatar')(sbot))
    .use('identitySelect', require('./apis/identity-select')(sbot))
    .use('public',         require('./apis/public')(sbot))
    .use('private',        require('./apis/private')(sbot))
    .use('message',        require('./apis/message')(sbot))
    .use('messages/post',  require('./apis/messages/post')(sbot))
    .use('messages/vote',  require('./apis/messages/vote')(sbot))
    .use('progress',       require('./apis/progress')(sbot))
    .use('thread',         require('./apis/thread')(sbot))
    .use('compose',        require('./apis/compose')(sbot))
    .use('publish',        require('./apis/publish')(sbot))
    .use('friends',        require('./apis/friends')(sbot))

  require('http').createServer(_Stack(
    function (req, res, next) {
      console.log(req.method, req.url)
      next()
    },
    //everything breaks if blobs isn't first, but not sure why?
    require('ssb-ws/blobs')(sbot, {prefix: '/blobs'}),
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
      if(req.url == '/favicon.ico')
        return res.end(favicon)
      if(req.url == '/')
        return res.end('<h1>yap<img src="/favicon.ico"></h1>')

      next()
    },
    function collectBody (req, res, next) {
      if(req.method !== "POST") return next()
      else
        pull(
          toPull.source(req),
          pull.collect(function (err, ary) {
            req.body = Buffer.concat(ary).toString('utf8')
            next(err)
          })
        )
    },
    function context (req, res, next) {
      req.context = QS.parse(req.headers.cookie||'') || {id: sbot.id}
      req.context.id = req.context.id || sbot.id
      next()
    },
    //handle posts.
    function (req, res, next) {
      if(req.method == 'GET') return next()
      var id = req.context.id || sbot.id
      var opts = QS.parse(req.body)

      function callApi (path, opts) {
        try {
          var fn = nested.get(apis, path)
          if(!fn) return next()
          return fn(opts, apply, req)
        } catch(err) {
          next(err)
        }
      }
      if(opts.type === 'preview') {
        //  TODO: pass opts.id in, and wether this message
        //  preview should allow recipient selection, or changing id.
        //  api.preview can set the shape of the message if it likes.

        //XXX this isn't working

        toHTML(layout.call(self, callApi(['preview'], opts))) (function (err, result) {
          if(err) next(err)
          else res.end('<!DOCTYPE html>'+result.outerHTML)
        })
        return
      }
      actions[opts.type](opts, apply, req, function (err, _opts, context) {
        if(err) return next(err)
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
    },

    //HANDLE BLOBS
    require('emoji-server')('/img/emoji'),
    function (req, res, next) {
      if(!/\/partial\//.test(req.url)) return next()
      req.url = req.url.substring('/partial'.length)
      render(true, req, res, next)
    },
    //static files
    function (req, res, next) {
      if(/\/static\/[\w\d-_]+\.\w+/.test(req.url)) {
        console.log("STATIC", req.url)
        fs.createReadStream(path.join(__dirname, req.url)).pipe(res)
      } else
        next()
    },
    //mount coherence!
    coherence
  )).listen(8005)
})













