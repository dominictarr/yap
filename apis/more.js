var niceAgo = require('nice-ago')
var pull = require('pull-stream')
var u = require('yap-util')

module.exports = function (sbot) {
  return function (opts, apply) {
    var _opts = u.createQuery(opts, {limit: 1})
    return function (cb) {
      pull(
        sbot.query.read(_opts),
        pull.collect(function (err, ary) {
          //check if there are more messages in this direction
          cb(err, ['a'+(ary.length ? '.more' : '.no-more'),
            Object.assign(
              {
                href: opts.href,
                title: opts.title
              },
              apply.cacheAttrs(apply.toUrl('more', opts), 'more', apply.since)
            ),
            opts.label
          ])
        })
      )
    }
  }
}
