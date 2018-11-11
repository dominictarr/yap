var cacheId = require('./util').cacheId
var HashLRU = require('hashlru')
var pull = require('pull-stream')
var nested = require('libnested')

module.exports = function (sbot) {
  var cache = HashLRU(1024)
  function latest (cb) {
    var source = sbot.createLogStream({limit: 1, reverse:true, raw: true, values: false})
    source(null, function (err, seq) {
      if(err) cb(err)
      source(true, function () {
        cb(null, seq)
      })
    })
  }

  var since, start, timer, watching
  ;(function watch () {
    function reschedule (delay) {
      if(watching) return
      clearTimeout(timer)
      timer = setTimeout(watch, delay*Math.random() + delay/2)
    }

    watching = true
    latest(function (err, seq) {
      console.log("LATEST", err, seq)
      if(err) {
        watching = false
        //something wen't wrong, clear the whole cache,
        //reload everything, but it's probably broken
        //otherwise this would not have errored.
        cache.clear()
        rescheduce(10e3)
        return
      }
      if(!start) {
        start = since = seq //only the very first time
      }

      //if it's been more that 256 messages (based on average size)
      //since we last checked, just clear everything out.
      if(seq > since + 256*1024) {
        watching = false
        start = seq
        cache.clear()
      }

      pull(
        sbot.createLogStream({
          limit: 256, gt: since, raw: true, live: true
        }),
        pull.drain(function (data) {
          var seq = data.seq
          data = data.value
          var content = data.value.content
          nested.each(function (value) {
            if(ref.isMsg(value) || ref.isFeed(value)) {
              console.error('invalidate', value, seq)
              cache.set(cacheId(value), seq)
            }
          }, true)
          since = seq
        }, function () {
          watching = false
          reschedule(10e3)
        })
      )
    })
  })()

  //returns true if you need to revalidate
  return {
    since: function () {
      if(since === undefined) throw new Error('since undefined')
      return since
    },
    //check wether an id needs to be revalidated.
    //answer can be YES, NO or MAYBE.
    //treating MAYBE like YES is called "optimistic" in computer science.
    //we only keep track of recently updated things.
    //user requests an update, and provides an id and the sequence.
    //the sequence indicates how recent their value is.
    //if we have a more recent sequence for that id, then YES. revalidate.
    //if their sequence is older than the range we've been watching
    //answer is MAYBE.
    //if the sequence is is recent (since we've been watching)
    //but hasn't changed then NO.

    check: function checkRevalidate (id, seq) {
      var _seq = cache.get(id)
      //the cached value is within the range we have been tracking
      console.log('check', _seq, seq, id)
      if(seq >= since)
        //revalidate if we have a new value for that id
        return _seq && _seq > seq ? _seq : undefined //"yes" or "no".
      //if the value is really old "maybe"
      else if(seq <= since)
        return -1
      //we just return true or false. true means yes or maybe.
    },
    ///testing only
    _dump: function () {
      return cache._store
    }
  }
}

