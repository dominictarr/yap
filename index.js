#! /usr/bin/env node
var fs     = require('fs')
var path   = require('path')
var ref    = require('ssb-ref')
var Stack  = require('stack')

//refactor to ditch these things
var nested = require('libnested')
var pull   = require('pull-stream')
var URL    = require('url')
var QS     = require('qs')
var u      = require('yap-util')
var toHTML = u.toHTML
var uniq   = require('lodash.uniq')

// middleware
var Logger       = require('morgan')
var Emoji        = require('emoji-server')
var Static       = require('ecstatic')
var BodyParser   = require('urlencoded-request-parser')
var FavIcon      = require('serve-favicon')
var Coherence    = require('coherence-framework')

//actions may make writes to sbot, or can set things

require('ssb-client')(function (err, sbot) {
  if(err) throw err
  sbot.identities.main(function (err, id) {
    sbot.id = id

  if(!sbot.id) throw new Error('sbot id missing')
  var coherence = Coherence(require('./layout'))

    //core: render an avatar, select 
    .use('avatar',         require('./apis/avatar')(sbot))
    .use('identitySelect', require('./apis/identity-select')(sbot))
    //called by preview (to clarify who you are mentioning)
    .use('mentions',       require('./apis/mentions')(sbot))
    .use('messageLayout',  require('./message-layout'))

//    .use('messageLink',    require('./apis/message-link')(sbot))
//    .use('channelLink',    require('./apis/channel-link')(sbot))

    //render a single message
    .use('message',        require('./apis/message')(sbot))

//    .map('link', 'msg', 'message')

    //show how much things there are to do...
    .use('progress',       require('./apis/progress')(sbot))

    //core message writing...
    .use('preview',        require('./apis/preview')(sbot))
    .use('compose',        require('./apis/compose')(sbot))
    .use('publish',        require('./apis/publish')(sbot))

    .list('menu') //links to apps, along top of screen.
    .use('more',         require('./apis/more')(sbot))
    .use('search',         require('./apis/search')(sbot))

    .list('extra') //attached to each message, likes, backlinks, etc

    //patchthreads
//    .use('messages/post',  require('./apis/messages/post')(sbot))
//    .use('messages/vote',  require('./apis/messages/vote')(sbot))

    .group('patch', require('yap-patch')(sbot))
    .group('gatherings', require('yap-gatherings')(sbot))
    .group('tags', require('yap-tags')(sbot))
    .setDefault('patch/public')

  console.log(coherence.dump())

  var actions = {
    //note: opts is post body

    //sets id in cookie
    identitySelect: function (opts, req, cb) {
      var context = req.cookies
      context.id = opts.id
      cb(null, null, context)
    },

    //sets id in cookie
    languageSelect: function (opts, req, cb) {
      throw new Error('not implemented yet')
    },

    //theme, in cookie

    publish: function (opts, req, cb) {
      if(opts.content.recps === '')
        delete opts.content.recps
      else if('string' === typeof opts.content.recps) {
        opts.content.recps = opts.content.recps.split(',')
      }

      if(Array.isArray(opts.content.recps))
        opts.private = true
      else if(opts.private && !opts.content.recps) {
        opts.content.recps = uniq(
          [opts.id]
          .concat(opts.content.mentions || [])
          .map(function (e) { return ref.isFeed(e) ? e : ref.isFeed(e.link) ? e.link : null })
          .filter(Boolean)
        )
      }

      sbot.identities.publishAs(opts, function (err, msg) {
        if(err) cb(err)
        else cb()
      })
    }
  }

  require('http').createServer(Stack(
    Logger(),
    //everything breaks if blobs isn't first, but not sure why?
    require('ssb-ws/blobs')(sbot, {prefix: '/blobs'}),
    FavIcon(path.join(__dirname, 'static', 'favicon.ico')),
    BodyParser(),
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
      //just do it this simple way because it works
      //I tried the cookie parser middleware but things got weird.
      req.cookies = QS.parse(req.headers.cookie||'') || {id: sbot.id}
      next()
    },
    //handle posts.
    function (req, res, next) {
      if(req.method == 'GET') return next()
      var id = req.cookies.id || sbot.id
      var opts = req.body

      // handle preview specially, (to confirm a message)

      if(opts.type === 'preview') {
        //  TODO: pass opts.id in, and wether this message
        //  preview should allow recipient selection, or changing id.
        //  api.preview can set the shape of the message if it likes.

        req.url = '/preview?'+QS.stringify(opts)
        return coherence(req, res, next)
      }
      actions[opts.type](opts, req, function (err, _opts, context) {
        if(err) return next(err)
        if(context) {
          req.cookies = context
          res.setHeader('set-Cookie', QS.stringify(context))
        }
        /*
          After handling the post, redirect to a normal page.
          This is a work around for if you hit refresh
          and the browser wants to resubmit the POST.

          I think we want to do this for most types,
          exception is for preview - in which we return
          the same data rendered differently and don't write
          to DB at all.

          Should preview be implemented like this too?
        */
        res.setHeader('location', req.url)
        res.writeHead(303)
        res.end()
      })
    },

    Emoji('/img/emoji'),
    Static({
      root: path.join(__dirname, 'static'), baseDir: '/static'
    }),
    coherence
  )).listen(8005, 'localhost')

  /*
    generic ssb invalidation
    if a message links to another, invalidate the other key.
    (this will get threads, likes, etc)
    if a message links to a feed, invalidate the feed.

    that doesn't cover follows though... but maybe that can be invalidated
    as one thing?
  */

    pull(
      sbot.createLogStream({live: true, old: false, sync: false, private: true}),
      pull.drain(function (data) {
        nested.each(data.value.content, function (v) {
          if(ref.isMsg(v))
            coherence.invalidate(v, data.ts)
          else if(ref.isFeed(v)) {
            coherence.invalidate('in:'+v, data.ts)
            coherence.invalidate('out:'+data.value.author, data.ts)
          }
        })
      })
    )
})})
