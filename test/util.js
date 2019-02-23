
var tape = require('tape')

var u = require('../util')

tape('clean', function (t) {
  t.deepEqual(u.cleanOpts({
      private: undefined,
      content: {channel: 'foo'}
    }),
    {content: {channel: 'foo'}}
  )
  t.deepEqual(u.cleanOpts({one: 1}),
    {one: 1}
  )
  t.deepEqual(u.cleanOpts({undef: undefined}),
    undefined
  )

  t.end()
})







