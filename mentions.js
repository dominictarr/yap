var mentions = require('ssb-mentions')

/*
  when javascript is turned off we can't use auto predict.
  this method lets you just enter the names as raw mentions,
  @{name} and then looks up the names you might use.
  * if it's unambigious it uses that key.
  * if there is more than one with that name, but only
    one that you call that name (other peers can use the same name)
    then it chooses the one you use.
  * if there are more than one feed you call that name,
    make a dropdown select which one you will mention.

*/

function simpleAt (text) {
  var rx = /(?:^|\s)(@[\w\-_\d\!]+)/g
  var a = []
  var match = rx.exec(text)
  while(match) {
    a.push({name:match[1].substring(1), link: false})
    match = rx.exec(text)
  }
  return a

}

function _mentions (text, cb) {
  var m = mentions(text)
  simpleAt(text).forEach(function (e) {
    for(var i = 0; i < m.length; i++)
      if(m[i].name == e.name) return
    m.push(e)
  })
  return m
}

function lookup (sbot, name, cb) {
  var mention = {name: name, link: null}
  sbot.names.getSignifies(name, function (err, names) {
    if(names && names.length) {
      names = names.filter(function (e) {
        return e.name == name
      })
      var first = names[0]
      names = names.filter(function (e, i) {
        return !i || first.id !== e.id
      })
      if(names.length) {
        var _names = names.filter(function (e) {
          return e.named === name
        })
        if(_names.length === 1)
          return cb(null, _names[0].id)
      }
      if(names.length === 1)
        cb(null, first.id)
      else
        cb(null, null, names)
    }
  })
}

module.exports = function (sbot, text, cb) {
  var m = _mentions(text), n = 1, ambigious = []
  m.forEach(function (mention, i) {
    if(mention.name && mention.link === false) {
      n++
      lookup(sbot, mention.name, function (err,  link, names) {
        if(err) return next(err)

        if(link) mention.link = link
        else ambigious.push(names)

        next()
      })
    }
  })

  next()

  function next (err) {
    if(n>=0 && err) {
      n = -1
      cb(err)
    }
    if(--n) return
    cb(null, m, ambigious)
  }
}

if(!module.parent)
  require('ssb-client')(function (err, sbot) {
    if(err) throw err
    module.exports(sbot, process.argv[2], function (err, data, ambigious) {
      if(err) throw err
      console.log(JSON.stringify(data, null, 2))
      console.log(JSON.stringify(ambigious, null, 2))
      sbot.close()
    })
  })


