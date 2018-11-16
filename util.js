var URL = require('url')
var QS = require('querystring')
var hyperscript = require('hyperscript')
var cpara = require('cont').para
var pull = require('pull-stream')
var paramap = require('pull-paramap')
var nested = require('libnested')
var renderer = require('ssb-markdown')
var ref = require('ssb-ref')
var htmlEscape = require('html-escape')
function isFunction (f) {
  return 'function' === typeof f
}

var isArray = Array.isArray

function isEmpty (e) {
  for(var k in e) return false
  return true
}

function isString (s) {
  return 'string' === typeof s
}

exports.toUrl = function toUrl(path, opts) {
  return '/'+(
    Array.isArray(path) ? path.join('/') : ''+path
  ) + (
    !isEmpty(opts) ? '?'+QS.encode(opts) : ''
  )
}
exports.h = function () {
  return [].slice.call(arguments)
}

function toCont (f) {
  if(f.length === 1) return function (cb) {
    f(function (err, hs) {
      exports.toHTML(hs)(cb)
    })
  }
  else if(f.length === 2)
    return function (cb) {
      pull(
        f,
        paramap(function (e, cb) {
          exports.toHTML(e)(cb)
        }, 32),
        pull.collect(cb)
      )
    }
}

function flatten (a) {
  var _a = []
  for(var i = 0; i < a.length; i++)
    if(isArray(a[i]) && !isString(a[i][0]))
      _a = _a.concat(flatten(a[i]))
    else
      _a.push(a[i])
  return _a
}


//even better would be streaming html,
//not just into arrays.
var k = 0
exports.toHTML = function toHTML (hs) {
  return function (cb) {
    if(!isFunction(cb)) throw new Error('cb must be a function, was:'+cb)

    var C = (
      isFunction(hs) ? toCont(hs)
    : isArray(hs) ? cpara(hs.map(toHTML))
    : function (cb) {
        cb(null, hs)
      }
    )

    C(function (err, val) {
      if(err) cb(err)
      else if(isArray(val) && isString(val[0])) {
        cb(null, hyperscript.apply(null, flatten(val)))
      } else
        cb(null, val)
    })
  }
}

exports.createHiddenInputs = function createHiddenInputs (meta, _path) {
  _path = _path ? [].concat(_path) : []
  var hidden = []
  nested.each(meta, function (value, path) {
    if(value !== undefined)
      hidden.push(['input', {
        name: _path.concat(path).map(function (e) { return '['+e+']' }).join(''),
        value: value,
        type: 'hidden'
      }])
  }, true)
  return hidden
}

var cacheId = exports.cacheId = function (id) {
  return '_'+Buffer.from(id.substring(1, 12), 'base64').toString('hex')
}
exports.cacheTag = function (url, id, time) {
  if(time)
    return ['link', {
      rel: 'partial-refresh', href: url, id: cacheId(id), 'data-cache': ''+time
    }]
}


function renderEmoji (emoji, url) {
  if (!url) return ':' + emoji + ':'
  return `
    <img
      src="${htmlEscape(url)}"
      alt=":${htmlEscape(emoji)}:"
      title=":${htmlEscape(emoji)}:"
      class="emoji"
    >
  `
}

//copied from patchwork
exports.markdown = function markdown (content) {
  if (typeof content === 'string') { content = { text: content } }
  var mentions = {}
  var typeLookup = {}
  var emojiMentions = {}
  if (Array.isArray(content.mentions)) {
    content.mentions.forEach(function (link) {
      if (link && link.link && link.type) {
        typeLookup[link.link] = link.type
      }
      if (link && link.name && link.link) {
        if (link.emoji) {
          // handle custom emoji
          emojiMentions[link.name] = link.link
        } else {
          // handle old-style patchwork v2 mentions (deprecated)
          mentions['@' + link.name] = link.link
        }
      }
    })
  }

  var blobsUrl = '/blobs/get/'
  var emojiUrl = '/img/emoji/'

  function id2Url (id) {
    return (
        ref.isMsg(id) ? '/thread?id='+encodeURIComponent(id)
      : ref.isBlobLink(id) ? blobsUrl+encodeURIComponent(id)
      : ref.isFeed(id) ? '/public?author='+encodeURIComponent(id)
      : id
    )
  }

  return ['div.Markdown', {
    innerHTML: renderer.block(content.text, {
      emoji: (emoji) => {
        var url = emojiMentions[emoji]
          ? blobsUrl + emojiMentions[emoji]
          : emojiUrl + emoji + '.png'
        return renderEmoji(emoji, url)
      },
      toUrl: (id) => {
        var link = ref.parseLink(id)
        if (link && ref.isBlob(link.link)) {
          var url = blobsUrl+link.link
          var query = {}
          if (link.query && link.query.unbox) query['unbox'] = link.query.unbox
          if (typeLookup[link.link]) query['contentType'] = typeLookup[link.link]
          return url + '?' + QS.stringify(query)
        } else if (link || id.startsWith('#') || id.startsWith('?')) {
          return id2Url(id)
        } else if (mentions[id]) {
          // handle old-style patchwork v2 mentions (deprecated)
          return id2Url(mentions[id])
        }
        return false
      },
      imageLink: function (id) {
        return id2Url(id)
      }
    })
  }]
}

exports.createRenderer = function (render) {
  return function (opts) {
    var self = this
    var sbot = this.sbot
    if(opts.id && ref.isMsgLink(opts.id))
      return function (cb) {
        sbot.get({id:opts.id, private: true}, function (err, msg) {
          if(err) return cb(err)
          var data = {key: opts.id, value: msg, timestamp: msg.timestamp || Date.now() }
          cb(null, render.call(self, data))
        })
      }
    else if(opts.key && opts.value)
      return render.call(self, opts)
  }
}


